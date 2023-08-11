import { LitElement, html, css } from "lit";
import { ref, createRef } from "lit/directives/ref.js";
import { classMap } from "lit/directives/class-map.js";

export default class UVListElement extends LitElement {
  static properties = {
    index: { type: Number },
    initialSize: { type: Number },
    item: { type: Object },
    selectedId: { type: Number },
    size: { type: Number },
    start: { type: Number },
    view: { type: Object },

    handleResize: { type: Function },
    renderItem: { type: Function },
  };

  constructor() {
    super();
    this.resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const size = entry.borderBoxSize[0].blockSize;
        if (size === 0) return;
        this.handleResize({
          item: this.item,
          size,
          index: this.index,
          view: this.view,
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
    await new Promise((resolve) => requestAnimationFrame(() => resolve()));
    // await new Promise((resolve) => setTimeout(() => resolve()));
    return super.scheduleUpdate();
  }

  createRenderRoot() {
    return this;
  }

  firstUpdated() {
    this.resizeObserver.observe(this.rootRef.value);
  }

  updated() {
    if (!this.view.ready) {
      this.view.ready = true
    }
  }

  render() {
    const classes = {
      "uv-list__element": true,
      "uv-list__element__selected": this.view.item.id === this.selectedId,
    };
    let pos = -99999999;
    if (this.size !== this.initialSize || this.view.ready) {
      pos = this.start;
    }
    const style = `top: ${pos}px`;

    return html`
      <style>
        .uv-list__element {
          box-sizing: border-box;
          position: absolute;
          width: 100%;
          top: -99999999px;
          will-change: transform, scroll-position;
          contain: style layout;
        }
      </style>
      <div ${ref(this.rootRef)} class="${classMap(classes)}" style="${style}">
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
