import * as bcrypt from 'bcryptjs';
import { LogLevel } from '../interfaces';

export class BcryptUtil {
  static async generateHash(value: string) {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(value, salt);
  }

  static async verify(code: string, hashCode: string) {
    try {
      return bcrypt.compare(code as string, hashCode);
    } catch (e) {
      global.dataLogsService.log(
        global.req?.traceId,
        { message: e.message, stack: e.stack },
        LogLevel.ERROR,
      );
      return false;
    }
  }
}
