import { LitElement, html, css } from "lit";
import { ref, createRef } from "lit/directives/ref.js";

export default class UVListElement extends LitElement {
  static properties = {
    itemId: { type: [Number, String] },
    view: { type: Object },
    viewId: { type: [Number, String] },
    index: { type: Number },
    initialSize: { type: Number },
    renderItem: { type: Function },
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
      // const lastEntry = entries[entries.length - 1];
      // if (lastEntry.contentRect.height !== this.itemSize) {
      //   // if (this.view.isUsed) {
      //     this.itemSize = lastEntry.contentRect.height;
      //     this.dispatchResize(this.itemSize);
      //   // }
      // }
      if (!this.view.isUsed) return
      for (let entry of entries) {
        // if (entry.contentRect.height !== this.itemSize) {
          // console.log('RESIZE EVENT', this.itemId, entry)
          this.itemSize = entry.borderBoxSize[0].blockSize
          this.dispatchResize(this.itemSize);
        }
      // }
    });
    this.rootRef = createRef();
    this.renderItem = (item) => item;
    this.itemSize = this.initialSize;
  }

  firstUpdated() {
    this.resizeObserver.observe(this.renderRoot.firstElementChild);
  }

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

  render() {
    console.log("ELEMENT RENDER", this.view?.item?.id, this.view.isUsed);
    return html`
      <div ${ref(this.rootRef)} class="uv-list__element">
        ${this.renderItem(this.view.item, this.index)}
      </div>
    `;
  }
}
// <slot>${this.item.content}</slot>

customElements.define("uv-list-element", UVListElement);
