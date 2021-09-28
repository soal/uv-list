import { LitElement, html, css } from "lit";
import { customElement, property, eventOptions } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { Ref, ref, createRef } from "lit/directives/ref.js";

type Item = {
  id: string | number;
  content: string;
};

@customElement("uv-list")
export default class UVList extends LitElement {
  @property({ type: Array })
  items: Item[] = [];

  @property({ type: Number })
  initialSize: number = 0;

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

  scrollerRef: Ref<HTMLDivElement> = createRef();
  wrapperRef: Ref<HTMLDivElement> = createRef();
  scrollerStart = 0
  scrollerEnd = 0
  wrapperTop = 0
  wrapperBottom = 0

  firstUpdated() {
    const { top, height } = this.wrapperRef.value.getBoundingClientRect()
    this.wrapperTop = top
    this.wrapperBottom = top + height
  }

  @eventOptions({ passive: true })
  private _handleScroll(e: Event) {
    requestAnimationFrame(() => {
      const scrollerRect = this.scrollerRef.value.getBoundingClientRect()
      this.scrollerStart = scrollerRect.top - this.wrapperTop
      this.scrollerEnd = scrollerRect.top + scrollerRect.height
    })
  }

  protected render() {
    return html`
      <div class="uv-list__wrapper" ${ref(this.wrapperRef)} @scroll="${this._handleScroll}">
        <div class="uv-list__scroller" ${ref(this.scrollerRef)}>
          ${repeat(
            this.items,
            (item: Item) => item.id,
            (item, index) => html`
              <div
                style="min-height: ${this.initialSize}px;"
                class="uv-list__element"
              >
                <slot> ${index}. ${item.content} </slot>
              </div>
            `
          )}
        </div>
      </div>
    `;
  }
}
//        ${this.items.map(item => html`<div>${item}</div>`)}
