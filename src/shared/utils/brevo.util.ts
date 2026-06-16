import { Logger } from '@nestjs/common';
import { BrevoClient } from '@getbrevo/brevo';
import * as handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join } from 'path';
import { configs } from '../configs';
import { LogLevel } from '../interfaces';

const logger = new Logger('BrevoMail');
const brevo = configs().brevo;

export const getMailTemplate = () => configs().brevo.templates;

const client = new BrevoClient({ apiKey: brevo.apiKey });

function loadTemplate(templateName: string, variables: any): string {
  const templatePath = join(
    process.cwd(),
    'src',
    'shared',
    'utils',
    'mail-templates',
    `${templateName}.hbs`,
  );
  const templateSource = readFileSync(templatePath, 'utf8');
  const compiledTemplate = handlebars.compile(templateSource);
  return compiledTemplate(variables);
}

// resolve an EmailFromType key to a Brevo sender object.
// accepts plain "addr@x.com" or formatted "Name <addr@x.com>".
function resolveSender(from: string): { name: string; email: string } {
  const configured =
    brevo.defaultEmailFrom[from?.toString().toLowerCase()] ||
    brevo.defaultEmailFrom.hello;
  const match = /^(.*)<(.+)>$/.exec(configured);
  if (match) {
    return {
      name: match[1].trim() || brevo.senderName,
      email: match[2].trim(),
    };
  }
  return { name: brevo.senderName, email: configured };
}

export async function sendMail(options: {
  to: string;
  from: string;
  subject: string;
  template: string;
  templateVariables: any;
}) {
  try {
    const htmlContent = loadTemplate(
      options.template,
      options.templateVariables,
    );

    await client.transactionalEmails.sendTransacEmail({
      sender: resolveSender(options.from),
      to: [{ email: options.to }],
      subject: options.subject,
      htmlContent,
    });

    logger.log(`Email "${options.subject}" sent to ${options.to}`);
    return true;
  } catch (error) {
    logger.error(`Error sending email to ${options.to}: ${error.message}`);
    global.dataLogService?.log(
      'BrevoSendMail',
      {
        source: 'BrevoSendMail',
        to: options.to,
        from: options.from,
        subject: options.subject,
        template: options.template,
        templateVariables: options.templateVariables,
        stack: error.status,
        message: error.message,
      },
      LogLevel.ERROR,
    );
    return false;
  }
}
