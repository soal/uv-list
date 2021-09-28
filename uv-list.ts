import { LitElement, html, css } from "lit";
import {
  customElement,
  property,
  eventOptions,
  state,
} from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { Ref, ref, createRef } from "lit/directives/ref.js";
import { UVListItem } from "./@types";
import "./uv-list-element.ts";

@customElement("uv-list")
export default class UVList extends LitElement {
  @property({ type: Array })
  items: UVListItem[] = [];

  @property({ type: Number })
  initialSize: number = 0;

  @state()
  private visibleItems: UVListItem[] = [];

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
  private scrollerStart = 0;
  private scrollerEnd = 0;
  private wrapperTop = 0;
  private wrapperBottom = 0;
  private sizes = {};

  firstUpdated() {
    const { top, height } = this.wrapperRef.value.getBoundingClientRect();
    this.wrapperTop = top;
    this.wrapperBottom = top + height;
    const count = height / this.initialSize + 10;

    this.visibleItems = this.items.slice(0, count);
    // this.requestUpdate()
    console.log(this.items, this.visibleItems);
  }

  private updateVisibleItems() {
    console.log("UPDATE!");
  }

  @eventOptions({ passive: true })
  private _handleScroll(e: Event) {
    requestAnimationFrame(() => {
      const scrollerRect = this.scrollerRef.value.getBoundingClientRect();
      this.scrollerStart = scrollerRect.top - this.wrapperTop;
      this.scrollerEnd = scrollerRect.top + scrollerRect.height;
    });
  }

  protected render() {
    return html`
      <div
        class="uv-list__wrapper"
        ${ref(this.wrapperRef)}
        @scroll="${this._handleScroll}"
      >
        <div class="uv-list__scroller" ${ref(this.scrollerRef)}>
          ${repeat(
            this.visibleItems,
            (item: UVListItem) => item.id,
            (item, index) => html`
              <uv-list-element
                .initialSize="${this.initialSize}"
                .index="${index}"
                .item="${item}"
              >
              </uv-list-element>
            `
          )}
        </div>
      </div>
    `;
  }
}
// <slot> ${index}. ${item.content}</slot>
//        ${this.items.map(item => html`<div>${item}</div>`)}
declare global {
  interface HTMLElementTagNameMap {
    "uv-list": UVList;
  }
}
