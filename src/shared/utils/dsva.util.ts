import { BadRequestException } from '@nestjs/common';
import axios from 'axios';

import { LogLevel } from '../interfaces';
import { configs } from '../configs';

export const sendDsvaReport = async (payload) => {
  try {
    const { apiBaseUrl, apiKey } = configs().dsva;
    const { data } = await axios.post(
      `${apiBaseUrl}/report`,
      formatRequestData(payload),
      {
        headers: {
          'X-Api-Key': apiKey,
        },
      },
    );

    return data;
  } catch (error) {
    const message = error?.response?.data?.message || error?.message;
    const source = 'DSVAUtil - sendReport';
    global.dataLogsService.log(
      source,
      {
        source,
        payload,
        message,
        errResp: error?.response?.data,
        stack: error?.stack,
      },
      LogLevel.ERROR,
    );
    throw new BadRequestException(message);
  }
};

const formatRequestData = (payload) => ({
  ...payload,
  reporterType: payload?.reporterType?.toLowerCase(),
  gender: payload?.gender?.toLowerCase(),
  preferredLanguage: payload?.preferredLanguage?.toLowerCase(),
  maritalStatus: payload?.maritalStatus?.toLowerCase(),
  marriageType: payload?.marriageType?.toLowerCase(),
  employmentStatus: payload?.employmentStatus?.toLowerCase(),
});
