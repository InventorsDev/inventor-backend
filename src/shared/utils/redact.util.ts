import { faker } from '@faker-js/faker';

const redactStr = '__REDACTED__';

const redactedRecords = {
  name: faker.company.name(),
  logo: faker.image.imageUrl(),
  description: faker.company.catchPhraseDescriptor(),
  website: faker.internet.url(),
  phone: faker.phone.number(),
  address: faker.address.cityName(),
  postalCode: faker.address.zipCode(),
  socialUsername: faker.internet.userName(),
  firstName: faker.name.firstName(),
  lastName: faker.name.lastName(),
  username: faker.internet.userName(),
  beneficiaryAccountNo: faker.finance.account(10),
  beneficiaryName: faker.finance.accountName(),
  password: '',
  accessToken: '',
};

export const redactRecord = (data) => {
  const redactObj = (obj) => {
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
      obj = obj.map((r) => redactObj(r));
    } else {
      Object.keys(obj).forEach((key) => {
        if (Array.isArray(obj[key])) {
          obj[key] = obj[key].map((r) => redactObj(r));
        }
        if (![null, undefined].includes(redactedRecords[key])) {
          obj[key] = redactedRecords[key] + redactStr;
        }
      });
    }
    return obj;
  };
  try {
    return redactObj(JSON.parse(JSON.stringify(data)));
  } catch (e) {
    return data;
  }
};
