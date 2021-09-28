import { LitElement, html, css } from "lit";
import { customElement, property, eventOptions } from "lit/decorators.js";
import { Ref, ref, createRef } from "lit/directives/ref.js";
import { UVListItem } from "./@types";

@customElement("uv-list-element")
export default class UVListElement extends LitElement {
  @property({ type: Object })
  item: UVListItem = { id: 0, content: "Dummy content" };

  @property({ type: String })
  uid: string;

  @property({ type: Number })
  initialSize: number = 0;

  static styles = css`
    :host {
      display: block;
    }
    .uv-list__element {
      display: block;
    }
  `;

  protected render() {
    return html`
      <div class="uv-list__element" style="min-height: ${this.initialSize}px;">
        ${this.item.content}
      </div>
    `;
  }
}
// <slot>${this.item.content}</slot>

declare global {
  interface HTMLElementTagNameMap {
    "uv-list-element": UVListElement;
  }
}
