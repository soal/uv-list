import { LitElement, html, css, render } from "lit";
import { customElement, state } from "lit/decorators.js";
import "./style.css";
import "./uv-list.ts";
import { items } from "./mock"


@customElement("uv-app")
class App extends LitElement {
  @state()
  items = items;

  static styles = css`
    #global-wrapper {
      height: 300px;
      padding: 2rem 0;
      width: 400px;
    }
  `;

  pushItem() {
    const items = this.items
    const id = this.items[this.items.length - 1].id + 1;
    items.push({
      id,
      content:
        `Content of good old item number ${id} ` +
        `${Array(Math.floor(Math.random() * 10)).fill(
          " some additonal words"
        )}`,
    });
    this.items = items
  }

  unshiftItem() {
    const id = this.items[0].id - 1;
    this.items = [{
      id,
      content:
        `Content of good old item number ${id} ` +
        `${Array(Math.floor(Math.random() * 10)).fill(
          " some additonal words"
        )}`,
    }].concat(this.items)
  }

  protected render() {
    return html`
      <div id="global-wrapper">
        <uv-list
          .nonBlockingRender="${true}"
          .initialSize="${50}"
          .items="${this.items}"
        ></uv-list>
      </div>
    `;
  }
}

render(html`<uv-app></uv-app>`, document.querySelector("#app") as HTMLElement);
