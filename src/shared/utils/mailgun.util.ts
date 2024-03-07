import FormData from 'form-data';
import { configs } from '../configs';
import Mailgun from 'mailgun.js';
import { LogLevel, EmailParams } from '../interfaces';

export const getMailTemplate = () => configs().mailgun.templates;

export const getTemplateKey = (templateValue) => {
  const templates = getMailTemplate();
  return Object.entries(templates).filter(
    ([key, value]) => value === templateValue,
  )?.[0]?.[0];
};

export const sendMail = ({
  to,
  from,
  subject,
  template,
  templateVariables,
}: EmailParams) => {
  setImmediate(async () => {
    try {
      const { mailgun: mailConfig } = configs();
      const mailClient = new Mailgun(FormData).client({
        username: 'api',
        key: mailConfig.apiKey,
      });

      const data = {
        from:
          mailConfig.defaultEmailFrom[from.toString().toLowerCase()] || from,
        to: !['production', 'stage', 'development'].includes(
          process.env.NODE_ENV.trim().toLowerCase(),
        )
          ? mailConfig.defaultEmailReceiver
          : to,
        'h:Reply-To': mailConfig.defaultEmailFrom.support,
        subject,
        template,
        't:variables': JSON.stringify(templateVariables),
      };

      const res = await mailClient.messages.create(mailConfig.domain, data);

      global.dataLogsService.log(
        'MailGunSendMail',
        {
          source: 'MailGunSendMail',
          to,
          from,
          subject,
          template,
          templateVariables,
          ...(typeof res === 'object' ? res : { data: res }),
        },
        LogLevel.INFO,
      );

      // Send chat messaging and push notification
      // await TalkJs.notification[getTemplateKey(template)]?.(templateVariables);

      return true;
    } catch (e) {
      console.log(e);
      global.dataLogsService.log(
        'MailGunSendMail',
        {
          source: 'MailGunSendMail',
          to,
          from,
          subject,
          template,
          templateVariables,
          stack: e.status,
          message: e.message,
        },
        LogLevel.ERROR,
      );
      return false;
    }
  });
};
