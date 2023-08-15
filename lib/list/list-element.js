import { LitElement, html, css } from "lit";
import { ref, createRef } from "lit/directives/ref.js";
import { classMap } from "lit/directives/class-map.js";

export default class UVListElement extends LitElement {
  static properties = {
    index: { type: Number },
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
        // console.log("RESIZE", size)
        // this.handleResize({
        //   item: this.item,
        //   size,
        //   index: this.index,
        //   view: this.view,
        // });
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

  // async scheduleUpdate() {
  //   // await new Promise((resolve) => requestAnimationFrame(() => resolve()));
  //   await new Promise((resolve) => setTimeout(() => resolve()));
  //   return super.scheduleUpdate();
  // }

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
    const style = `transform: translateY(${this.start}px); height: ${this.size}px`;

    return html`
      <style>
        .uv-list__element {
          box-sizing: border-box;
          contain: style layout;
          content-visibility: auto;
          position: absolute;
          top: 0;
          width: 100%;
        }
      </style>
      <div ${ref(this.rootRef)} class="${classMap(classes)}" style="${style}">
        ${this.renderItem(
          this.view.item,
          this.index,
          this.selectedId === this.view.item.id,
        )}
      </div>
    `;
  }
}

customElements.define("uv-list-element", UVListElement);
