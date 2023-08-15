import { LitElement, html, css } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { ref, createRef } from "lit/directives/ref.js";
import { cache } from "lit/directives/cache.js";
import binarySearch from "../binarySearch.js";
import "./list-element.js";
import $throttle from "lodash.throttle";

const createView = (item) => {
  return {
    item,
    uid: Math.floor(Math.random() * 10000000),
  };
};

export default class UVList extends LitElement {
  static properties = {
    items: { type: Array },
    initialSize: { type: Number },
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
  selectedIndex = 0;
  navKeys = [];
  pool = [];

  constructor() {
    super();


    this.pool = [];
    this.views = [];
    this.itemsMap = {};

    this.wrapperRef = createRef();
    this.wrapperTop = 0;

    this.scrollerRef = createRef();
    // this.scrollerStart = 0;
    this.listSize = 0;
    this.scrollerSize = 0;
    // this.scrollerStart = 0;

    this.beforeRef = createRef();
    this.afterRef = createRef();

    this.intersectionObserver = null;
    // this.viewsCache = {};

    this.updateVisibleItems = this.updateVisibleItems.bind(this);
    this.renderView = this.renderView.bind(this);
    this.handleElementResize = this.handleElementResize.bind(this);

    this.resizeObserver = new ResizeObserver(() => {
      this.handleScroll();
    });
  }

  firstUpdated() {
    this.wrapperRef.value.addEventListener(
      "scroll",
      this.handleScroll.bind(this),
      { passive: true },
    );

    const { top, height } = this.wrapperRef.value.getBoundingClientRect();
    this.wrapperTop = top;
    this.wrapperBottom = top + height;
    this.wrapperSize = height;

    this.listSize = this.items.length * this.initialSize;

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
    this.updateVisibleItems();
  }

  createRenderRoot() {
    return this;
  }

  willUpdate(changedProperties) {
    if (changedProperties.has("items")) {
      this.updateItemsMap();
      this.updateVisibleItems();
      return
    }
    if (changedProperties.has("initialSize")) {
      this.updateItemsMap(true);
      this.updateVisibleItems();
    }
  }

  async scheduleUpdate() {
    await new Promise((resolve) => setTimeout(() => resolve()));
    // await new Promise((resolve) => requestAnimationFrame(() => resolve()));
    return super.scheduleUpdate();
  }

  updateItemsMap(reset = false) {
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      let record
      if (reset) {
        record = {}
      } else {
        record = this.itemsMap[item.id] ?? {};
      }
      const start = i === 0 ? 0 : this.itemsMap[this.items[i - 1].id].end + 1;
      const size = record.size ?? this.initialSize;
      this.itemsMap[item.id] = {
        size,
        start,
        index: i,
        end: start + size,
      };
    }
  }

  updateRecord(index) {
    for (let i = index; i < this.items.length; i++) {
      const item = this.items[i];
      const sizeRecord = this.itemsMap[item.id];
      if (i === 0) {
        sizeRecord.start = 0;
      } else {
        const prevItem = this.items[i - 1];
        const prevSizeRecord = this.itemsMap[prevItem?.id];
        sizeRecord.start = prevSizeRecord.end + 1;
      }
    }
  }

  async handleElementResize({ item, size, index, view }) {
    window.requestAnimationFrame(() => {
      if (size === 0) return;
      if (!this.wrapperRef?.value || !item) return;
      const mapItem = this.itemsMap[item.id];
      if (mapItem.size !== size) {
        const diff = mapItem.size - size;
        mapItem.size = size;
        mapItem.end = mapItem.start + mapItem.size;
        const nextMapItem = this.itemsMap[this.items[index + 1]?.id];
        if (nextMapItem) {
          nextMapItem.start += diff;
        }
        this.updateRecord(mapItem.index);
        // this.oldScrollerPadding = this.scrollerPadding;
        // this.scrollerPadding =
        //   this.itemsMap.get(this.readyViews[0]?.item ?? null)?.getStart() ??
        //   this.scrollerPadding;

        // this.wrapperRef.value.scrollTop +=
        //   this.scrollerPadding - this.oldScrollerPadding;
        this.wrapperSize = this.wrapperRef.value.getBoundingClientRect().height;
        // view.ready = true;
        // this.autoScroll = true;
        // this.requestUpdate();
        // console.log(this.itemsMap)
        this.update();
        // this.scheduleUpdate()
      }
    });
  }

