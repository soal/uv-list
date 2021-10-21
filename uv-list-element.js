import { LitElement, html, css } from "lit";
import { ref, createRef } from "lit/directives/ref.js";

export default class UVListElement extends LitElement {
  static properties = {
    view: { type: Object },
    ui: { type: String },
    itemId: { type: [String, Number] },
    initialSize: { type: Number }
  }

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

  dispatchRendered(height) {
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

  // async performUpdate() {
  //   // Unblock main thread while rendering component
  //   const promise: Promise<void> = new Promise((resolve) =>
  //     setTimeout(() => resolve())
  //   );
  //   await promise;
  //   return super.performUpdate();
  // }

  render() {
    return html`
      <div class="uv-list__element" style="min-height: ${this.initialSize}px;">
        ${this.view.item.content}
      </div>
    `;
  }
}
// <slot>${this.item.content}</slot>

customElements.define('uv-list-element', UVListElement);
