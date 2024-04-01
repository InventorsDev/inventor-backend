import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { getDateRangeQuery, getLocationRangeQuery } from './helper.util';

export const buildQuery = (
  query: any,
  defaultQuery: any = null,
  locationQuery = null,
): any => {
  const filters: Array<any> = [];

  const regexSearches = (searchFields, value) => {
    return searchFields
      .map(({ key, type }) =>
        value.map((s) => {
          const numSearch = parseFloat(s) ? { [key]: +s } : [];
          const strSearch = {
            [key]: {
              $regex: decodeURIComponent(s),
              $options: 'i',
            },
          };
          return type === 'number' ? numSearch : strSearch;
        }),
      )
      .flat(Infinity);
  };

  for (const key in query) {
    let searchFields = [];
    if (!query.hasOwnProperty(key)) continue;

    let value = query[key] || '';

    if (!value) continue;

    value = value
      .split(/[,\s]/g)
      .filter((s: string) => !!s)
      .map((s: string) => s.trim());

    if (!value || !value.length) continue;

    switch (key) {
      /** All Date range use case Queries for all schema models */
      case 'metricDateRange':
      case 'dataLogDateRange':
      case 'userDateRange':
        filters.push({
          $or: getDateRangeQuery(value, ['metricDateRange'].includes(key)),
        });
        break;

      /** All User Queries */
      case 'searchUser':
        searchFields = [
          { key: 'firstName' },
          { key: 'lastName' },
          { key: 'phone' },
          { key: 'email' },
        ];
        filters.push({ $or: regexSearches(searchFields, value) });
        break;
      case 'userByIds':
        filters.push({
          _id: { $in: value.map((v) => new Types.ObjectId(v)) },
        });
        break;
      case 'userByStatuses':
        filters.push({ status: { $in: value } });
        break;
      case 'userByRoles':
        filters.push({ roles: { $in: value } });
        break;
    }
  }

  // Attach default query to filter
  if (defaultQuery) {
    filters.unshift(defaultQuery);
  }

  // No location at this stage of filter query
  const dbQueryNoLocation = filters.length ? { $and: [...filters] } : {};

  // Attach location query to filter
  if (locationQuery) {
    filters.unshift(locationQuery);
  }

  const dbQuery = filters.length ? { $and: filters } : {};

  const metricQueryPush: any = [{ $match: dbQuery }];

  return { dbQuery, dbQueryNoLocation, metricQueryPush };
};
