import { LitElement, html, css } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { ref, createRef } from "lit/directives/ref.js";
import { cache } from "lit/directives/cache.js";
import binarySearch from "../binarySearch.js";
import "./list-element.js";
import $throttle from "lodash.throttle";

const createView = (item) => {
  // console.count("CREATE VIEW")
  return {
    item,
    uid: Math.floor(Math.random() * 10000000),
    ready: false,
  };
};

function createSizeRecord(itemsMap, items, intitialSize, index) {
  const sizeRecord = {
    size: intitialSize,
    _start: index === 0 ? 0 : itemsMap.get(items[index - 1]).getEnd() + 1,
    index,
  };
  sizeRecord.getStart = () => sizeRecord._start;
  sizeRecord.getEnd = () => sizeRecord._start + sizeRecord.size;
  return sizeRecord;
}

export default class UVList extends LitElement {
  static properties = {
    items: { type: Array },
    initialSize: { type: Number },
    buffer: { type: Number },
    renderItem: { type: Function },
    selectedId: { type: [Number, String] },
    before: { type: Function },
    after: { type: Function },
    empty: { type: Function },
    keyboardEnabled: { type: Boolean },
    keyboardThrottle: { type: Number },
    vimNavigation: { type: Boolean },
  };
  scrollerStart = 0;
  scrollTimeout = null;
  scrollerPadding = 0;
  oldScrollerPadding = 0;
  views = [];
  readyViews = [];
  preparedViews = [];
  unusedViews = [];
  autoScroll = false;
  selectedIndex = 0;
  navKeys = [];
  pool = [];

  static styles = css`
    .uv-list__wrapper {
      height: 100%;
      overflow-y: auto;
      position: relative;
    }
    .uv-list__scroller {
      box-sizing: border-box;
    }
  `;

  constructor() {
    super();

    this.buffer = 100;

    this.wrapperRef = createRef();
    this.wrapperTop = 0;

    this.scrollerRef = createRef();
    this.scrollerStart = 0;
    this.listSize = 0;

    this.wrapperBottom = 0;

    this.itemsMap = new WeakMap();
    this.initialSize = 50;

    this.keyboardEnabled = false;
    this.vimNavigation = false;
    this.keyboardThrottle = 0;

    this.renderView = this.renderView.bind(this);
    this.scrollerSize = 0;

    this.beforeRef = createRef();
    this.afterRef = createRef();

    this.resizeObserver = new ResizeObserver((entries) => {
      this.handleScroll();
    });

    this.intersectionObserver = null;

    this.navKeys = () => [
      ...["ArrowUp", "ArrowDown"],
      ...(this.vimNavigation ? ["j", "k", "о", "л"] : []),
    ];
    this.keysUp = () => [
      ...["ArrowUp"],
      ...(this.vimNavigation ? ["k", "л"] : []),
    ];
    this.keysDown = () => [
      ...["ArrowDown"],
      ...(this.vimNavigation ? ["j", "о"] : []),
    ];

    this.onKeyboardNav = this.onKeyboardNav.bind(this);
    this.handleElementResize = this.handleElementResize.bind(this);
    this.updateVisibleItems = this.updateVisibleItems.bind(this)
    this.updateFrameReq = null
  }

  createRenderRoot() {
    return this;
  }

