import { LitElement, html, css } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { ref, createRef } from "lit/directives/ref.js";
import binarySearch from "./binarySearch.js";
import "./list-element.js";

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
    nonBlockingRender: { type: Boolean },
    renderItem: { type: Function },
    selectedId: { type: Number },
  };
  scrollerStart = 0;
  scrollTimeout = null;
  scrollerPadding = 0;
  oldScrollerPadding = 0;
  views = [];
  readyViews = [];
  preparedViews = [];
  unusedViews = [];

  static styles = css`
    :host {
      height: 100%;
    }
    .uv-list__wrapper {
      height: 100%;
      overflow-y: auto;
      position: relative;
      border: 1px solid black;
    }
  `;

  constructor() {
    super();

    this.buffer = 100;
    this.nonBlockingRender = false;

    this.wrapperRef = createRef();
    this.wrapperTop = 0;

    this.scrollerRef = createRef();
    this.scrollerStart = 0;
    this.listSize = 0;

    this.wrapperBottom = 0;

    this.itemsMap = new WeakMap();
    this.initialSize = 50;

    this.renderElement = this.renderElement.bind(this);
    this.scrollerSize = 0;

    this.resizeObserver = new ResizeObserver((entries) => {
      this.handleScroll();
    });
  }

  firstUpdated() {
    const { top, height } = this.wrapperRef.value.getBoundingClientRect();
    this.wrapperTop = top;
    this.wrapperBottom = top + height;
    this.wrapperSize = height;
    this.wrapperRef.value.addEventListener(
      "scroll",
      this.handleScroll.bind(this),
      { passive: true }
    );
    this.resizeObserver.observe(this.wrapperRef.value);
    this.listSize = this.items.length * this.initialSize;
    this.scrollerPadding = 0;
    this.scrollerSize = this.listSize - this.scrollerPadding;
    this.unusedViews.push(createView());
    this.createItemsMap();
    this.updateVisibleItems(true);
  }

  async performUpdate() {
    if (this.nonBlockingRender) {
      // Unblock main thread while rendering component
      const promise = new Promise((resolve) => setTimeout(() => resolve()));
      await promise;
    }
    return super.performUpdate();
  }

  willUpdate(changedProperties) {
    // console.log("UPDATE!", changedProperties)
    if (changedProperties.get("items")) {
      console.dir("WILL UPDATE", this.items[this.items.length - 1]);
      console.dir("WILL UPDATE", this.items[0]);

      this.createItemsMap();
      this.updateVisibleItems();
    }
  }

  handleScroll() {
    this.scrollerStart = this.scrollerRef.value.getBoundingClientRect().top - this.wrapperTop;
    this.updateVisibleItems();
  }

  createItemsMap() {
    this.items.forEach((item, index) => {
      this.itemsMap.set(
        item,
        createSizeRecord(this.itemsMap, this.items, this.initialSize, index)
      );
    });
  }

  updateItemsMap(index) {
    for (let i = index; i < this.items.length; i++) {
      const item = this.items[i];
      const sizeRecord = this.itemsMap.get(item);
      if (index === 0) {
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
      const nextMapItem = this.itemsMap[this.items[index + 1]];
      if (nextMapItem) {
        nextMapItem._start += diff;
      }
      this.updateItemsMap(mapItem.index);
      this.oldScrollerPadding = this.scrollerPadding;
      this.scrollerPadding =
        this.itemsMap.get(this.readyViews[0]?.item ?? null)?.getStart() ??
        this.scrollerPadding;

      this.wrapperRef.value.scrollTop +=
        this.scrollerPadding - this.oldScrollerPadding;
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

  prepareViews() {
    // preparing view to check their size and add already correctly sized elements
    // elements must be rendered with position: absolute
    // this.preparedViews.before = [];
    // this.preparedViews.after = [];

    const first = this.readyViews[0];
    const last = this.readyViews[this.readyViews.length - 1];
    const firstIndex = this.itemsMap.get(first.item)?.index;
    const lastIndex = this.itemsMap.get(last.item)?.index;
    const beforeItems = this.items.slice(
      firstIndex < 5 ? 0 : firstIndex - 5,
      firstIndex
    );
    const afterItems = this.items.slice(lastIndex + 1, lastIndex + 6);

    if (beforeItems?.length) {
      beforeItems.forEach((item) => {
        const unusedView = this.unusedViews.pop() ?? createView();
        unusedView.item = item;
        unusedView.ready = false;
        unusedView.isUsed = true;
        this.preparedViews.before.push(unusedView);
      });
    }
    if (afterItems?.length) {
      afterItems.forEach((item) => {
        const unusedView = this.unusedViews.pop() ?? createView();
        unusedView.item = item;
        unusedView.ready = false;
        unusedView.isUsed = true;
        this.preparedViews.after.push(unusedView);
      });
    }
  }

  firstVisible() {
    const found = binarySearch(this.items, (item) => {
      const { getEnd } = this.itemsMap.get(item) ?? {};
      return 0 <= getEnd() + this.buffer + this.scrollerStart;
    });
    return found === this.items.length ? 0 : found;
  }

  lastVisible() {
    const found = binarySearch(this.items, (item) => {
      const { getStart } = this.itemsMap.get(item) ?? {};
      const start = getStart();

      return 0 < start + this.scrollerStart - this.wrapperSize + this.buffer;
    });
    return found + 1;
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

  updateVisibleItems(firstUpdate = false) {
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
    this.dispatchEvent(
      new Event("selected", {
        detail: event.detail,
      })
    );
  }

  renderElement(view) {
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
      >
      </uv-list-element>
    `;
  }

  render() {
    return html`
      <div
        class="uv-list__wrapper"
        ${ref(this.wrapperRef)}
        @resize="${this.handleElementResize}"
      >
        <div
          ${ref(this.scrollerRef)}
          class="uv-list__scroller"
          style="height: ${this.scrollerSize}px; padding-top: ${this
            .scrollerPadding}px"
        >
          ${repeat(
            this.views,
            (view) => view.item.id,
            // (view) => JSON.stringify(view.item),
            this.renderElement
          )}
        </div>
      </div>
    `;
  }
}
customElements.define("uv-list", UVList);
