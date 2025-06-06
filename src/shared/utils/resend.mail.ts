import { Logger } from "@nestjs/common";
import { Resend } from "resend";
import { configs } from "../configs";
import { EmailParams } from "../interfaces";
import { templateFunctionMap } from "./templates";

const resend = new Resend(configs().resend.apiKey);
const mailTemplates = ()=> configs().resend.templates;

export const getTemplateKey = (templateValue) => {
  const templates = mailTemplates();
  return Object.entries(templates).filter(
    ([key, value]) => value === templateValue,
  )?.[0]?.[0];
};

export const getTemplateFunction = (templateKey: string) => {
  const fn = templateFunctionMap[templateKey];
  if (!fn) throw new Error(`Email template not found for key: ${templateKey}`);
  return fn;
}

export const sendMail = async ({
  to, from, subject, template,templateKey, templateVariables, userId}: EmailParams) => {
    try{
      const {resend: resendConfig} = configs();

      const html = template? template(templateVariables) : getTemplateFunction(templateKey)(templateVariables)

      const response = await resend.emails.send({
        from: resendConfig.defaultEmailFrom[from] || from,
        to,
        subject,
        headers: {
          'X-Entity-Ref-ID': userId || 'user',
        },
        html
      })
      Logger.log('email sent')
      return true;
    }catch(e){
      Logger.error(`Error sending mail: ${e.message}`, e.stack);
      return false;
    }
  };
