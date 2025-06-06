import { InternalServerErrorException, Logger, ServiceUnavailableException } from "@nestjs/common";
import { Resend } from "resend";
import { configs } from "../configs";
import { EmailParams } from "../interfaces";

const { resend: resendConfig } = configs();
const RESEND = new Resend(resendConfig.apiKey);
export const mailTemplates = resendConfig.templates
const defaultEmailFrom = resendConfig.defaultEmailFrom

export const getTemplate = (templateValue, variables) => {
  const template = Object.entries(mailTemplates).find(([_, value]) => value === templateValue)?.[0];
  return (template ? mailTemplates[template](variables) : mailTemplates["noTemplateFound"])
}

export const sendMail = async ({
  to, from, subject, template, templateVariables, userId }: EmailParams) => {
  try {
    const html = getTemplate(template, templateVariables)

    const uuid = crypto.randomUUID();
    const response = await RESEND.emails.send({
      from: defaultEmailFrom[from] || from,
      to: [to],
      subject,
      html,
      headers: {
        'X-Entity-Ref-ID': uuid,
      },
    })
    if (response.error) {
      throw new ServiceUnavailableException(response.error)
    }
  } catch (e) {
    throw new InternalServerErrorException(e)
  }
  // console.log("template value: ", getTemplate(template, templateVariables))
};
