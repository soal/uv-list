import { LitElement, html, css } from "lit";
import { repeat } from "lit/directives/repeat.js";
// import { asyncAppend } from "lit/directives/async-append.js";
// import { until } from "lit/directives/until.js";
import { ref, createRef } from "lit/directives/ref.js";
import "./uv-list-element.js";

const createView = (item) => ({
  item,
  uid: Math.floor(Math.random() * 10000000),
  isUsed: false,
  ready: false,
});

function createSizeRecord(
  itemsMap,
  items,
  intitialSize,
  index,
  firstDirtyRecord
) {
  const sizeRecord = {
    _dirty: true,
    size: intitialSize,
    _start: index === 0 ? 0 : itemsMap.get(items[index - 1]).getEnd() + 1,
    index,
  };
  sizeRecord.getStart = () => {
    // if (sizeRecord._dirty || firstDirtyRecord.index <= index) {
    //   sizeRecord._start =
    //     index === 0 ? 0 : itemsMap.get(items[index - 1]).getEnd() + 1;
    //   sizeRecord._dirty = false;
    //   if (firstDirtyRecord.index === index) {
    //     firstDirtyRecord.index += 1
    //   }
    // }
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
  scrollerPadding = 0;
  oldScrollerPadding = 0;
  views = [];
  readyViews = [];
  preparedViews = { before: [], after: [] };
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
    // this.scrollDirection = 0;
    this.scrollerStart = 0;
    this.listSize = 0;

    this.wrapperBottom = 0;

    // this.views = [];
    // this.unusedViews = [];
    // this.preparedViews = [];
    // this.readyViews = [];

    this.itemsMap = new WeakMap();
    this.animationFrame = null;
    // this.domCache = new Map();
    // this.domCacheMaxSize = 50;
    this.initialSize = 50;

    this.renderElement = this.renderElement.bind(this);
    this.scrollerSize = 0;
    this.firstDirtyRecord = { index: 0 };
    this.sizes = new Set([]);
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
    this.createItemsMap();
    this.updateVisibleItems();
    this.prepareViews();
    // this.renderQueue = this.renderList();
    this.views = [
      ...this.preparedViews.before,
      ...this.readyViews,
      ...this.preparedViews.after,
    ];
    this.requestUpdate();
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
    if (changedProperties.get("items")) {
      this.listSize = this.items.length * this.initialSize;

      console.dir("WILL UPDATE", this.items[this.items.length - 1]);
      console.dir("WILL UPDATE", this.items[0]);

      requestAnimationFrame(() => {
        this.createItemsMap();
        this.updateVisibleItems();
      });
    }
    // if (changedProperties.get("readyViews")) {
    //   // this.prepareViews();
    // }
  }

  handleScroll() {
    // requestAnimationFrame(() => {
    const newStart =
      this.scrollerRef.value.getBoundingClientRect().top - this.wrapperTop;

    // if (Math.abs(this.scrollerStart - newStart) < 10) return;

    // requestAnimationFrame(() => {
    this.scrollerStart = newStart;
    this.updateVisibleItems();
    this.prepareViews();
    this.views = [
      ...this.preparedViews.before,
      ...this.readyViews,
      ...this.preparedViews.after,
    ];
    this.listSize =
      this.itemsMap.get(this.items[this.items.length - 1])?.getEnd() ??
      this.listSize;
    this.oldScrollerPadding = this.scrollerPadding
    this.scrollerPadding =
      this.itemsMap.get(this.readyViews[0]?.item ?? null)?.getStart() ??
      this.scrollerPadding;
    this.scrollerSize = this.listSize - this.scrollerPadding;
    this.requestUpdate();
    // });
  }

  createItemsMap() {
    this.items.forEach((item, index) => {
      this.itemsMap.set(
        item,
        createSizeRecord(
          this.itemsMap,
          this.items,
          this.initialSize,
          index,
          this.firstDirtyRecord
        )
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
    // requestAnimationFrame(() => {
    const { item, height } = event.detail;
    if (!item) return;
    const mapItem = this.itemsMap.get(item);
    if (mapItem.size !== height) {
      // if (mapItem.index <= this.firstDirtyRecord.index) {
      //   this.firstDirtyRecord.index = mapItem.index;
      // }
      // console.log("RESIZE", item.id, height, mapItem.size);
      mapItem.size = height;
      mapItem._dirty = true;
      this.updateItemsMap(mapItem.index);
      // this.listSize =
      //   this.itemsMap.get(this.items[this.items.length - 1])?.getEnd() ??
      //   this.listSize;
      this.oldScrollerPadding = this.scrollerPadding
      this.scrollerPadding =
        this.itemsMap.get(this.readyViews[0]?.item ?? null)?.getStart() ??
        this.scrollerPadding;
      // this.wrapperRef.value.scrollTop = this.scrollerPadding

      // this.scrollerSize = this.listSize - this.scrollerPadding;
      this.wrapperRef.value.scrollTop += this.scrollerPadding - this.oldScrollerPadding
      this.requestUpdate();
      // this.update();
      // this.performUpdate()
    }
    // });
  }

  // handleItemRender(event) {
  //   const { item, height } = event.detail;
  //   console.log(item.id, height);
  //   if (!item || height === undefined) return;
  //   const mapItem = this.itemsMap.get(item);
  //   // if (mapItem.index <= this.firstDirtyRecord.index) {
  //   // if (mapItem.size !== height) {
  //   //   this.firstDirtyRecord.index = mapItem.index;
  //   // }
  //   // console.log("RESIZE", item.id, height, mapItem.size);
  //   const oldSize = mapItem.size;
  //   mapItem.size = height;
  //   mapItem._dirty = true;
  //   this.updateItemsMap(mapItem.index);
  //   this.listSize = this.listSize + (height - oldSize);
  //   this.scrollerPadding = this.scrollerPadding + (height - oldSize);
  //     // this.itemsMap.get(this.readyViews[0]?.item ?? null)?.getStart() ??
  //     // this.scrollerPadding;
  //   this.scrollerSize = this.listSize - this.scrollerPadding;
  //   // this.requestUpdate();
  //   // this.update();
  //   // this.performUpdate()
  //   // }
  // }

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
    const view = this.readyViews.find((view, index) => {
      if (view.item.id === item.id) {
        viewIndex = index;
        return true;
      }
    });

    if (view) {
      this.readyViews.splice(viewIndex, 1);
      this.unusedViews.push(view);
      view.isUsed = false;
      view.ready = false;
      return view;
    }
    return null;
  }

  useView(item) {
    // console.log("USE VIEW", item.id);
    if (
      this.readyViews.find((view) => view.item.id === item.id && view.ready)
    ) {
      return;
    }
    let view;
    let preparedView = [
      ...this.preparedViews.before,
      ...this.preparedViews.after,
    ].find((v) => v.item.id === item.id);
    if (preparedView) {
      view = preparedView;
    } else {
      view = this.unusedViews.pop() ?? createView();
    }
    view.item = item;
    view.ready = true;
    view.isUsed = true;
    this.readyViews.push(view);
  }

  prepareViews() {
    // preparing view to check their size and add already correctly sized elements
    // elements must be rendered with position: absolute
    this.preparedViews.before = [];
    this.preparedViews.after = [];
    const first = this.readyViews[0];
    const last = this.readyViews[this.readyViews.length - 1];
    const firstIndex = this.itemsMap.get(first.item)?.index;
    const lastIndex = this.itemsMap.get(last.item)?.index;
    const beforeItems = this.items.slice(
      firstIndex < 5 ? 0 : firstIndex - 5,
      firstIndex
    );
    const afterItems = this.items.slice(lastIndex + 1, lastIndex + 6);
    // console.log(firstIndex, lastIndex);
    // console.log(beforeItems, afterItems)

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

  updateVisibleItems() {
    // performance.mark("m1");
    // requestAnimationFrame(() => {
    /*
     * Naive non-optimized implementation.
     * Always calculate visibility for all items.
     */
    // cancelAnimationFrame(this.animationFrame)
    // this.animationFrame = requestAnimationFrame(() => {
    // console.log("UPDATE!");
    // console.log(this.firstDirtyRecord.index)

    const indexes = {};
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      indexes[item.id] = i;
      // performance.mark("v1");
      const visible = this.checkIsItemVisible(item);
      // performance.mark("v2");
      // const m1 = performance.measure('check visibility', 'v1', 'v2')
      // console.log('CHECK VISIBLE', m1)
      if (visible) {
        this.useView(item);
      } else {
        this.unuseView(item);
      }
    }
    this.readyViews.sort(
      (one, two) => indexes[one.item.id] - indexes[two.item.id]
    );
    // console.log(
    //   this.views.map((view) => [view.item.id, indexes[view.item.id]])
    // );
    // this.listSize =3573
    //   this.itemsMap.get(this.items[this.items.length - 1])?.getEnd() ??
    //   this.listSize;
    this.scrollerPadding =
      this.itemsMap.get(this.readyViews[0]?.item ?? null)?.getStart() ??
      this.scrollerPadding;
    this.scrollerSize = this.listSize - this.scrollerPadding;
    // performance.mark("m2");
    // const measure = performance.measure("up vis start", "m1", "m2");
    // console.log(measure);
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
        .size="${mapItem.size}"
        .index="${index}"
        .ready="${view.ready}"
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
          @update="${this.handleItemRender}"
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
  // console.log('RENDER', this.renderQueue)
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
