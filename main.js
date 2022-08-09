import { LitElement, html, css, render } from "lit";
import "./style.css";
import "./uv-list.js";
import { createMockData } from "./mock";

class App extends LitElement {
  static properties = {
    items: { type: Array },
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
    this.items = createMockData(1000);
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

  renderItem(item) {
    return html`<b>${item.id}:</b> ${item.content}`;
  }

  render() {
    return html`
      <div id="global-wrapper">
        <uv-list
          .nonBlockingRender="${true}"
          .initialSize="${50}"
          .items="${this.items}"
          .renderItem="${this.renderItem}"
        >
        </uv-list>
      </div>
    `;
  }
}

customElements.define("uv-app", App);

render(html`<uv-app></uv-app>`, document.querySelector("#app"));
