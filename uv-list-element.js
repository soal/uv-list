import { LitElement, html, css } from "lit";
import { ref, createRef } from "lit/directives/ref.js";

export default class UVListElement extends LitElement {
  static properties = {
    view: { type: Object },
    ui: { type: String },
    itemId: { type: [String, Number] },
    initialSize: { type: Number },
  };

  static styles = css`
    .uv-list__element {
      border-bottom: 1px solid #ccc;
      padding: 0.5rem;
    }
  `;

  constructor() {
    super();
    this.resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        this.dispatchResize(entry.contentRect.height)
      }
    });
    this.rootRef = createRef();
  }

  firstUpdated() {
    // this.resizeObserver.observe(this.rootRef.value);
    this.resizeObserver.observe(this.renderRoot.firstElementChild);
    // this.renderRoot.firstElementChild.getBoundingClientRect().height
  }

  // updated() {
  //   this.dispatchResize(
  //     // this.rootRef.value.getBoundingClientRect().height
  //     // this.rootRef.value.getBoundingClientRect().height
  //     this.renderRoot.firstElementChild.getBoundingClientRect().height
  //   );
  // }

  dispatchResize(height) {
    const item = this.view.item;
    const event = new CustomEvent("resize", {
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
  //   const promise = new Promise((resolve) =>
  //     setTimeout(() => resolve())
  //   );
  //   await promise;
  //   return super.performUpdate();
  // }

  render() {
    return html`
      <div
        ${ref(this.rootRef)}
        class="uv-list__element"
      >
        ${this.view.item ? this.view.item.content : null}
      </div>
    `;
  }
}
// <slot>${this.item.content}</slot>

customElements.define("uv-list-element", UVListElement);
