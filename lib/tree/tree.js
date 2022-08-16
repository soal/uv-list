import { LitElement, html, css } from "lit";
import {
  addToList,
  compareDefault,
  normalizeChildrenByTrack,
  makeItems,
  sort,
} from "./tree-utils.js";

export default class UVTree extends LitElement {
  static properties = {
    items: { type: Array },
    initialSize: { type: Number },
    buffer: { type: Number },
    nonBlockingRender: { type: Boolean },
    renderItem: { type: Function },
    selectedId: { type: Number },
    // _processed: { type: Array }
  };

  _processed = [];

  set items(val) {
    this._processed = val
  }

  constructor() {
    super();
  }

  render() {
    return html`
      <uv-list
        .nonBlockingRender="${this.nonBlockingRender}"
        .initialSize="${this.initialSize}"
        .items="${this._processed}"
        .renderItem="${this.renderItem}"
        .selectedId="${this.selected}"
      >
      </uv-list>
    `;
  }
}

customElements.define("uv-tree", UVTree);
