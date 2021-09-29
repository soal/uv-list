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

@customElement("uv-list")
export default class UVList extends LitElement {
  @property({ type: Array })
  items: UVListItem[] = [];

  @property({ type: Number })
  initialSize: number = 0;

  @state()
  private visibleItems: UVListItem[] = [];

  @state()
  private views = [];

  // @state()
  // private renderQueue: any = this.renderList();

  @state()
  private scrollerStart = 0;

  @state()
  private scrollerEnd = 0;

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
  @state()
  private scrollerSize = 0;

  private scrollerRef: Ref<HTMLDivElement> = createRef();
  private wrapperRef: Ref<HTMLDivElement> = createRef();
  private wrapperTop = 0;
  // private wrapperBottom = 0;
  // private sizes: WeakMap<UVListItem, number> = new WeakMap();
  private itemsMap: WeakMap<UVListItem, any> = new WeakMap();
  // private itemIds = [];

  firstUpdated() {
    const { top, height } = this.wrapperRef.value.getBoundingClientRect();
    this.wrapperTop = top;
    // this.wrapperBottom = top + height;
    const count = height / this.initialSize + 6;

    this.items.forEach((item, index, items) => {
      // this.itemIds.push(item.id)
      // this.sizes.set(item, this.initialSize)
      if (index === 0) {
        this.itemsMap.set(item, {
          getStart: () => 0,
          getEnd: () => this.initialSize,
        });
      } else {
        const coordinates = {
          getStart: () => this.itemsMap.get(items[index - 1]).getEnd() + 1,
          size: this.initialSize,
          getEnd: () => coordinates.getStart() + coordinates.size,
        };
        this.itemsMap.set(item, coordinates);
      }
      if (index < count) {
        this.visibleItems.push(item);
        this.views.push({
          item,
          uid: Math.floor(Math.random() * 10000000),
        });
      }
    });
    this.scrollerSize = this.items.length * this.initialSize;

    // this.itemIds = this.items.map(item => item.id)
    // this.visibleItems = this.items.slice(0, count);
    // this.views = this.visibleItems.map((item) => ({
    // }));
    // this.renderQueue = this.renderList();
    // this.requestUpdate();
    // console.log(this);
  }

  updated(changedProperties) {
    if (
      changedProperties.get("scrollerStart") !== undefined &&
      changedProperties.get("scrollerEnd") !== undefined
    ) {
      this.updateVisibleItems();
    }
  }

  @eventOptions({ passive: true })
  private _handleScroll(e: Event) {
    // requestAnimationFrame(() => {
      const scrollerRect = this.scrollerRef.value.getBoundingClientRect();
      this.scrollerStart = scrollerRect.top - this.wrapperTop;
      this.scrollerEnd = scrollerRect.top + scrollerRect.height;
      // this.scrollerPadding = this.scrollerRef.value.scrollTop
    // });
  }

  private handleRendered(event: CustomEvent) {
    const { item, height } = event.detail;
    const mapItem = this.itemsMap.get(item);
    const oldSize = mapItem.size ?? this.initialSize;
    mapItem.size = height;
    // console.log(this.scrollerSize, oldSize, height)
    this.scrollerSize = this.scrollerSize - oldSize + height;
  }

  private updateVisibleItems() {
    let usedViewsIndex = -1;
    const views = this.views;
    for (let item of this.items) {
      const { getStart, getEnd } = this.itemsMap.get(item);
      const start = getStart()
      const end = getEnd()
      const isOnStart =
        end + this.scrollerStart >= 0 && start + this.scrollerStart < 0;
      const isInside =
        start + this.scrollerStart >= 0 && end <= this.scrollerEnd;
      const isOnEnd =
        end >= this.scrollerEnd && start < this.scrollerEnd;

      if (isOnStart || isInside || isOnEnd) {
        let view = views[++usedViewsIndex];
        // console.log(usedViewsIndex, view)
        // console.log(view)
        if (view && view.item.id !== item.id) {
          view.item = item;
        }
      }
    }
    // console.log('UPDATE', views)
    this.views = views;
    // this.requestUpdate()
    // this.renderQueue = this.renderList();
  }

  renderElementToFragment(view, initialSize) {
    const fragment = document.createDocumentFragment();
    const template = html`
      <uv-list-element
        .view="${view}"
        .initialSize="${initialSize}"
      ></uv-list-element>
    `;
    render(template, fragment);
    return fragment;
  }

  async *renderList() {
    for (let view of this.views) {
      yield new Promise((resove, reject) => {
        // requestAnimationFrame(() => {
        const fragment = this.renderElementToFragment(view, this.initialSize);
        // this.sizes.set(view.item, fragment.firstElementChild.offsetHeight)
        // console.log(fragment.firstElementChild)
        resove(fragment);
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
    return html`
      <div
        class="uv-list__wrapper"
        ${ref(this.wrapperRef)}
        @scroll="${this._handleScroll}"
      >
        <div
          class="uv-list__scroller"
          style="height: ${this.scrollerSize}px; padding-top: ${-this.scrollerStart}px"
          ${ref(this.scrollerRef)}
          @rendered="${this.handleRendered}"
        >
          ${repeat(
            this.views,
            (view: UVListView) => view.uid,
            (view, index) =>
              this.renderElementToFragment(view, this.initialSize)
          )}
        </div>
      </div>
    `;
  }

  // protected render() {
  //   return html`
  //     <div
  //       class="uv-list__wrapper"
  //       ${ref(this.wrapperRef)}
  //       @scroll="${this._handleScroll}"
  //     >
  //       <div
  //         class="uv-list__scroller"
  //         style="min-height: ${this.scrollerSize}px; padding-top: ${-this.scrollerStart}px"
  //         @rendered="${this.handleRendered}"
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
