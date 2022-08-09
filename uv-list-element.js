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
    itemSize: { type: Number },
    ready: { type: Boolean },
    start: { type: Number },
    selectedId: { type: Number }
  };

  static styles = css`
    .uv-list__element {
      border-bottom: 1px solid #ccc;
      box-sizing: border-box;
      padding: 0.5rem;
      position: absolute;
      top: -999999px;
      width: 100%;
    }
    .uv-list__element.ready {
      /*position: static;*/
      top: unset;
    }
    .selected {
      color: red;
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
      if (!this.view.isUsed) return;
      for (let entry of entries) {
        // if (entry.contentRect.height !== this.itemSize) {
        this.itemSize = entry.borderBoxSize[0].blockSize;
        this.dispatchResize(this.itemSize);
      }
      // }
    });
    this.rootRef = createRef();
    this.renderItem = (item) => item;
    this.itemSize = this.initialSize;

    this.addEventListener('click', (e) => {
      this.dispatchEvent(new CustomEvent("selected", {
        composed: true,
        bubbles: true,
        detail: { item: this.view.item }
      }))
    });
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
    // console.log(
    //   "ELEMENT RENDER",
    //   this.view?.item?.id,
    //   this.itemSize,
    //   this.view.ready
    // );
    const classes = {
      "uv-list__element": true,
      ready: this.ready,
      selected: this.view.item.id === this.selectedId
    };
    const style = `top: ${this.start}px`;
    return html`
      <div ${ref(this.rootRef)} class="${classMap(classes)}" style="${style}">
        ${this.renderItem(this.view.item, this.index)}
      </div>
    `;
  }
}
// <slot>${this.item.content}</slot>

customElements.define("uv-list-element", UVListElement);
