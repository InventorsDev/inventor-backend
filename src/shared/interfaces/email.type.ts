import { configs } from "../configs";

export enum EmailFromType {
  HELLO = 'hello',
  SUPPORT = 'support',
  ENGINEERING = 'engineering',
  MARKETING = 'marketing',
  FINANCE = 'finance',
}

export const emailFromTypes = [...new Set(Object.values(EmailFromType))];

export type EmailParams = {
  userId?: string;
  to: string;
  from: keyof ReturnType<typeof configs>["resend"]["defaultEmailFrom"];
  subject: string;
  template?: (vars: Record<string, any>) => string;
  templateKey?: string;
  templateVariables: Record<string, any>
};
