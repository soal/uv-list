import { LitElement, html, css } from "lit";
import { customElement, property, eventOptions } from "lit/decorators.js";
import { Ref, ref, createRef } from "lit/directives/ref.js";
import { UVListView } from "./@types";

@customElement("uv-list-element")
export default class UVListElement extends LitElement {
  @property({ type: Object })
  view: UVListView;

  @property({ type: String })
  uid: string;

  @property({ type: Number })
  initialSize: number = 0;

  static styles = css`
    .uv-list__element {
      border-bottom: 1px solid #ccc;
      padding: 0.5rem;
    }
  `;

  updated() {
    this.dispatchRendered(
      this.renderRoot.firstElementChild.getBoundingClientRect().height
    );
  }

  dispatchRendered(height: number) {
    const item = this.view.item;
    const event = new CustomEvent("rendered", {
      bubbles: true,
      composed: true,
      detail: {
        item,
        height,
      },
    });
    this.dispatchEvent(event);
  }

  protected render() {
    return html`
      <div class="uv-list__element" style="min-height: ${this.initialSize}px;">
        ${this.view.item.content}
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