  firstUpdated() {
    const { top, height } = this.wrapperRef.value.getBoundingClientRect();
    this.wrapperTop = top;
    this.wrapperBottom = top + height;
    this.wrapperSize = height;
    this.wrapperRef.value.addEventListener(
      "scroll",
      this.handleScroll.bind(this),
      { passive: true },
    );
    this.resizeObserver.observe(this.wrapperRef.value);
    this.listSize = this.items.length * this.initialSize;
    this.scrollerPadding = 0;
    this.scrollerSize = this.listSize - this.scrollerPadding;
    // this.createItemsMap();
    this.intersectionObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target.dataset.role === "before") {
              this.dispatchEvent(new Event("reachedStart"));
            }
            if (entry.target.dataset.role === "after") {
              this.dispatchEvent(new Event("reachedEnd"));
            }
          }
        });
      },
      {
        root: this.wrapperRef.value,
      },
    );
    if (this.before) {
      this.intersectionObserver.observe(this.beforeRef?.value);
    }
    if (this.after) {
      this.intersectionObserver.observe(this.afterRef?.value);
    }

    const onNav =
      this.keyboardThrottle > 0
        ? $throttle(this.onKeyboardNav, this.keyboardThrottle).bind(this)
        : this.onKeyboardNav.bind(this);

    document.addEventListener("keydown", (event) => {
      if (this.navKeys().includes(event.key)) {
        event.stopPropagation();
        event.preventDefault();
        onNav(event);
      }
    });

    if (this.selectedId !== null) {
      this.selectedIndex = this.items.findIndex(
        (item) => item.id === this.selectedId,
      );
    }
    this.updateItemsMap();
    this.updateVisibleItems();
  }

  async scheduleUpdate() {
    await new Promise((resolve) => setTimeout(() => resolve()));
    // await new Promise((resolve) => requestAnimationFrame(() => resolve()));
    return super.scheduleUpdate();
  }

  willUpdate(changedProperties) {
    if (changedProperties.has("items")) {
      this.selectedIndex = this.items.findIndex(
        (item) => item.id === this.selectedId,
      );
      this.updateItemsMap();
      // window.cancelAnimationFrame(this.updateFrameReq)
      this.updateFrameReq = window.requestAnimationFrame(this.updateVisibleItems);
    }
    if (
      changedProperties.has("selectedId") &&
      changedProperties.get("selectedId") !== this.selectedId
    ) {
      this.selectedIndex = this.items.findIndex(
        (item) => item.id === this.selectedId,
      );
    }
  }

  handleScroll() {
    if (!this.scrollerRef?.value) return;
    // console.log(this.autoScroll)
    this.scrollerStart =
      this.scrollerRef.value.getBoundingClientRect().top - this.wrapperTop;
    if (this.autoScroll) {
      this.autoScroll = false
      return
    }
    // window.cancelAnimationFrame(this.updateFrameReq)
    this.updateFrameReq = window.requestAnimationFrame(this.updateVisibleItems);
  }

  updateItemsMap() {
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      const existed = this.itemsMap.get(item);
      const size = existed?.size ?? this.initialSize;
      this.itemsMap.set(
        item,
        createSizeRecord(this.itemsMap, this.items, size, i),
      );
    }
  }

  updateRecord(index) {
    for (let i = index; i < this.items.length; i++) {
      const item = this.items[i];
      const sizeRecord = this.itemsMap.get(item);
      if (i === 0) {
        sizeRecord._start = 0;
      } else {
        const prevItem = this.items[i - 1];
        const prevSizeRecord = this.itemsMap.get(prevItem);
        sizeRecord._start = prevSizeRecord.getEnd() + 1;
      }
    }
  }

  handleElementResize({ item, size, index, view }) {
    window.requestAnimationFrame(() => {
      if (!this.wrapperRef?.value || !item) return;
      const mapItem = this.itemsMap.get(item);
      if (mapItem.size !== size) {
        const diff = mapItem.size - size;
        mapItem.size = size;
        mapItem._dirty = true;
        const nextMapItem = this.itemsMap.get(this.items[index + 1]);
        if (nextMapItem) {
          nextMapItem._start += diff;
        }
        this.updateRecord(mapItem.index);
        this.oldScrollerPadding = this.scrollerPadding;
        // FIXME sometimes there is flickering with scroll
        this.scrollerPadding =
          this.itemsMap.get(this.readyViews[0]?.item ?? null)?.getStart() ??
          this.scrollerPadding;

        this.wrapperRef.value.scrollTop +=
          this.scrollerPadding - this.oldScrollerPadding;
        this.wrapperSize = this.wrapperRef.value.getBoundingClientRect().height;
        view.ready = true
        this.autoScroll = true
        this.requestUpdate();
      }
    });
  }

  firstVisible(withBuffer = true) {
    const found = binarySearch(this.items, (item) => {
      const end = this.itemsMap.get(item)?.getEnd() ?? 0;
      return 0 <= end + (withBuffer ? this.buffer : 0) + this.scrollerStart;
    });
    return found === this.items.length ? 0 : found;
  }

  lastVisible(withBuffer = true) {
    const found = binarySearch(this.items, (item) => {
      const start = this.itemsMap.get(item)?.getStart() ?? 0;
      return (
        0 <
        start -
          (withBuffer ? this.buffer : 0) +
          this.scrollerStart -
          this.wrapperSize +
          this.wrapperTop
      );
    });
    // TODO: What it was for?
    // return found + 1;
    return found;
  }

  calculateVisibility() {
    let first = this.firstVisible();
    let last = this.lastVisible();
    if (first <= 5) {
      first = 0;
    } else {
      first = first - 5;
    }
    if (this.items.length - last <= 5) {
      last = this.items.length;
    } else {
      last = last + 5;
    }
    return this.items.slice(first, last);
  }

  updateVisibleItems() {
    // window.cancelAnimationFrame(this.updateFrameReq)
    // console.trace("UPDATE VISIBLE")
    // window.requestAnimationFrame(() => {
      const visible = this.calculateVisibility()
      // this.pool.forEach(view => view.isUsed = false)
      // const newViews = [...this.pool]
      const newViews = []
      for (let i = 0; i < visible.length; i++) {
        const item = visible[i];
        // const newView = this.pool.shift() ?? createView(item)
        const newView = this.pool.pop() ?? createView(item)
        // console.log(this.pool.length)

        newView.item = item
        newView.ready = false
        // newView.isUsed = true
        newViews.push(newView)
      }
      // newViews.sort((one, two) => one.item.index - two.item.index);
      this.pool = newViews

      this.listSize =
        this.itemsMap.get(this.items[this.items.length - 1])?.getEnd() ??
        this.listSize;
      this.oldScrollerPadding = this.scrollerPadding;
      this.scrollerPadding =
        this.itemsMap.get(this.readyViews[0]?.item ?? null)?.getStart() ??
        this.scrollerPadding;
      this.scrollerSize = this.listSize - this.scrollerPadding;
      this.requestUpdate();
    // });
  }

  onElementSelected(event) {
    this.selectedId = event.detail?.item?.id;
  }

  scrollToItem(index) {
    const item = this.items[index];
    const start = this.itemsMap.get(item)?.getStart() ?? null;
    if (start !== null && this.wrapperRef.value) {
      this.wrapperRef.value.scrollTop = start;
    }
  }

  scrollToTop() {
    this.wrapperRef.value.scrollTop = 0;
  }

  onKeyboardNav(event) {
    if (!this.keyboardEnabled) return;
    if (this.navKeys().includes(event.key)) {
      event.stopPropagation();
      event.preventDefault();

      if (this.selectedId === null) return;
      if (this.keysUp().includes(event.key)) {
        this.navUp();
      }

      if (this.keysDown().includes(event.key)) {
        this.navDown();
      }
    }
  }

  navUp() {
    if (this.selectedIndex === 0) {
      if (this.wrapperRef.value.scrollTop > 0) {
        this.wrapperRef.value.scrollTop = 0;
      }
      return;
    }
    this.selectedIndex--;
    const item = this.items[this.selectedIndex];
    if (!item) {
      this.selectedIndex++;
      return;
    }
    this.selectedId = item.id;
    const record = this.itemsMap.get(item);
    if (record.getStart() < this.wrapperRef.value.scrollTop) {
      this.scrollToItem(this.selectedIndex);
    }
    this.dispatchEvent(
      new CustomEvent("selected", {
        composed: true,
        bubbles: true,
        detail: { item },
      }),
    );
  }

  navDown() {
    if (this.selectedIndex === this.items.length - 1) {
      if (
        this.wrapperRef.value.scrollTop !== this.wrapperRef.value.scrollHeight
      ) {
        this.wrapperRef.value.scrollTop = this.wrapperRef.value.scrollHeight;
      }
      return;
    }
    this.selectedIndex++;
    const item = this.items[this.selectedIndex];
    if (!item) {
      this.selectedIndex--;
      return;
    }
    this.selectedId = item.id;
    const record = this.itemsMap.get(item);
    if (
      record &&
      record.getEnd() > this.wrapperRef.value.scrollTop + this.wrapperSize
    ) {
      this.wrapperRef.value.scrollTop = record.getEnd() - this.wrapperSize;
    }

    this.dispatchEvent(
      new CustomEvent("selected", {
        composed: true,
        bubbles: true,
        detail: { item },
      }),
    );
  }

  renderView(view) {
    const mapItem = this.itemsMap.get(view.item);
    const index = mapItem?.index ?? null;
    return html`
      <uv-list-element
        .index="${index}"
        .initialSize="${this.initialSize}"
        .item="${view.item}"
        .selectedId="${this.selectedId}"
        .size="${mapItem.size}"
        .start="${mapItem.getStart()}"
        .view="${view}"

        .handleResize="${this.handleElementResize}"
        .renderItem="${this.renderItem}"

        @selected="${this.onElementSelected}"
      >
      </uv-list-element>
    `;
  }

  render() {
    // console.log("RENDER")
    const before = this.before
      ? html`<div
          data-role="before"
          ${ref(this.beforeRef)}
          class="uv-list__before"
        >
          ${this.before()}
        </div>`
      : null;

    const after = this.after
      ? html`<div
          data-role="after"
          ${ref(this.afterRef)}
          class="uv-list__after"
        >
          ${this.after()}
        </div>`
      : null;

    const empty = html`<div class="uv-list__empty">
      ${this.empty ? this.empty() : "Nothing to show"}
    </div>`;

    return html`
      <style>
        :host {
          height: 100%;
        }
        .uv-list__wrapper {
          height: 100%;
          overflow-y: auto;
          position: relative;
        }
        .uv-list__scroller {
          box-sizing: border-box;
        }
        .uv-list__empty {
          margin: 0 auto;
          height: 100%;
        }
      </style>

      <div class="uv-list__wrapper" ${ref(this.wrapperRef)}>
        ${before}
        <div
          ${ref(this.scrollerRef)}
          class="uv-list__scroller"
          style="height: ${this.listSize}px; padding-top: ${this
            .scrollerPadding}px"
        >
          ${this.items.length > 0
            ? repeat(this.pool, (view) => view.item.id, this.renderView)
            : empty}
        </div>
        ${after}
      </div>
    `;
  }
}
customElements.define("uv-list", UVList);
