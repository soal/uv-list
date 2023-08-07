import { LitElement, html, css } from "lit";
import { normalizeChildrenByTrack, makeItems, makeList } from "./tree-utils.js";
import { styleMap } from "lit/directives/style-map.js";
import "../list/list";

export default class UVTree extends LitElement {
  static properties = {
    items: { type: [Array, Object] },
    initialSize: { type: Number },
    buffer: { type: Number },
    renderItem: { type: Function },
    selectedId: { type: Number },
    before: { type: Function },
    after: { type: Function },
    keyboardEnabled: { type: Boolean },
    keyboardThrottle: { type: Number },
    vimNavigation: { type: Boolean },
    searchMode: { type: Boolean },
    skipPrepare: { type: Boolean },
    trackShift: { type: Number },
    showDepth: { type: Number },
    onClick: { type: Function },
    openPadding: { type: Number }
  };

  _list = [];
  _processed = {};
  _visualMap = {};
  _visibleList = [];

  constructor() {
    super();
    this.updateInternal(true);
    this.searchMode = false;
    this.skipPrepare = false;
    this.before = this.before ?? null;
    this.after = this.after ?? null;
    this.trackShift = 1;
    this.showDepth = 1;
    this.onClick = null
    this.openPadding = 20
  }

  createRenderRoot() {
    return this;
  }

  firstUpdated() {
    this.updateInternal(true);
  }

  willUpdate(props) {
    if (props.get("items")) {
      this.updateInternal();
    }
  }

  updateInternal(initial = false) {
    if (!this.items) return;
    const items = JSON.parse(JSON.stringify(this.items));
    if (this.skipPrepare) {
      this._processed = items;
    } else {
      // this._processed = makeItems({
      //   id: 0,
      //   children: Object.values(items),
      //   track: [],
      // });
      this._processed = makeItems(this.items);
      normalizeChildrenByTrack(this._processed);
    }
    // normalizeChildrenByTrack(this._processed);
    // console.log("@@@@@@@@@@ BEFORE LIST", this._processed)
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
      // console.log("PING 1")
      if (
        item.track.length - this.trackShift >= 0 &&
        item.track.length <= this.showDepth
      ) {
        // console.log("PING 1.1", item.id, item.name)
        visible.push(item);
        continue;
      }
      // Если элемент указан в visualMap — нужно его показать
      // console.log("PING 2")
      if (this._visualMap[item.id]) {
        // console.log("PING 2.2")
        // console.log("FOUND IN VISUAL MAP")
        visible.push(item);
        continue;
      }
      // Если родительский элмент в visualMap,
      // значит, он раскрыт и текущий элемент надо показать
      // console.log(item.track)
      // console.log("PING 3")
      if (this._visualMap[item.track[item.track.length - 1]]) {
        // console.log("PARENT FOUND IN VISUAL MAP")
        // console.log("PING 3.3")
        visible.push(item);
      }
    }
    this._visibleList = visible;
    // console.log("######### RESULT ", visible)
    this.requestUpdate();
  }

  onElementSelected(event) {
    let stop = false;
    if (this.onClick) {
      stop = this.onClick(event);
    }
    if (!stop) {
      this.toggle(event);
    }
  }

  toggle(event) {
    // console.log("@@@@@@@@@@ TOGGLE", event);
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

  renderTreeItem(item, index, selected) {
    const padding = this.openPadding * (item.track.length - this.trackShift) + "px;";
    const opened = item.children.length && this._visualMap[item.id];
    return html`
      <div style="${styleMap({ "padding-left": padding })}">
        ${this.renderItem(item, index, selected, opened)}
      </div>
    `;
  }

  render() {
    return html`
      <uv-list
        .initialSize="${this.initialSize}"
        .items="${this._visibleList}"
        .renderItem="${this.renderTreeItem.bind(this)}"
        .selectedId="${this.selected}"
        .before="${this.before}"
        .after="${this.after}"
        .keyboardEnabled="${this.keyboardEnabled}"
        .keyboardThrottle="${this.keyboardThrottle}"
        .vimNavigation="${this.vimNavigation}"
        @selected="${this.onElementSelected}"
      >
      </uv-list>
    `;
  }
}

customElements.define("uv-tree", UVTree);
