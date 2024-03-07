import { buildQuery } from './query.util';
import { ApiReq } from '../interfaces';

export interface IFilter {
  page: number;
  count: number;
  limit: number;
}

export interface IPageable<T> {
  nextPage: number | null;
  previousPage: number | null;
  currentPage: number;
  results: Array<T & any>;
  perPageLimit: number;
  totalRecords: number;
  totalPages: number;
}

export interface PageLimit {
  currentLimit: number;
  maxLimit: number;
  defaultLimit: number;
}

export function getPaginated<T>(
  filter: IFilter,
  records: Array<T>,
  removeItems = 0,
): IPageable<T> {
  let { page, count, limit } = filter;
  page = +page;
  removeItems = removeItems || 0;
  const pages = Math.ceil((filter.count - removeItems) / limit) || 1;
  return {
    nextPage: page + 1 <= pages ? page + 1 : null,
    previousPage: page > 1 ? page - 1 : null,
    currentPage: page,
    results: records,
    perPageLimit: limit,
    totalRecords: count - removeItems,
    totalPages: pages,
  };
}

export const getPageLimit = (limit?: number, maxLimit?: number): PageLimit => {
  const MAX_LIMIT = +process.env.PAGINATED_MAX_LIMIT || 100;
  const DEFAULT_LIMIT = +process.env.PAGINATED_DEFAULT_LIMIT || 50;
  const currentMaxLimit = maxLimit || MAX_LIMIT;
  let currentLimit = +limit || DEFAULT_LIMIT;
  currentLimit =
    currentLimit <= currentMaxLimit ? currentLimit : currentMaxLimit;
  return {
    currentLimit,
    maxLimit: MAX_LIMIT,
    defaultLimit: DEFAULT_LIMIT,
  };
};

export const getSortDirection = (direction: string) => {
  const sortDirection: any = { ASC: 1, DESC: -1 };
  return sortDirection[direction] || sortDirection.DESC;
};

export const getPagingParams = (
  req: ApiReq,
  defaultQuery = null,
  locationQuery = null,
) => {
  const { query } = req;
  const { currentLimit } = getPageLimit(+query.limit);
  const page = +query.page || 1;
  const skip: number = (page - 1) * currentLimit;
  const order = getSortDirection(req.query.order as string);
  const { dbQuery, dbQueryNoLocation } = buildQuery(
    req.query,
    defaultQuery,
    locationQuery,
  );
  return { page, currentLimit, skip, order, dbQuery, dbQueryNoLocation };
};
