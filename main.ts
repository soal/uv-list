import "./style.css";
import "./uv-list.ts";
import { html, render } from "lit-html";

const items = [
  {
    id: 1,
    content:
      "Content of good old item number 1 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 2,
    content:
      "Content of good old item number 2 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 3,
    content:
      "Content of good old item number 3 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 4,
    content:
      "Content of good old item number 4 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 5,
    content:
      "Content of good old item number 5 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 6,
    content:
      "Content of good old item number 6 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 7,
    content:
      "Content of good old item number 7 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 8,
    content:
      "Content of good old item number 8 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 9,
    content:
      "Content of good old item number 9 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 10,
    content:
      "Content of good old item number 10 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 11,
    content:
      "Content of good old item number 11 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 12,
    content:
      "Content of good old item number 12 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 13,
    content:
      "Content of good old item number 13 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 14,
    content:
      "Content of good old item number 14 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 15,
    content:
      "Content of good old item number 15 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 16,
    content:
      "Content of good old item number 16 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 17,
    content:
      "Content of good old item number 17 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 18,
    content:
      "Content of good old item number 18 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 19,
    content:
      "Content of good old item number 19 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 20,
    content:
      "Content of good old item number 20 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 21,
    content:
      "Content of good old item number 21 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 22,
    content:
      "Content of good old item number 22 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 23,
    content:
      "Content of good old item number 23 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 24,
    content:
      "Content of good old item number 24 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 25,
    content:
      "Content of good old item number 25 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 26,
    content:
      "Content of good old item number 26 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 27,
    content:
      "Content of good old item number 27 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 28,
    content:
      "Content of good old item number 28 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 29,
    content:
      "Content of good old item number 29 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 30,
    content:
      "Content of good old item number 30 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 31,
    content:
      "Content of good old item number 31 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 32,
    content:
      "Content of good old item number 32 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 33,
    content:
      "Content of good old item number 33 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 34,
    content:
      "Content of good old item number 34 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 35,
    content:
      "Content of good old item number 35 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 36,
    content:
      "Content of good old item number 36 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 37,
    content:
      "Content of good old item number 37 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 38,
    content:
      "Content of good old item number 38 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 39,
    content:
      "Content of good old item number 39 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 40,
    content:
      "Content of good old item number 40 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 41,
    content:
      "Content of good old item number 41 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 42,
    content:
      "Content of good old item number 42 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 43,
    content:
      "Content of good old item number 43 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
  {
    id: 44,
    content:
      "Content of good old item number 44 " +
      `${Array(Math.floor(Math.random() * 10)).fill(" some additonal words")}`,
  },
];
render(
  html`
    <div id="global-wrapper">
      <uv-list .initialSize="${50}" .items="${items}"></uv-list>
    </div>
  `,
  document.querySelector("#app") as HTMLElement
);
