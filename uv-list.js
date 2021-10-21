import { LitElement, html, css, render } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { asyncAppend } from "lit/directives/async-append.js";
// import { until } from "lit/directives/until.js";
import { ref, createRef } from "lit/directives/ref.js";
import "./uv-list-element.js";

const createView = (item) => ({
  item,
  uid: Math.floor(Math.random() * 10000000),
});

function computeStart(itemsMap, items, index, record) {
  if (record._dirty) {
    record._start =
      index === 0 ? 0 : itemsMap.get(items[index - 1]).getEnd() + 1;
    record._dirty = false;
  }
  return record._start;
}

function createSizeRecord(itemsMap, items, intitialSize, index) {
  const sizeRecord = {
    _dirty: true,
    size: intitialSize,
    _start: 0,
    index,
    getStart: () => computeStart(itemsMap, items, index, sizeRecord),
  };
  sizeRecord._start = sizeRecord.getStart();
  sizeRecord.getEnd = () => sizeRecord.getStart() + sizeRecord.size;
  return sizeRecord;
}

export default class UVList extends LitElement {
  static properties = {
    items: { type: Array },
    initialSize: { type: Number },
    buffer: { type: Number },
    nonBlockingRender: { type: Boolean },
    renderQueue: { type: Array, state: true }
    // scrollerStart: { type: Number, state: true },
  };
  scrollerStart = 0;

  static styles = css`
    :host {
      height: 100%;
      display: flex;
      flex-direction: column;
    }
    .uv-list__wrapper {
      height: 100%;
      overflow-y: auto;
    }
  `;

  constructor() {
    super();

    this.buffer = 100;
    this.nonBlockingRender = false;

    this.wrapperRef = createRef();
    this.wrapperTop = 0;

    this.scrollerRef = createRef();
    // this.scrollDirection = 0;
    this.scrollerStart = 0;
    this.scrollerSize = 0;

    this.wrapperBottom = 0;

    this.views = [];
    this.unusedViews = [];
    this.itemsMap = new WeakMap();
    // this.animationFrame = null;
    this.domCache = new Map();
    this.domCacheMaxSize = 50;
  }

  firstUpdated() {
    const { top, height } = this.wrapperRef.value.getBoundingClientRect();
    this.wrapperTop = top;
    this.wrapperBottom = top + height;
    this.wrapperSize = height;
    // const count = (height + this.buffer * 2) / this.initialSize;
    this.wrapperRef.value.addEventListener(
      "scroll",
      this.handleScroll.bind(this),
      { passive: false }
    );
    this.scrollerSize = this.items.length * this.initialSize;
    this.unusedViews.push(createView());
    this.updateItemsMap();
    this.updateVisibleItems();
    // this.requestUpdate();
    this.renderQueue = this.renderList();
  }

  // async performUpdate() {
  //   if (this.nonBlockingRender) {
  //     // Unblock main thread while rendering component
  //     const promise = new Promise((resolve) => setTimeout(() => resolve()));
  //     await promise;
  //   }
  //   return super.performUpdate();
  // }

  willUpdate(changedProperties) {
    // console.log(changedProperties);
    // if (changedProperties.get("scrollerStart")) {
    //   this.updateVisibleItems();
    // }
    if (changedProperties.get("items")) {
      this.scrollerSize = this.items.length * this.initialSize;

      console.dir("WILL UPDATE", this.items[this.items.length - 1]);

      this.updateItemsMap();
      this.updateVisibleItems();
      this.renderQueue = this.renderList()
    }
  }

  // @eventOptions({ passive: true })
  handleScroll() {
    // console.log(event)
    // cancelAnimationFrame(this.animationFrame);
    // this.animationFrame = requestAnimationFrame(() => {
    const scrollerRect = this.scrollerRef.value.getBoundingClientRect();
    const newStart = scrollerRect.top - this.wrapperTop;
    this.scrollerStart = newStart;
    // if (newStart < this.scrollerStart) {
    //   this.scrollDirection = 1;
    // } else {
    //   this.scrollDirection = -1;
    // }
    this.updateVisibleItems();
    // this.requestUpdate();
    this.renderQueue = this.renderList()

    // this.performUpdate()
    // });
  }

