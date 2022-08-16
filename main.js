import { LitElement, html, css, render } from "lit";
import "./style.css";
import "./lib/list/list";
import "./lib/tree/tree";
import { createMockData } from "./mock";
import treeMock from "./tree-mock";

class App extends LitElement {
  static properties = {
    items: { type: Array },
    selected: { type: Number },
    treeMock: { type: Array }
  };

  static styles = css`
    #global-wrapper {
      height: 400px;
      padding: 2rem 0;
      width: 400px;
    }
  `;

  constructor() {
    super();
    this.items = createMockData(100000);
    this.treeMock = treeMock
    this.selected = 5;
  }

  pushItem() {
    const id = this.items[this.items.length - 1].id + 1;
    this.items = this.items.concat([
      {
        id,
        content:
          `Content of good old item number ${id} ` +
          `${Array(Math.floor(Math.random() * 10)).fill(
            " some additonal words"
          )}`,
      },
    ]);
  }

  unshiftItem() {
    const id = this.items[0].id - 1;
    this.items = [
      {
        id,
        content:
          `Content of good old item number ${id} ` +
          `${Array(Math.floor(Math.random() * 10)).fill(
            " some additonal words"
          )}`,
      },
    ].concat(this.items);
  }

  changeOrder() {
    const items = Array.from(this.items);
    items[0] = this.items[1];
    items[1] = this.items[0];
    this.items = items;
  }

  onSelected(event) {
    if (event.detail.item) {
      this.selected = event.detail.item.id;
    }
  }

  renderItem(item) {
    return html`<b>${item.id}:</b> ${item.name}`;
  }

  render() {
    return html`
      <div id="global-wrapper">
        <uv-tree
          .nonBlockingRender="${true}"
          .initialSize="${35}"
          .items="${this.treeMock}"
          .renderItem="${this.renderItem.bind(this)}"
          .selectedId="${this.selected}"
          @selected="${this.onSelected}"
        >
        </uv-tree>

        <!--         <uv-list
          .nonBlockingRender="${true}"
          .initialSize="${50}"
          .items="${this.items}"
          .renderItem="${this.renderItem.bind(this)}"
          .selectedId="${this.selected}"
          @selected="${this.onSelected}"
        >
        </uv-list>
 -->
      </div>
    `;
  }
}

customElements.define("uv-app", App);

render(html`<uv-app></uv-app>`, document.querySelector("#app"));
