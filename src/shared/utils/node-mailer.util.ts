// export const getTemplateKey = (templateValue) => {
//   const templates = getMailTemplate();
//   return Object.entries(templates).filter(
//     ([key, value]) => value === templateValue,
//   )?.[0]?.[0];
// };

// const readFileSync = promisify(readFile);

// // let transporter: nodemailer.Transporter;
// let templateCache: {
//   [templateName: string]: handlebars.TemplateDelegate;
// };

// const nodeMailer = configs().node_mailer;
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join } from 'path';
import { configs } from '../configs';

const nodeMailer = configs().node_mailer;
export const getMailTemplate = () => configs().node_mailer.templates;

const transporter = nodemailer.createTransport({
  host: nodeMailer.host,
  port: nodeMailer.port,
  secure: nodeMailer.port === 465, // true for 465, false for other ports
  auth: {
    user: nodeMailer.auth.user,
    pass: nodeMailer.auth.pass,
  },
});

function loadTemplate(templateName: string, variables: any): string {
  console.log('dir: ', process.cwd());
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
    console.log(transporter);
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
  } catch (error) {
    console.error('Error sending email: ' + error.message);
  }
}
