import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { DataLog, DataLogDocument } from './schema/data.log.schema';
import {
  getIpAddress,
  getPaginated,
  getPagingParams,
  getUserAgent,
  isMobile,
  redactRecord,
  serialize,
} from '../utils';
import * as dateFns from 'date-fns';
import {
  ApiReq,
  DataLogType,
  LogLevel,
  ReqType,
  UserRole,
} from '../interfaces';

@Injectable()
export class DataLogsService {
  constructor(
    @Inject(DataLog.name)
    private readonly dataLogModel: Model<DataLog>,
  ) {}

  async findAll(req: ApiReq) {
    const { page, currentLimit, skip, dbQuery } = getPagingParams(req);
    const [records, count] = await Promise.all([
      this.dataLogModel
        .aggregate([{ $match: dbQuery }], { allowDiskUse: true })
        .allowDiskUse(true)
        .skip(skip)
        .limit(currentLimit),
      this.dataLogModel.countDocuments(dbQuery),
    ] as any);
    return getPaginated<DataLogDocument>(
      { page, count, limit: currentLimit },
      records,
    );
  }

  async remove(id: string) {
    await this.dataLogModel.deleteOne({ _id: new Types.ObjectId(id) });
    return true;
  }

  async findIpDetails(ipAddress: string, project = {}) {
    return this.dataLogModel.findOne(
      { 'data.ipAddress': ipAddress, 'data.region': { $exists: true } },
      project,
    );
  }

  public errorReqResLog(
    traceId: string,
    req: ApiReq,
    err: any,
    beforeTime: any,
  ) {
    if (err.response) err.response.stack = err?.stack;
    this.reqResLog(traceId, req, err.response, beforeTime, LogLevel.ERROR);
  }

  public successReqResLog(
    traceId: string,
    req: ApiReq,
    res: any,
    beforeTime: any,
  ) {
    this.reqResLog(traceId, req, res, beforeTime, LogLevel.INFO);
  }

  async publicLog(req: ApiReq, source: string) {
    if (
      ![ReqType.WEB, ReqType.MOBILE].includes(<ReqType>source.toUpperCase())
    ) {
      throw new BadRequestException(
        'Please specify MOBILE OR WEB for logSource',
      );
    }
    const data = {
      source: source.toUpperCase(),
      ...(req.query || {}),
      ...(req.body || {}),
      loggedInUser: req.user || {},
      userType: req.user.type,
      logType: DataLogType.PUBLIC_APP,
    };
    return this.log(req.traceId, data, LogLevel.INFO);
  }

  async log(
    traceId: string,
    logData: any,
    level: LogLevel,
    req: ApiReq = {},
    res: any = {},
  ) {
    if (
      Object.keys(req).length > 0 &&
      req.traceId &&
      Object.keys(res).length > 0
    ) {
      if (typeof res?.data === 'object') {
        res.data = Array.isArray(res.data)
          ? res.data.push(logData)
          : { ...res.data, ...logData };
      }
      this.reqResLog(req.traceId, req, res, Date.now(), level);
    } else {
      try {
        await this.dataLogModel.create({
          data: {
            logType: DataLogType.USER,
            response: JSON.stringify(redactRecord(logData)),
            ...redactRecord(logData || {}),
          },
          traceId,
          level,
          logType: logData?.logType || DataLogType.USER,
        });
      } catch (e) {
        console.log('LOGGER FAILURE: ', e.stack);
      }
    }
  }

  async reqResLog(
    traceId: string,
    req: ApiReq,
    response: any,
    beforeTime: any,
    level: string,
  ) {
    const afterTime = Date.now();
    const { query, body, headers, protocol, originalUrl, method } = req;
    if (originalUrl.includes('/v1/countries')) {
      console.log('Skip logging countries!!!');
      return;
    }
    const res = JSON.parse(JSON.stringify(response?.data || response || {}));
    const resData = { ...res, stack: response?.stack };
    const data = {
      traceId,
      beforeTime,
      afterTime,
      level,
      request: JSON.stringify(
        redactRecord({ ...(body || {}), ...(query || {}) }),
      ),
      loggedInUser: JSON.stringify(redactRecord(req?.user || {})),
      method,
      responseTime: afterTime - beforeTime,
      response: JSON.stringify(redactRecord(resData)),
      userAgent: headers['user-agent'] || 'UNKNOWN',
      userAgentDetails: getUserAgent(req),
      ipAddress: getIpAddress(req) || 'UNKNOWN',
      statusCode: response?.statusCode || response?.status || 'UNKNOWN',
      userType: originalUrl?.includes('admins/')
        ? UserRole.ADMIN
        : UserRole.USER,
      requestUrl:
        protocol + '://' + headers.host + originalUrl + serialize(query),
      logType: resData?.logType || DataLogType.SYSTEM,
      source: isMobile(req) ? ReqType.MOBILE : ReqType.WEB,
    };
    try {
      await this.dataLogModel.create({
        data,
        traceId,
        level,
        logType: data.logType,
      });
    } catch (e) {
      console.log('LOGGER FAILURE: ', e.stack);
    }
  }

  public async removeLogsByDaysAgo(days: number = 10) {
    try {
      const daysAgo = dateFns.subDays(new Date(), days);
      await this.dataLogModel.deleteMany(
        { createdAt: { $lte: daysAgo } },
        { batchSize: 500 },
      );
    } catch (e) {
      console.log('LOGGER FAILURE: ', e.stack);
    }
  }
}
