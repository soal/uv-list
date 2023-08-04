import { LitElement, html, css } from "lit";
import { normalizeChildrenByTrack, makeItems, makeList } from "./tree-utils.js";
import { styleMap } from 'lit/directives/style-map.js';
import "../list/list";

export default class UVTree extends LitElement {
  static properties = {
    items: { type: Array },
    initialSize: { type: Number },
    buffer: { type: Number },
    renderItem: { type: Function },
    selectedId: { type: Number },
    before: { type: Function },
    after: { type: Function },
    keyboardEnabled: { type: Boolean },
    keyboardThrottle: { type: Number },
    vimNavigation: { type: Boolean },
  };

  _list = [];
  _processed = {};
  _visualMap = {};
  trackShift = 1;
  showDepth = 1;
  _visibleList = [];

  constructor() {
    super();
    this.updateInternal(true);
  }

  firstUpdated() {
    this.updateInternal(true);
  }

  willUpdate(props) {
    if (props.get("items")) {
      this.updateInternal()
    }
  }

  updateInternal(initial = false) {
    if (!this.items) return;
    const items = JSON.parse(JSON.stringify(this.items));
    this._processed = makeItems({ id: 0, children: items, track: [] });
    normalizeChildrenByTrack(this._processed);
    this._list = makeList(this._processed, "id");
    this.updateVisibleList(initial);
  }

  updateVisibleList(initial = false) {
    const visible = [];

    // Проходим по всем отфильрованным элементам
    for (let item of this._list) {
      /* Если компонент в режиме поиска или фильтрации,
       * то  в списке только отфильтрованные элементы и их родители,
       * нужно показать всё
       */
      // if (this.searchMode || this.filterMode) {
      //   const parent = this.items[item.track[item.track.length - 1]]
      //   if (parent && this.visualMap[parent.id] === false) {
      //     continue
      //   }
      //   visible.push(item)
      //   if (this.visualMap[item.id] !== false) {
      //     this.visualMap[item.id] = true
      //   }
      //   continue
      // }

      // Первоначальный рендер компонента
      if (initial) {
        // Учитывам props trackShift и показываем элементы,
        // которые находятся в иерархии на уровне, заданном в props
        if (
          item.track.length - this.trackShift >= 0 &&
          item.track.length <= this.showDepth
        ) {
          visible.push(item);

          // this._visualMap[item.id] = true;
        }
        continue;
      }
      // Учитывам props trackShift при повторном рендере
      if (
        item.track.length - this.trackShift >= 0 &&
        item.track.length <= this.showDepth
      ) {
        visible.push(item);
        continue;
      }
      // Если элемент указан в visualMap — нужно его показать
      if (this._visualMap[item.id]) {
        visible.push(item);
        continue;
      }
      // Если родительский элмент в visualMap,
      // значит, он раскрыт и текущий элемент надо показать
      if (this._visualMap[item.track[item.track.length - 1]]) {
        visible.push(item);
      }
    }
    this._visibleList = visible;
    this.requestUpdate();
  }

  toggle(event) {
    const item = event.detail.item;
    if (!item.children || !item.children.length) return;
    const newState = !this._visualMap[item.id];
    if (!newState) {
      this.hideRecursive(item);
    }
    this._visualMap[item.id] = newState;
    this.updateVisibleList();
  }

  hideRecursive(item) {
    item?.children.forEach((childId) => {
      const child = this._processed[childId];
      if (child?.children?.length) {
        this._visualMap[childId] = false;
        return this.hideRecursive(child);
      }
    });
  }

  renderTreeItem(item, index) {
    const padding = 20 * (item.track.length - this.trackShift) + "px;"
    return html`
      <div style="${styleMap({ "padding-left": padding })}">${this.renderItem(item, index)}</div>
    `;
  }

  render() {
    return html`
      <uv-list
        .initialSize="${this.initialSize}"
        .items="${this._visibleList}"
        .renderItem="${this.renderTreeItem.bind(this)}"
        .selectedId="${this.selected}"
        .before="${before}"
        .after="${after}"
        .keyboardEnabled="${keyboardEnabled}"
        .keyboardThrottle="${keyboardThrottle}"
        .vimNavigation="${vimNavigation}"
        @selected="${this.toggle}"
      >
      </uv-list>
    `;
  }
}

customElements.define("uv-tree", UVTree);
