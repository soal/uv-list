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
  initialSize: number = 30;

  static styles = css`
    :host {
      height: 100%;
      display: flex;
      flex-direction: column;
      /*width: 100%;*/
    }
    h1 {
      font-size: 42px;
    }
    .uv-list {
      flex: 1 1 auto;
      height: 100%;
      width: 100%;
    }
    .uv-list__wrapper {
      padding: 0 1rem;
      width: 100%;
    }
  `;

  protected render() {
    return html`
      <h1>Universal list</h1>
      <div class="uv-list__wrapper">
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
