import { ApiReq, LogLevel } from '../interfaces';
import * as dateFns from 'date-fns';
import { BadRequestException } from '@nestjs/common';
import UAParser from 'ua-parser-js';

const MILES_TO_RADIAN = 0.000142857 as number;

export const getDateRangeQuery = (
  value: string[],
  useOnlyCreatedDate = false,
  twinFields = [],
) => {
  const startDate = dateFns.startOfDay(new Date(value[0]));
  const endDate = dateFns.endOfDay(new Date(value[1]));
  if (
    value.length === 2 &&
    startDate.toISOString().localeCompare(endDate.toISOString()) === -1
  ) {
    const dateQuery = { $gte: startDate, $lte: endDate };
    if (useOnlyCreatedDate) {
      return [{ createdAt: dateQuery }];
    }

    if (twinFields.length === 1) {
      return [{ [twinFields[0]]: dateQuery }];
    }

    if (twinFields.length === 2) {
      return [
        {
          [twinFields[0]]: { $gte: startDate },
          [twinFields[1]]: { $lte: endDate },
        },
      ];
    }

    return [{ createdAt: dateQuery }, { updatedAt: dateQuery }];
  } else {
    throw new BadRequestException(
      'The first date must be lower than the second date.',
    );
  }
};

export const getLocationRangeQuery = (
  longitude: number,
  latitude: number,
  radius: number,
) => {
  return {
    location: {
      $geoWithin: {
        $centerSphere: [[longitude, latitude], radius * MILES_TO_RADIAN],
      },
    },
  };
};

export const firstCapitalize = (value: string): string =>
  value[0].toUpperCase() + value.substring(1).toLowerCase();

export const firstWordCapitalize = (sentence: string): string =>
  sentence
    .split(/[\s_-]/g)
    .filter((a) => !!a)
    .map(firstCapitalize)
    .join(' ');

export const promisifySilent = async (action: Promise<any>) => {
  try {
    return await action;
  } catch (e) {
    global.dataLogsService.log(
      global.req?.traceId,
      { source: 'promisifySilent', message: e.message, stack: e.stack },
      LogLevel.ERROR,
    );
    return null;
  }
};

export const getIpAddress = (req) => {
  return (
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.headers.ipAddress
  );
};

export const serialize = (obj: object) => {
  const keys = Object.keys(obj);
  if (!keys.length) {
    return '';
  }
  return (
    '?' +
    keys
      .reduce((a, k) => {
        if (obj[k] === null || obj[k] === undefined || obj[k] === '') return a;

        a.push(k + '=' + encodeURIComponent(obj[k]));

        return a;
      }, [])
      .join('&')
  );
};

export const slug = (val: string) =>
  val.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');

export const getBaseUrlWithPath = (req, path) => {
  const protocol = req.get('x-scheme') || req.protocol;
  const host = req.get('x-host') || req.get('host');
  return `${protocol}://${host}/${path}`;
};

export const getUserAgent = (req: ApiReq) => {
  const uaParser = new UAParser();
  const uAgent = req.headers['user-agent'] || '';
  return uaParser.setUA(uAgent).getResult();
};

export const isMobile = (req: ApiReq) => {
  const ua = (req.headers['user-agent'] || '').toLowerCase();
  const mobileOs =
    /mobile|ios|android|webos|iphone|ipad|ipod|blackberry|(android|bb\d+|meego).+mobile|avantgo|bada\/|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/gi;
  const uaResult = getUserAgent(req);
  return (
    req.headers['api-key'] === process.env.MOBILE_API_KEY ||
    !!uaResult?.device?.type ||
    mobileOs.test(uaResult?.os?.name) ||
    mobileOs.test(ua) ||
    ua.includes('routewatche')
  );
};

export const formatAmount = (amount, currency = 'NGN') => {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const sleep = (ms: number, data: any = null) =>
  new Promise((resolve) => setTimeout(() => resolve(data), ms));

export const verifyHandle = (handle) => {
  const matcher = handle.toLowerCase().match(/[0-9A-Za-z_.$₦]/g);

  if (matcher === null || matcher?.length !== handle.length) {
    throw new BadRequestException(
      'We only allow alphabets, numbers, underscore, period, ₦, and $',
    );
  }
};

export const passwordMatch = (password: string) => {
  const regex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z\d]).{6,}$/g;
  const isMatcher = password.match(regex);
  if (isMatcher === null)
    throw new BadRequestException(
      'Password must contain a number, special character, alphabet both upper and lower cased, and must be at least of 6 letters.',
    );
  return true;
};

export const validateNumber = (number: string) => {
  if (!number) return true;
  const matcher = number.match(/(([+]){1})?([0-9]){1,14}/g);
  if (!(matcher !== null && matcher[0] === number)) {
    throw new BadRequestException("Phone Number supplied isn't valid.");
  }
  return true;
};

export const validateDob = (dob: string) => {
  if (!dob) return true;
  const diff = dateFns.differenceInYears(new Date(), new Date(dob));
  if (diff < 10) throw new BadRequestException('Minimum DOB allowed is 13.');
  return true;
};

export const chunkRecord = (records = [], limit = 50) => {
  if (records.length < limit) {
    return [records];
  }
  const batches = [];
  const batchSize = Math.ceil(records.length / limit);
  for (let i = 0; i < batchSize; i++) {
    const start = i === 0 ? 0 : i * limit;
    const end = i === 0 ? limit : (i + 1) * limit;
    const list = records.slice(start, end);
    batches.push(list);
    if (list && !list.length) {
      break;
    }
  }
  return batches;
};

export const splitName = (
  name: string,
): { firstName: string; lastName: string } => {
  if (!name) throw new BadRequestException(`Invalid name ${name}`);
  const [firstName, ...lastNameArray] = name.split(' ');
  const lastName = lastNameArray.join(' ') || firstName;
  return { firstName, lastName };
};