  updateItemsMap() {
    // TODO: Add memoization to getStart and getEnd
    // NOTE: potential slack overflow?
    // for (let i; i < this.items.length; i++) {

    // }
    this.items.forEach((item, index) => {
      this.itemsMap.set(
        item,
        createSizeRecord(this.itemsMap, this.items, this.initialSize, index)
      );
    });
  }

  handleElementResize(event) {
    const { item, height } = event.detail;
    if (!item) return;
    const mapItem = this.itemsMap.get(item);
    mapItem.size = height;
    mapItem._dirty = true;
  }

  checkIsItemVisible(item) {
    const { getStart, getEnd } = this.itemsMap.get(item) ?? {};
    if (!getStart || !getEnd) return false;
    const start = getStart();
    const end = getEnd();
    return (
      end + this.scrollerStart + this.buffer >= 0 &&
      start + this.scrollerStart <= this.wrapperSize + this.buffer
    );
  }

  unuseView(item) {
    let viewIndex = null;
    const view = this.views.find((view, index) => {
      if (view.item.id === item.id) {
        viewIndex = index;
        return true;
      }
    });

    if (view) {
      this.views.splice(viewIndex, 1);
      // view.item = null;
      this.unusedViews.push(view);
      return view;
    }
    return null;
  }

  useView(item) {
    if (this.views.find((view) => view.item.id === item.id)) {
      return;
    }
    const unusedView = this.unusedViews.pop() ?? createView();
    unusedView.item = item;
    this.views.push(unusedView);
  }

  updateVisibleItems() {
    /*
     * Naive non-optimized implementation.
     * Always calculate visibility for all items.
     */
    // cancelAnimationFrame(this.animationFrame)
    // this.animationFrame = requestAnimationFrame(() => {
    const indexes = {};
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      indexes[item.id] = i;
      const visible = this.checkIsItemVisible(item);
      if (visible) {
        this.useView(item);
      } else {
        this.unuseView(item);
      }
    }
    this.views.sort((one, two) => indexes[one.item.id] - indexes[two.item.id]);
    this.scrollerSize =
      this.itemsMap.get(this.items[this.items.length - 1])?.getEnd() ??
      this.scrollerSize;
    this.scrollerPadding =
      this.itemsMap.get(this.views[0]?.item ?? null)?.getStart() ??
      this.scrollerPadding;
  }

  async *renderList() {
    for (let view of this.views) {
      yield new Promise((resolve, reject) => {
        resolve(this.renderElement(view, this.initialSize));
      });
    }
  }

  renderElement(view, initialSize) {
    return html`
      <uv-list-element
        .view="${view}"
        .itemId="${view.item.id}"
        .initialSize="${initialSize}"
      ></uv-list-element>
    `;
  }

  // shouldUpdate(changedProperties) {
  //   if (
  //     changedProperties.size === 2 &&
  //     changedProperties.get("scrollerStart") !== undefined &&
  //     changedProperties.get("scrollerEnd") !== undefined
  //   ) {
  //     return false
  //   }
  //   return true;
  // }

  render() {
    const scrollerSize = this.scrollerSize - this.scrollerPadding;
    return html`
      <div class="uv-list__wrapper" ${ref(this.wrapperRef)}>
        <div
          class="uv-list__scroller"
          style="height: ${scrollerSize}px; padding-top: ${this
            .scrollerPadding}px"
          ${ref(this.scrollerRef)}
          @resize="${this.handleElementResize}"
        >
          ${repeat(
            this.views,
            // (view) => view.uid,
            // (view) => this.renderElementToFragment(view)
            (view) => this.renderElement(view, this.initialSize)
          )}
        </div>
      </div>
    `;
  }

  // render() {
  //   // console.log('RENDER', this.renderQueue)
  //   const scrollerSize = this.scrollerSize - this.scrollerPadding;
  //   return html`
  //     <div class="uv-list__wrapper" ${ref(this.wrapperRef)}>
  //       <div
  //         class="uv-list__scroller"
  //         style="height: ${scrollerSize}px; padding-top: ${this
  //           .scrollerPadding}px"
  //         ${ref(this.scrollerRef)}
  //         @resize="${this.handleElementResize}"
  //       >
  //        ${asyncAppend(this.renderQueue, element => element)}
  //       </div>
  //     </div>
  //   `;
  // }
}
customElements.define("uv-list", UVList);
