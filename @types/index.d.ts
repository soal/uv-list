// export declare module "uv-list" {
//   type UVListItem = {
//     id: string | number;
//     content?: string;
//   };

//   type UVListView = {
//     uid: number;
//     item: UVListItem;
//   };

//   interface IUvList extends HTMLElement {
//     items: any[];
//     updateVisibleItems: () => void;
//   }
// }
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
  updateVisibleItems: () => void;
}
