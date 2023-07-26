import { LitElement, html, css, render } from "lit";
import { classMap } from "lit/directives/class-map.js";
import "./style.css";
import "./lib/list/list";
import "./lib/tree/tree";
import { createMockData } from "./mock";
// import treeMock from "./tree-mock";

class App extends LitElement {
  static properties = {
    items: { type: Array },
    selected: { type: Number },
    treeMock: { type: Array },
  };

  static styles = css`
    #global-wrapper {
      height: 700px;
      padding: 2rem 0;
      width: 400px;
    }

    .list-el {
      padding: 1em 0.5em;
    }
    .list-el.selected {
      background-color: rgba(0, 0, 255, 0.2);
    }
  `;

  constructor() {
    super();
    this.items = createMockData(1000);
    // this.treeMock = treeMock
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

  append() {
    this.items = this.items.concat(createMockData(100));
  }

  changeOrder() {
    const items = Array.from(this.items);
    items[0] = this.items[1];
    items[1] = this.items[0];
    this.items = items;
  }

  onSelected(event) {
    if (event.detail?.item) {
      this.selected = event.detail.item.id;
    }
  }

  renderItem(item, _, isSelected) {
    const classes = {
      "list-el": true,
      selected: isSelected,
    };
    // return html`<b>${item.id}:</b> ${item.name}`;
    return html`<div class="${classMap(classes)}">
      <b>${item.id}:</b> ${item.content}
    </div>`;
  }

  before() {
    return "START"
  }

  after() {
    return "END"
  }

  render() {
    return html`
      <div id="global-wrapper">
        <uv-list
          .initialSize="${100}"
          .items="${this.items}"
          .renderItem="${this.renderItem}"
          .keyboardEnabled="${true}"
          .vimNavigation="${true}"
          .selectedId="${this.selected}"
          .before="${this.before}"
          .after="${this.after}"

          @selected="${this.onSelected}"
        >
        </uv-list>
      </div>
      <button @click="${this.append}">Append</button>
      <button @click="${this.pushItem}">Push</button>
      <button @click="${this.unshiftItem}">Unshift</button>
      <button @click="${this.changeOrder}">Change Order</button>
    `;
  }
}

customElements.define("uv-app", App);

render(html`<uv-app></uv-app>`, document.querySelector("#app"));
