import { LitElement, html, css, render } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { asyncAppend } from "lit/directives/async-append.js";
// import { until } from "lit/directives/until.js";
import { ref, createRef } from "lit/directives/ref.js";
import "./uv-list-element.js";

const createView = (item) => ({
  item,
  uid: Math.floor(Math.random() * 10000000),
  isUsed: false,
});

function createSizeRecord(itemsMap, items, intitialSize, index) {
  const sizeRecord = {
    _dirty: true,
    size: intitialSize,
    _start: index === 0 ? 0 : itemsMap.get(items[index - 1]).getEnd() + 1,
    index,
  };
  sizeRecord.getStart = () => {
    if (sizeRecord._dirty) {
      sizeRecord._start =
        index === 0 ? 0 : itemsMap.get(items[index - 1]).getEnd() + 1;
      sizeRecord._dirty = false;
    }
    // return index === 0 ? 0 : itemsMap.get(items[index - 1]).getEnd() + 1;
    return sizeRecord._start;
  };
  sizeRecord.getEnd = () => sizeRecord.getStart() + sizeRecord.size;
  return sizeRecord;
}

export default class UVList extends LitElement {
  static properties = {
    items: { type: Array },
    initialSize: { type: Number },
    buffer: { type: Number },
    nonBlockingRender: { type: Boolean },
    renderItem: { type: Function },
    // renderQueue: { type: Array, state: true }
  };
  scrollerStart = 0;
  scrollTimeout = null;
  updating = false;

  static styles = css`
    :host {
      height: 100%;
      /*      display: flex;
      flex-direction: column;
*/
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
    this.listSize = 0;

    this.wrapperBottom = 0;

    this.views = [];
    this.unusedViews = [];
    this.itemsMap = new WeakMap();
    this.animationFrame = null;
    this.domCache = new Map();
    this.domCacheMaxSize = 50;
    this.initialSize = 50;

    this.renderElement = this.renderElement.bind(this);
    this.scrollerSize = 0;
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
      { passive: true }
    );
    this.listSize = this.items.length * this.initialSize;
    this.scrollerPadding = 0;
    this.scrollerSize = this.listSize - this.scrollerPadding;
    this.unusedViews.push(createView());
    this.updateItemsMap();
    this.updateVisibleItems();
    this.requestUpdate();
    // this.renderQueue = this.renderList();
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
    if (changedProperties.get("items")) {
      this.listSize = this.items.length * this.initialSize;

      console.dir("WILL UPDATE", this.items[this.items.length - 1]);
      console.dir("WILL UPDATE", this.items[0]);

      requestAnimationFrame(() => {
        this.updateItemsMap();
        this.updateVisibleItems();
      })
    }
  }

  handleScroll() {
    const newStart =
      this.scrollerRef.value.getBoundingClientRect().top - this.wrapperTop;

    // if (Math.abs(this.scrollerStart - newStart) < 10) return;

    this.scrollerStart = newStart;
    // requestAnimationFrame(() => {
      this.updateVisibleItems();
      this.requestUpdate();
    // })
    // this.updating = false;
  }

  updateItemsMap() {
    this.items.forEach((item, index) => {
      this.itemsMap.set(
        item,
        createSizeRecord(this.itemsMap, this.items, this.initialSize, index)
      );
    });
  }

  handleElementResize(event) {
    // requestAnimationFrame(() => {
      const { item, height } = event.detail;
      if (!item) return;
      const mapItem = this.itemsMap.get(item);
      if (mapItem.size !== height) {
        // console.log("RESIZE", item.id, height, mapItem.size);
        // this.listSize = this.listSize + (height - mapItem.size)
        // this.listSize =
        //   this.itemsMap.get(this.items[this.items.length - 1])?.getEnd() ??
        //   this.listSize;
        mapItem.size = height;
      }
      mapItem._dirty = true;
    // });
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
      this.unusedViews.push(view);
      view.isUsed = false;
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
    unusedView.isUsed = true;
    this.views.push(unusedView);
  }

  updateVisibleItems() {
    // requestAnimationFrame(() => {
    /*
     * Naive non-optimized implementation.
     * Always calculate visibility for all items.
     */
    // cancelAnimationFrame(this.animationFrame)
    // this.animationFrame = requestAnimationFrame(() => {
    // console.log("UPDATE!");
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
    console.log(this.views.map(view => [view.item.id, indexes[view.item.id]]))
    this.listSize =
      this.itemsMap.get(this.items[this.items.length - 1])?.getEnd() ??
      this.listSize;
    this.scrollerPadding =
      this.itemsMap.get(this.views[0]?.item ?? null)?.getStart() ??
      this.scrollerPadding;
    this.scrollerSize = this.listSize - this.scrollerPadding;
    // });
  }

  async *renderList() {
    for (let view of this.views) {
      yield new Promise((resolve, reject) => {
        resolve(this.renderElement(view, this.initialSize));
      });
    }
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
        .index="${index}"
        .renderItem="${this.renderItem}"
      >
      </uv-list-element>
    `;
  }

  // connectedCallback() {
  //   const initialDom = this.children[0].cloneNode(true)
  //   console.dir('COMPONENT', initialDom)
  //   super.connectedCallback()
  // }

  // // shouldUpdate(changedProperties) {
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
    // const scrollerSize = this.listSize - this.scrollerPadding;
    return html`
      <div class="uv-list__wrapper" ${ref(this.wrapperRef)}>
        <div
          ${ref(this.scrollerRef)}
          class="uv-list__scroller"
          style="height: ${this.scrollerSize}px; padding-top: ${this
            .scrollerPadding}px"
          @resize="${this.handleElementResize}"
        >
          ${repeat(
            this.views,
            // (view) => view.item.id, // list flickers with keys
            (view) => view.uid, // list flickers with keys
            // (view) => this.renderElementToFragment(view)
            this.renderElement
          )}
        </div>
      </div>
    `;
  }

  // render() {
  //   // console.log('RENDER', this.renderQueue)
  //   const scrollerSize = this.listSize - this.scrollerPadding;
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
