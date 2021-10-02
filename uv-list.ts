import { LitElement, html, css, render } from "lit";
import {
  customElement,
  property,
  eventOptions,
  state,
} from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { asyncAppend } from "lit/directives/async-append.js";
import { until } from "lit/directives/until.js";
import { Ref, ref, createRef } from "lit/directives/ref.js";
import { UVListItem, UVListView } from "./@types";
import "./uv-list-element.ts";
import UVListElement from "./uv-list-element";

enum ViewPosition {
  Start = -1,
  Inside = 0,
  End = 1,
}

const createView = (item: UVListItem = null): UVListView => ({
  item,
  uid: Math.floor(Math.random() * 10000000),
});

@customElement("uv-list")
export default class UVList extends LitElement {
  @property({ type: Array })
  items: UVListItem[] = [];

  @property({ type: Number })
  initialSize: number = 0;

  @property({ type: Number })
  additionalElements = 6;

  @property({ type: Number })
  buffer = 100;

  // @state()
  private views = [];

  // @state()
  // private renderQueue: any = this.renderList();

  // @state()
  private scrollerStart = 0;

  // @state()
  private scrollerPadding = 0;

  // @state()
  private scrollerSize = 0;

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

  private scrollerRef: Ref<HTMLDivElement> = createRef();
  private wrapperRef: Ref<HTMLDivElement> = createRef();
  private wrapperTop = 0;
  private scrollDirection = 0;
  private wrapperBottom = 0;
  private itemsMap: WeakMap<UVListItem, any> = new WeakMap();
  private unusedViews = [];

  firstUpdated() {
    const { top, height } = this.wrapperRef.value.getBoundingClientRect();
    this.wrapperTop = top;
    this.wrapperBottom = top + height;
    const count = (height + this.buffer * 2) / this.initialSize;

    this.items.forEach((item, index, items) => {
      // TODO: Add memoization to getStart and getEnd
      const coordinates = {
        getStart: () =>
          index === 0 ? 0 : this.itemsMap.get(items[index - 1]).getEnd() + 1,
        size: this.initialSize,
        getEnd: () => coordinates.getStart() + coordinates.size,
      };
      this.itemsMap.set(item, coordinates);
      if (index < count) {
        this.views.push(createView(item));
      }
    });
    this.unusedViews.push(createView());
    this.scrollerSize = this.items.length * this.initialSize;

    this.requestUpdate();

    // this.renderQueue = this.renderList();
  }

  // updated(changedProperties) {
  //   console.log(changedProperties);
  //   // if (
  //   //   changedProperties.get("scrollerStart") !== undefined &&
  //   //   changedProperties.get("scrollerEnd") !== undefined
  //   // ) {
  //   //   this.updateVisibleItems();
  //   // }
  // }
  private animationFrame = null;

  @eventOptions({ passive: true })
  private _handleScroll() {
    // cancelAnimationFrame(this.animationFrame)
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
    // });
  }

  private handleRendered(event: CustomEvent) {
    const { item, height } = event.detail;
    const mapItem = this.itemsMap.get(item);
    const oldSize = mapItem.size ?? this.initialSize;
    mapItem.size = height;
    this.scrollerSize = this.scrollerSize - oldSize + height;
  }

  private checkIsItemVisible(
    item: UVListItem
  ): { visible: boolean; position: ViewPosition } {
    const { getStart, getEnd } = this.itemsMap.get(item);
    const start = getStart();
    const end = getEnd();

    const isOnStart =
      end + this.scrollerStart + this.buffer >= 0 &&
      start + this.scrollerStart - this.buffer < 0;
    if (isOnStart) {
      return { visible: true, position: -1 };
    }

    const isInside =
      start + this.scrollerStart - this.buffer >= 0 &&
      end + this.scrollerStart + this.buffer + this.wrapperTop <=
        this.wrapperBottom;
    if (isInside) return { visible: true, position: 0 };

    const isOnEnd =
      start + this.scrollerStart - this.buffer + this.wrapperTop <=
        this.wrapperBottom &&
      end + this.scrollerStart + this.buffer + this.wrapperTop >
        this.wrapperBottom;
    if (isOnEnd) return { visible: true, position: 1 };

    if (end + this.scrollerStart + this.buffer < 0)
      return { visible: false, position: -1 };

    return { visible: false, position: 1 };
  }

  private unuseView(item: UVListItem, position?: number) {
    /*
     * If scrolling to end (this.scrollerPostion === 0),
     * then unuse view from the start of list,
     * else — from the end
     */
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
      if (position === -1) {
        const size = this.itemsMap.get(item).size;
        // this.scrollerPadding += size;
        // this.scrollerSize -= size;
      }
      return view;
    }
    return null;
  }

  private async useView(item: UVListItem) {
    if (this.views.find((view) => view.item.id === item.id)) {
      return;
    }
    const unusedView = this.unusedViews.pop() ?? createView();
    unusedView.item = item;
    if (this.scrollDirection > 0) {
      this.views.push(unusedView);
    } else {
      this.views.unshift(unusedView);
      const size = this.itemsMap.get(item).size;
      // this.scrollerPadding -= size;
      // this.scrollerSize += size;
      // await this.updateComplete;
    }
  }

  private updateVisibleItems() {
    /*
     * Naive non-optimized implementation.
     * Always calculate visibility for all items.
     */
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      const { visible, position } = this.checkIsItemVisible(item);
      if (visible) {
        this.useView(item);
      } else {
        this.unuseView(item, position);
      }
    }
    this.views.sort((one, two) => one.item.id - two.item.id)
    this.scrollerPadding = this.itemsMap.get(this.views[0].item).getStart()
    this.requestUpdate();
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
        // requestAnimationFrame(() => {
        // const fragment = this.renderElementToFragment(view, this.initialSize);
        // this.sizes.set(view.item, fragment.firstElementChild.offsetHeight)
        // console.log(fragment.firstElementChild)
        // resove(fragment);
        resolve(this.renderElementToFragment(view));
      });
      // });
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

  protected render() {
    const scrollerSize = this.scrollerSize + this.scrollerStart;
    return html`
      <div
        class="uv-list__wrapper"
        ${ref(this.wrapperRef)}
        @scroll="${this._handleScroll}"
      >
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
  //       @scroll="${this._handleScroll}"
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
// <div
//   class="uv-list__scroller"
//   style="min-height: ${this.scrollerSize}px"
//   ${ref(this.scrollerRef)}
//   @rendered="${this.handleRendered}"
// >
//   ${asyncAppend(this.renderQueue, (fragment) => {
//     return fragment;
//   })}
// </div>
// html`
// <uv-list-element
// .initialSize="${this.initialSize}"
// .index="${index}"
// .view="${view}"
// >
// </uv-list-element>
// `
// <slot> ${index}. ${item.content}</slot>
//        ${this.items.map(item => html`<div>${item}</div>`)}
declare global {
  interface HTMLElementTagNameMap {
    "uv-list": UVList;
  }
}
