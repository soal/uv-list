import "./style.css";
import "./uv-list.ts";
import { html, render } from "lit-html";

const items = [
  { id: 1, content: "Content of good old item number 1" },
  { id: 2, content: "Content of good old item number 2" },
  { id: 3, content: "Content of good old item number 3" },
  { id: 4, content: "Content of good old item number 4" },
  { id: 5, content: "Content of good old item number 5" },
  { id: 6, content: "Content of good old item number 6" },
  { id: 7, content: "Content of good old item number 7" },
  { id: 8, content: "Content of good old item number 8" },
  { id: 9, content: "Content of good old item number 9" },
  { id: 10, content: "Content of good old item number 10" },
  { id: 11, content: "Content of good old item number 11" },
  { id: 12, content: "Content of good old item number 12" },
  { id: 13, content: "Content of good old item number 13" },
  { id: 14, content: "Content of good old item number 14" },
  { id: 15, content: "Content of good old item number 15" },
  { id: 16, content: "Content of good old item number 16" },
  { id: 17, content: "Content of good old item number 17" },
  { id: 18, content: "Content of good old item number 18" },
  { id: 19, content: "Content of good old item number 19" },
  { id: 20, content: "Content of good old item number 20" },
  { id: 21, content: "Content of good old item number 21" },
  { id: 22, content: "Content of good old item number 22" },
  { id: 23, content: "Content of good old item number 23" },
  { id: 24, content: "Content of good old item number 24" },
  { id: 25, content: "Content of good old item number 25" },
  { id: 26, content: "Content of good old item number 26" },
  { id: 27, content: "Content of good old item number 27" },
  { id: 28, content: "Content of good old item number 28" },
  { id: 29, content: "Content of good old item number 29" },
  { id: 30, content: "Content of good old item number 30" },
  { id: 31, content: "Content of good old item number 31" },
  { id: 32, content: "Content of good old item number 32" },
  { id: 33, content: "Content of good old item number 33" },
  { id: 34, content: "Content of good old item number 34" },
  { id: 35, content: "Content of good old item number 35" },
  { id: 36, content: "Content of good old item number 36" },
  { id: 37, content: "Content of good old item number 37" },
  { id: 38, content: "Content of good old item number 38" },
  { id: 39, content: "Content of good old item number 39" },
  { id: 40, content: "Content of good old item number 40" },
  { id: 41, content: "Content of good old item number 41" },
  { id: 42, content: "Content of good old item number 42" },
  { id: 43, content: "Content of good old item number 43" },
  { id: 44, content: "Content of good old item number 44" }
];
render(
  html`
    <div id="global-wrapper">
      <uv-list .initialSize="${50}" .items="${items}"></uv-list>
  </div>
  `,
  document.querySelector("#app") as HTMLElement
);
