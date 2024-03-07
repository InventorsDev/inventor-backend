export enum EmailFromType {
  HELLO = 'HELLO',
  SUPPORT = 'SUPPORT',
  ENGINEERING = 'ENGINEERING',
  MARKETING = 'MARKETING',
  FINANCE = 'FINANCE',
}

export const emailFromTypes = [...new Set(Object.values(EmailFromType))];

export type EmailParams = {
  to: string;
  from: EmailFromType | string;
  subject: string;
  template: string;
  templateVariables: any;
};
