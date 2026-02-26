import { Item } from "../item.schema";

export type PaginatedItems = {
  data: Item[];
  meta: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
};
