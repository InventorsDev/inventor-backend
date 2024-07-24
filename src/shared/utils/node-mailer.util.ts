import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join } from 'path';
import { configs } from '../configs';
import { LogLevel } from '../interfaces';

const nodeMailer = configs().node_mailer;
export const getMailTemplate = () => configs().node_mailer.templates;

const transporter = nodemailer.createTransport({
  host: nodeMailer.host,
  port: nodeMailer.port,
  secure: nodeMailer.port === 465, // mailtrap should be false
  auth: {
    user: nodeMailer.auth.user,
    pass: nodeMailer.auth.pass,
  },
});

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

export async function sendMail(options: {
  to: string;
  from: string;
  subject: string;
  template: string;
  templateVariables: any;
}) {
  const html = loadTemplate(options.template, options.templateVariables);
  const mailOptions = {
    from: nodeMailer.defaultEmailFrom[options.from.toString().toLowerCase()],
    to: options.to,
    subject: options.subject,
    html: html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
  } catch (error) {
    console.error('Error sending email: ' + error.message);
    global.dataLogService.log(
      'NodeMailerSendMail',
      {
        source: 'NodeMailerSendMail',
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
