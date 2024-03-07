export enum LogLevel {
  LOG = 'LOG',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
  ERROR = 'ERROR',
}

export enum DataLogType {
  SYSTEM = 'SYSTEM',
  USER = 'USER',
  PUBLIC_APP = 'PUBLIC_APP',
}

export const logLevels = [...new Set(Object.values(LogLevel))];

export const dataLogTypes = [...new Set(Object.values(DataLogType))];
