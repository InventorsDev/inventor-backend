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
      case 'incidentDateRange':
      case 'reportDateRange':
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
          { key: 'status' },
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

      /** All Incident Queries */
      case 'activeIncident':
        filters.push({ active: value[0] === '1' || value[0] === 'true' });
        break;
      case 'incidentSearch':
        searchFields = [
          { key: 'description' },
          { key: 'natureOfIncident' },
          { key: 'title' },
        ];
        filters.push({ $or: regexSearches(searchFields, value) });
        break;
      case 'incidentIds':
        filters.push({ _id: { $in: value.map((v) => new Types.ObjectId(v)) } });
        break;
      case 'incidentsByNature':
        filters.push({ natureOfIncident: { $in: value } });
        break;
      case 'incidentUserId':
        filters.push({ user: new Types.ObjectId(value[0]) });
        break;
      case 'incidentByLocationRange':
        if (value.length === 3) {
          filters.push(getLocationRangeQuery(value[0], value[1], value[2]));
        } else {
          throw new BadRequestException(
            'expecting 3 values seperated by comma, got ' + value.length,
          );
        }
        break;

      /** All Report Queries */
      case 'reportSearch':
        searchFields = [
          { key: 'details' },
          { key: 'natureOfReport' },
          { key: 'name' },
          { key: 'email' },
          { key: 'phone' },
        ];
        filters.push({ $or: regexSearches(searchFields, value) });
        break;
      case 'reportsByNature':
        filters.push({ natureOfReport: { $in: value } });
        break;
      case 'reportsByReporterType':
        filters.push({ reporterType: { $in: value } });
        break;
      case 'reportIds':
        filters.push({ _id: { $in: value.map((v) => new Types.ObjectId(v)) } });
        break;
      case 'reportByStatuses':
        filters.push({ status: { $in: value } });
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
