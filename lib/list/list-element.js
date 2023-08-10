import { LitElement, html, css } from "lit";
import { ref, createRef } from "lit/directives/ref.js";
import { classMap } from "lit/directives/class-map.js";

export default class UVListElement extends LitElement {
  static properties = {
    itemId: { type: [Number, String] },
    view: { type: Object },
    viewId: { type: [Number, String] },
    index: { type: Number },
    initialSize: { type: Number },
    renderItem: { type: Function },
    // itemSize: { type: Number },
    ready: { type: Boolean },
    start: { type: Number },
    selectedId: { type: Number },
    handleResize: { type: Function },
  };

  constructor() {
    super();
    this.resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const itemSize = entry.borderBoxSize[0].blockSize;
          if (itemSize === 0) return
          this.handleResize({
            item: this.view.item,
            height: itemSize,
            index: this.index,
          });
      }
    });
    this.rootRef = createRef();
    this.renderItem = (item) => item;

    this.addEventListener("click", (e) => {
      this.dispatchEvent(
        new CustomEvent("selected", {
          composed: true,
          bubbles: true,
          detail: { item: this.view.item },
        }),
      );
    });
  }

  async scheduleUpdate() {
    // await new Promise((resolve) => requestAnimationFrame(() => resolve()));
    await new Promise((resolve) => setTimeout(() => resolve()));
    return super.scheduleUpdate();
  }

  createRenderRoot() {
    return this;
  }

  firstUpdated() {
    this.resizeObserver.observe(this.rootRef.value);
  }

  render() {
    const classes = {
      "uv-list__element": true,
      "uv-list__element__selected": this.view.item.id === this.selectedId,
    };
    const style = `top: ${this.start}px`;
    return html`
      <style>
        .uv-list__element {
          box-sizing: border-box;
          position: absolute;
          top: -99999999px;
          width: 100%;
          contain: style layout;
        }
      </style>
      <div
        part="item"
        ${ref(this.rootRef)}
        class="${classMap(classes)}"
        style="${style}"
      >
        ${this.renderItem(
          this.view.item,
          this.index,
          this.view.item.id === this.selectedId,
        )}
      </div>
    `;
  }
}

customElements.define("uv-list-element", UVListElement);
