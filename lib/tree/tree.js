import { LitElement, html, css } from "lit";
import {
  normalizeChildrenByTrack,
  makeItems,
  makeList,
  defaultSearch,
  makeDefaultPredicate,
  makeSearchParams,
} from "./tree-utils.js";
import { styleMap } from "lit/directives/style-map.js";
import "../list/list";

export default class UVTree extends LitElement {
  static properties = {
    after: { type: Function },
    before: { type: Function },
    buffer: { type: Number },
    initialSize: { type: Number },
    items: { type: [Array, Object] },
    keyboardEnabled: { type: Boolean },
    keyboardThrottle: { type: Number },
    onClick: { type: Function },
    openPadding: { type: Number },
    empty: { type: Function },
    renderItem: { type: Function },
    searchParams: { type: Object },
    searchQuery: { type: String },
    selectedId: { type: Number },
    showDepth: { type: Number },
    skipPrepare: { type: Boolean },
    trackShift: { type: Number },
    vimNavigation: { type: Boolean },
    _searchMode: false,
  };

  _list = [];
  _filteredList = [];
  _processed = {};
  _visualMap = {};
  _visibleList = [];
  _filterMode = false;

  constructor() {
    super();
    this.updateInternal(true);
    this.skipPrepare = false;
    this.before = this.before ?? null;
    this.after = this.after ?? null;
    this.trackShift = 1;
    this.showDepth = 1;
    this.onClick = null;
    this.openPadding = 20;
    this.searchParams = makeSearchParams(this.searchParams);
    this.searchQuery = "";
  }

  createRenderRoot() {
    return this;
  }

  firstUpdated() {
    this.updateInternal(true);
  }

  willUpdate(props) {
    if (props.get("searchQuery") !== this.searchQuery) {
      this._searchMode =
        this.searchQuery?.toString().length >=
        this.searchParams.minimalQueryLength;

      if (Boolean(this._searchMode) !== Boolean(props.get("_searchMode"))) {
        if (this._searchMode === false) {
          this._visualMap = {};
        }
      }
      this.updateInternal();
    }

    if (props.get("items")) {
      this.updateInternal();
    }
  }

  search() {
    const predicates = [];
    if (this.searchQuery.length >= this.searchParams.minimalQueryLength) {
      predicates.push(
        makeDefaultPredicate({
          searchString: this.searchQuery,
          params: {
            fields: this.searchParams.fields,
            caseSensitive: this.searchParams.caseSensitive,
          },
        }),
      );
    }
    const searchFunc = this.searchParams.searchFunction ?? defaultSearch;
    return searchFunc({
      list: this._list,
      items: this.items,
      predicates,
    });
  }

  updateInternal(initial = false) {
    if (!this.items) return;
    const items = JSON.parse(JSON.stringify(this.items));
    if (this.skipPrepare) {
      this._processed = items;
    } else {
      this._processed = makeItems(this.items);
      normalizeChildrenByTrack(this._processed);
    }
    this._list = makeList(this._processed, "id");
    if (this._searchMode) {
      this._filteredList = this.search();
    } else {
      this._filteredList = [...this._list];
    }
    this.updateVisibleList(initial);
  }

  updateVisibleList(initial = false) {
    const visible = [];

    // Проходим по всем отфильрованным элементам
    for (let item of this._filteredList) {
      /* Если компонент в режиме поиска или фильтрации,
       * то  в списке только отфильтрованные элементы и их родители,
       * нужно показать всё
       */
      if (this._searchMode || this._filterMode) {
        const parent = this.items[item.track[item.track.length - 1]];
        if (parent && this._visualMap[parent.id] === false) {
          continue;
        }

        visible.push(item);
        if (this._visualMap[item.id] !== false) {
          this._visualMap[item.id] = true;
        }
        continue;
      }

      // Первоначальный рендер компонента
      if (initial) {
        // Учитывам props trackShift и показываем элементы,
        // которые находятся в иерархии на уровне, заданном в props
        if (
          item.track.length - this.trackShift >= 0 &&
          item.track.length <= this.showDepth
        ) {
          visible.push(item);
          if (this.visualMap[item.id] !== false) {
            this.visualMap[item.id] = true;
          }
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
    const padding =
      this.openPadding * (item.track.length - this.trackShift) + "px;";
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
        .empty="${this.empty}"
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
