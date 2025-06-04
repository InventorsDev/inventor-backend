import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { faker } from '@faker-js/faker';
import { getIpAddress } from '../utils';

@Injectable()
export class LogInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    call$: CallHandler<any>,
  ): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest();
    const res = ctx.getResponse();
    const traceId = faker.string.uuid();
    req.traceId = req.traceId || traceId;
    req.userIpAddress = getIpAddress(req);

    // Add current request/response to global state.***
    // Do not use this aside for data logging usage and this can be false positive
    global.req = req;
    global.res = res;

    function throwErrorOnDeleteAction() {
      const allowedDeletedPaths = (process.env.ALLOW_DELETE_PATHS || '').split(
        ',',
      );
      const url = req.originalUrl;
      const allowDeletedMethod = allowedDeletedPaths.some((path) => {
        const matcher = url.match(new RegExp(path.trim(), 'g'));
        return matcher !== null && matcher?.length;
      });

      if (
        !allowDeletedMethod &&
        process.env.ALLOW_DELETE_METHOD &&
        process.env.ALLOW_DELETE_METHOD !== 'true' &&
        req.method.toUpperCase() === 'DELETE'
      ) {
        throw new BadRequestException('Delete action is not allowed!!!');
      }
    }

    throwErrorOnDeleteAction();

    return call$.handle().pipe(
      tap((res) => {
        global.dataLogsService?.successReqResLog(
          req.traceId,
          req,
          res,
          Date.now(),
        );
      }),
      catchError((err) => {
        global.dataLogsService?.errorReqResLog(
          req.traceId,
          req,
          err,
          Date.now(),
        );
        return throwError(() => err);
      }),
    );
  }
}
