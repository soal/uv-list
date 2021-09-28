import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js"

type Item = {
  id: string | number
  content: string
}

@customElement("uv-list")
export default class UVList extends LitElement {

  @property({ type: Array })
  items: Item[] = []

  @property({ type: Number })
  initialSize: number = 0;

  static styles = css`
    :host {
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }
  `;

  protected render() {
    return html`
      <div class="uv-list__scroller">
       ${repeat(
        this.items,
        (item: Item) => item.id,
        (item, index) => html`
          <div style="min-height: ${this.initialSize}px;" class="uv-list__element">
            <slot>
              ${index}. ${item.content}
            </slot>
          </div>
        `)}
      </div>
    `;
  }
}
//        ${this.items.map(item => html`<div>${item}</div>`)}
