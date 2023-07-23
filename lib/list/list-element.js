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
    exportparts: { type: String, reflect: true }
  };

  static styles = css`
    .uv-list__element {
      box-sizing: border-box;
      position: absolute;
      top: -99999999px;
      width: 100%;
    }
    .uv-list__element.ready {
      /*position: static;*/
      top: unset;
    }
  `;

  constructor() {
    super();
    this.resizeObserver = new ResizeObserver(async (entries) => {
        for (let entry of entries) {
          const itemSize = entry.borderBoxSize[0].blockSize;
          this.dispatchResize(itemSize);
        }
    });
    this.rootRef = createRef();
    this.renderItem = (item) => item;
    this.exportparts = "item, header"

    this.addEventListener("click", (e) => {
      this.dispatchEvent(
        new CustomEvent("selected", {
          composed: true,
          bubbles: true,
          detail: { item: this.view.item },
        })
      );
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
        index: this.index
      },
    });
    this.dispatchEvent(event);
  }

  render() {
    const classes = {
      "uv-list__element": true,
      ready: this.ready,
      selected: this.view.item.id === this.selectedId,
    };
    const style = `top: ${this.start}px`;
    return html`
      <div part="item" ${ref(this.rootRef)} class="${classMap(classes)}" style="${style}">
        ${this.renderItem(this.view.item, this.index)}
      </div>
    `;
  }
}

customElements.define("uv-list-element", UVListElement);
