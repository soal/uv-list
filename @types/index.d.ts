import type { TemplateResult } from "lit";
export type UVListItem = {
  id: string | number;
  content?: string;
};

export type UVListView = {
  uid: number;
  item: UVListItem;
};

export class UvList extends HTMLElement {
  items: any[];
  initialSize: number;
  buffer: number;
  renderItem: (
    item: any,
    index: number,
    selected: boolean,
    opened: boolean,
  ) => string | HTMLElement | TemplateResult<1>;
  selectedId: string | number;
  before: () => string | HTMLElement | TemplateResult<1>;
  after: () => string | HTMLElement | TemplateResult<1>;
  keyboardEnabled: boolean;
  keyboardThrottle: number;
  vimNavigation: boolean;
  updateVisibleItems: () => void;
}

export class UvTree extends HTMLElement {
  items: any[];
  initialSize: number;
  buffer: number;
  renderItem: (
    item: any,
    index: number,
    selected: boolean,
    opened: boolean,
  ) => string | HTMLElement | TemplateResult<1>;
  selectedId: string | number;
  before: () => string | HTMLElement | TemplateResult<1>;
  after: () => string | HTMLElement | TemplateResult<1>;
  keyboardEnabled: boolean;
  keyboardThrottle: number;
  vimNavigation: boolean;
  searchParams: any;
  searchQuery: string;
  skipPrepare: boolean;
  trackShift: number;
  showDepth: number;
  openPadding: number;
  updateVisibleItems: () => void;
}