  firstVisible() {
    const found = binarySearch(this.items, (item) => {
      const end = this.itemsMap[item.id]?.end ?? 0;
      return 0 <= end + this.scrollerStart;
    });
    return found === this.items.length ? 0 : found;
  }

  lastVisible() {
    const found = binarySearch(this.items, (item) => {
      const start = this.itemsMap[item.id]?.start ?? 0;
      return (
        0 < start + this.scrollerStart - this.wrapperSize + this.wrapperTop
      );
    });
    // TODO: What it was for?
    // return found + 1;
    return found;
  }

  calculateVisibility() {
    let first = this.firstVisible(false);
    let last = this.lastVisible(false);
    // console.log("FIRST AND LAST VISIBLE", first, last);
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
    // console.log("UDPATE VISIBLE");
    const visible = this.calculateVisibility();
    this.visible = visible;
    const newViews = [];
    // const poolIds = this.pool.map((view) => view.item.id);
    for (let i = 0; i < visible.length; i++) {
      const item = visible[i];
      let newView, found, foundIndex;
      // console.log("CACHE AND POOL", this.viewsCache, this.pool)
      // if (poolIds.indexOf(item.id) !== -1) {
      //   found = this.viewsCache[item.id]
      // //   // console.log("FOUND:", found)
      //   if (found) {
      //     this.pool.splice(found.index, 1)
      //     newViews.push(found.view)
      //     continue
      //   }
      // // if (this.viewsCache[item.id]) {
      // //   found = this.viewsCache[item.id]
      // //   newViews.push(found.view)
      // //   this.pool.splice(found.index, 1)
      // } else {
      newView = this.pool.shift() ?? createView();
      newView.item = item;
      // this.viewsCache[item.id] = { view: newView, index: i };
      newViews.push(newView);
      // }
      // let found, foundIndex;
      // for (let j = 0; this.pool.length; j++) {
      //   const poolItem = this.pool[j];
      //   if (poolItem?.item && poolItem.item.id === item.id) {
      //     found = poolItem;
      //     foundIndex = j;
      //     break;
      //   }
      // }
      // const newView = this.pool.pop() ?? createView(item);
    }
    this.pool = newViews;

    this.listSize =
      this.itemsMap[this.items?.[this.items.length - 1]?.id]?.end ??
      this.listSize;
    // console.log("LIST SIZE", this.listSize)
    // this.oldScrollerPadding = this.scrollerPadding;
    // this.scrollerPadding =
    //   this.itemsMap.get(this.readyViews[0]?.item ?? null)?.getStart() ??
    //   this.scrollerPadding;
    // this.scrollerSize = this.listSize - this.scrollerPadding;
    this.requestUpdate();
    // console.log(this.visible, this.pool);
    // this.update();
  }

  handleScroll(event) {
    window.requestAnimationFrame(() => {
      this.scrollerStart =
        this.scrollerRef.value.getBoundingClientRect().top - this.wrapperTop;
      // console.log("SCROLL", this.scrollerStart);
      this.updateVisibleItems();
    });
  }

  renderView(view) {
    const mapItem = this.itemsMap[view.item.id];
    const index = mapItem?.index ?? 0;
    return html`
      <uv-list-element
        .index="${index}"
        .view="${view}"
        .selectedId="${this.selectedId}"
        .size="${mapItem?.size ?? this.initialSize}"
        .start="${mapItem?.start ?? 0}"
        .handleResize="${this.handleElementResize}"
        .renderItem="${this.renderItem}"
      >
      </uv-list-element>
    `;
  }

  scrollToTop() {
    if (this.wrapperRef.value) {
      this.wrapperRef.value.scrollTop = 0;
    }
  }

  render() {
    const listSize =
      this.itemsMap[this.items[this.items.length - 1]?.id]?.end ?? 0;

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
          style="height: ${listSize}px;"
        >
          ${this.items.length > 0
            ? repeat(this.pool, (view) => view.uuid, this.renderView)
            : empty}
        </div>
        ${after}
      </div>
    `;
  }
}
customElements.define("uv-list", UVList);
