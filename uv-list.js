import { LitElement, html, css, render } from "lit";
import { repeat } from "lit/directives/repeat.js";
// import { asyncAppend } from "lit/directives/async-append.js";
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

    // scrollerStart: { type: Number, state: true },
  };
  scrollerStart = 0;
  visibleIndexes = []

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
    this.scrollDirection = 0;
    this.scrollerStart = 0;
    this.scrollerSize = 0;

    this.wrapperBottom = 0;

    this.views = [];
    this.unusedViews = [];
    this.itemsMap = new WeakMap();
    this.animationFrame = null;
  }

  firstUpdated() {
    const { top, height } = this.wrapperRef.value.getBoundingClientRect();
    this.wrapperTop = top;
    this.wrapperBottom = top + height;
    // const count = (height + this.buffer * 2) / this.initialSize;
    this.wrapperRef.value.addEventListener(
      "scroll",
      this.handleScroll.bind(this),
      { passive: false }
    );
    this.updateMapsAndViews();
    this.scrollerSize = this.items.length * this.initialSize;
    this.unusedViews.push(createView());
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
    // console.log(changedProperties);
    // if (changedProperties.get("scrollerStart")) {
    //   this.updateVisibleItems();
    // }
    if (changedProperties.get("items")) {
      this.scrollerSize = this.items.length * this.initialSize;

      this.updateVisibleItems();
      this.updateMapsAndViews();
    }
  }

  // @eventOptions({ passive: true })
  handleScroll(event) {
    // console.log(event)
    // cancelAnimationFrame(this.animationFrame);
    // this.animationFrame = requestAnimationFrame(() => {
      const scrollerRect = this.scrollerRef.value.getBoundingClientRect();
      const newStart = scrollerRect.top - this.wrapperTop;
      if (newStart < this.scrollerStart) {
        this.scrollDirection = 1;
      } else {
        this.scrollDirection = -1;
      }
      this.scrollerStart = newStart;
      this.updateVisibleItems();
      this.requestUpdate();
      // this.performUpdate()
    // });
  }

  updateMapsAndViews(count = null) {
    this.items.forEach((item, index) => {
      this.updateItemsMap(item, index);
      // if (count === null) return;
      // if (index < count) {
      //   this.views.push(createView(item));
      // }
    });
  }

  updateItemsMap(item, index) {
    // TODO: Add memoization to getStart and getEnd
    // NOTE: potential slack overflow?
    this.itemsMap.set(
      item,
      createSizeRecord(this.itemsMap, this.items, this.initialSize, index)
    );
  }

  handleElementResize() {}

  handleRendered(event) {
    const { item, height } = event.detail;
    const mapItem = this.itemsMap.get(item);
    const oldSize = mapItem.size ?? this.initialSize;
    mapItem.size = height;
    mapItem._dirty = true;
    this.scrollerSize = this.scrollerSize - oldSize + height;
  }

  checkIsItemVisible(item) {
    const { getStart, getEnd } = this.itemsMap.get(item) ?? {};
    if (!getStart || !getEnd) return false;
    const start = getStart();
    const end = getEnd();

    const visible = end + this.scrollerStart + this.wrapperTop >= this.wrapperTop &&
                      start + this.scrollerStart + this.wrapperTop < this.wrapperBottom
    console.log(end, this.scrollerStart, this.wrapperTop)
    // const isOnStart =
    //   end + this.scrollerStart + this.buffer >= 0 &&
    //   start + this.scrollerStart - this.buffer < 0;
    // // console.log("ON START", isOnStart, item.id)
    // if (isOnStart) {
    //   return { visible: true, position: -1 };
    // }

    // const isInside =
    //   start + this.scrollerStart - this.buffer >= 0 &&
    //   end + this.scrollerStart + this.buffer + this.wrapperTop <=
    //     this.wrapperBottom;

    // // console.log("IS INSIDE", isInside, item.id)

    // if (isInside) return { visible: true, position: 0 };

    // const isOnEnd =
    //   start + this.scrollerStart - this.buffer + this.wrapperTop <=
    //     this.wrapperBottom &&
    //   end + this.scrollerStart + this.buffer + this.wrapperTop >
    //     this.wrapperBottom;

    // // console.log("ON END", isOnEnd, item.id)
    // if (isOnEnd) return { visible: true, position: 1 };

    // if (end + this.scrollerStart + this.buffer < 0)
    //   return { visible: false, position: -1 };

    // // console.log('NOT VISIBLE', item.id)

    return { visible };

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
      view.item = null;
      this.unusedViews.push(view);
      return view;
    }
    return null;
  }

  async useView(item) {
    if (this.views.find((view) => view.item.id === item.id)) {
      return;
    }
    const unusedView = this.unusedViews.pop() ?? createView();
    unusedView.item = item;
    if (this.scrollDirection > 0) {
      this.views.push(unusedView);
    } else {
      this.views.unshift(unusedView);
    }
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
      const { visible } = this.checkIsItemVisible(item);
      const existedIndex = this.visibleIndexes.indexOf(i)
      if (visible) {
        if (existedIndex === -1) {
          this.useView(item);
          this.visibleIndexes.push(i)
        }
      } else {
        if (existedIndex !== -1) {
          this.unuseView(item);
          this.visibleIndexes.splice(existedIndex, 1)
        }
      }
    }
    // this.visibleIndexes = new Set(Array.from(newVisible.values()).sort((one, two) => one - two))
    this.visibleIndexes.sort((one, two) => one - two)
    console.log(this.visibleIndexes)
    // if (this.views.length === 0) {
    //   this.unusedViews.push(createView())
    //   return this.updateVisibleItems();
    //   this.views.push(createView())
    // }
    // this.views.sort((one, two) => {
    //   return indexes[one.item.id] - indexes[two.item.id];
    // });
    // console.log(this.views[0])
    // if (this.views[0]) {
    // this.scrollerPadding = this.itemsMap.get(this.views[0].item).getStart();
    // }
    // })
    // this.scrollerPadding = 0
    // console.log(this.views, this.views[0])
    // this.scrollerSize = this.items.length * this.initialSize;

    // this.requestUpdate();
    // this.renderQueue = this.renderList();
  }

  renderElementToFragment(view) {
    // const fragment = document.createDocumentFragment();
    const template = html`
      <uv-list-element
        .view="${view}"
        .itemId="${view.item.id}"
        .initialSize="${this.initialSize}"
      ></uv-list-element>
    `;
    // render(template, fragment);
    // return fragment;
    return template;
  }

  async *renderList() {
    for (let view of this.views) {
      yield new Promise((resolve, reject) => {
        resolve(this.renderElementToFragment(view));
      });
    }
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

  // @scroll="${this.handleScroll}"
  render() {
    const scrollerSize = this.scrollerSize + this.scrollerStart;
    return html`
      <div class="uv-list__wrapper" ${ref(this.wrapperRef)}>
        <div
          class="uv-list__scroller"
          style="height: ${scrollerSize}px; padding-top: ${this
            .scrollerPadding}px"
          ${ref(this.scrollerRef)}
          @rendered="${this.handleRendered}"
        >
          ${repeat(
            this.views,
            (view) => view.uid,
            // (view) => this.renderElementToFragment(view)
            (view) => html`
              <uv-list-element
                .view="${view}"
                .itemId="${view.item.id}"
                .initialSize="${this.initialSize}"
              ></uv-list-element>
            `
          )}
        </div>
      </div>
    `;
  }

  // protected render() {
  //   const scrollerSize = this.scrollerSize - this.scrollerPadding;
  //   return html`
  //     <div
  //       class="uv-list__wrapper"
  //       ${ref(this.wrapperRef)}
  //       @scroll="${this.handleScroll}"
  //     >
  //       <div
  //         class="uv-list__scroller" style="height: ${scrollerSize}px; padding-top: ${this
  //            .scrollerPadding}px"          @rendered="${this.handleRendered}"
  //         ${ref(this.scrollerRef)}
  //       >
  //         ${asyncAppend(this.renderQueue, (fragment) => {
  //           return fragment;
  //         })}
  //       </div>
  //     </div>
  //   `;
  // }
}
customElements.define("uv-list", UVList);
