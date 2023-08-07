import { LitElement, html, css } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { ref, createRef } from "lit/directives/ref.js";
import binarySearch from "../binarySearch.js";
import "./list-element.js";
import $throttle from "lodash.throttle";

const createView = (item) => {
  return {
    item,
    uid: Math.floor(Math.random() * 10000000),
    isUsed: false,
    ready: false,
    position: 0,
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
  autoScroll = null;
  selectedIndex = 0;
  navKeys = [];

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

  async performUpdate() {
    const promise = new Promise((resolve) => setTimeout(() => resolve()));
    await promise;
    return super.performUpdate();
  }

  willUpdate(changedProperties) {
    if (changedProperties.get("items")) {
      this.selectedIndex = this.items.findIndex(
        (item) => item.id === this.selectedId,
      );
      this.updateItemsMap();
      this.updateVisibleItems();
    }
    if (changedProperties.get("selectedId")) {
      this.selectedIndex = this.items.findIndex(
        (item) => item.id === this.selectedId,
      );
    }
  }

  updated() {
    if (this.autoScroll !== null) {
      const item = this.items[this.autoScroll];
      const record = this.itemsMap.get(item);
      if (record?.getStart() === this.wrapperRef.value?.scrollTop) {
        this.autoScroll = null;
      } else {
        this.scrollToItem(this.autoScroll);
      }
    }
  }

  handleScroll() {
    this.scrollerStart =
      this.scrollerRef.value.getBoundingClientRect().top - this.wrapperTop;
    this.updateVisibleItems();
  }

  updateItemsMap() {
    this.items.forEach((item, index) => {
      // Use previous item size if item not new
      const existed = this.itemsMap.get(item);
      const size = existed?.size ?? this.initialSize;
      this.itemsMap.set(
        item,
        createSizeRecord(this.itemsMap, this.items, size, index),
      );
    });
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

  handleElementResize(event) {
    const { item, height, index } = event.detail;
    if (!item) return;
    const mapItem = this.itemsMap.get(item);
    if (mapItem.size !== height) {
      const diff = mapItem.size - height;
      mapItem.size = height;
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
      this.requestUpdate();
    }
  }

  useView(item, index) {
    if (
      this.readyViews.find((view) => view.item.id === item.id && view.ready)
    ) {
      return;
    }
    let view;
    let preparedView = this.preparedViews.find((v) => v.item.id === item.id);
    if (preparedView) {
      view = preparedView;
    } else {
      view = this.unusedViews.pop() ?? createView();
    }
    view.item = item;
    view.item.index = index;
    view.ready = true;
    view.isUsed = true;
    this.readyViews.push(view);
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
    const first = this.firstVisible();
    const last = this.lastVisible();
    // TODO: Optimize slicing
    const visible = this.items.slice(first, last);
    const before = this.items.slice(first - 5, first);
    const after = this.items.slice(last, last + 5);
    return [...before, ...visible, ...after];
    // return [before, visible, after];
  }

  updateVisibleItems() {
    const first = this.firstVisible();
    const visible = this.calculateVisibility();

    const newViews = [];
    this.preparedViews = [];
    this.readyViews = [];
    visible.forEach((item, index) => {
      const unusedView = createView();
      unusedView.item = item;
      unusedView.ready = false;
      unusedView.isUsed = true;
      unusedView.item.index = index + first;
      this.useView(item, index + first);
      newViews.push(unusedView);
    });
    newViews.sort((one, two) => one.item.index - two.item.index);
    this.views = newViews;

    // FIXME sometimes there is flickering with scroll
    // Maybe need to adjust scrollTop to changed position
    this.listSize =
      this.itemsMap.get(this.items[this.items.length - 1])?.getEnd() ??
      this.listSize;
    this.oldScrollerPadding = this.scrollerPadding;
    this.scrollerPadding =
      this.itemsMap.get(this.readyViews[0]?.item ?? null)?.getStart() ??
      this.scrollerPadding;
    this.scrollerSize = this.listSize - this.scrollerPadding;
    this.requestUpdate();
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
    if (record.getEnd() > this.wrapperRef.value.scrollTop + this.wrapperSize) {
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
        .view="${view}"
        .viewId="${view.uid}"
        .itemId="${view.item.id}"
        .initialSize="${this.initialSize}"
        .size="${mapItem.size}"
        .index="${index}"
        .ready="${view.ready}"
        .renderItem="${this.renderItem}"
        .start="${mapItem.getStart()}"
        .selectedId="${this.selectedId}"
        @selected="${this.onElementSelected}"
      >
      </uv-list-element>
    `;
  }

  render() {
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

      <div
        class="uv-list__wrapper"
        ${ref(this.wrapperRef)}
        @resize="${this.handleElementResize}"
      >
        ${before}
        <div
          ${ref(this.scrollerRef)}
          class="uv-list__scroller"
          style="height: ${this.listSize}px; padding-top: ${this
            .scrollerPadding}px"
        >
          ${this.items.length > 0
            ? repeat(this.views, (view) => view.item.id, this.renderView)
            : empty}
        </div>
        ${after}
      </div>
    `;
  }
}
customElements.define("uv-list", UVList);
