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
];
render(html`
  <uv-list .items="${items}"></uv-list>
`, document.querySelector("#app") as HTMLElement);
