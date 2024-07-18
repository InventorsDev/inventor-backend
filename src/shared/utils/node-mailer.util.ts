// import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import { configs } from '../configs';
import { join } from 'path';
import { readFile } from 'fs';
// import { Injectable } from '@nestjs/common';
import { promisify } from 'util';

export const getMailTemplate = () => configs().node_mailer.templates;

// export const getTemplateKey = (templateValue) => {
//   const templates = getMailTemplate();
//   return Object.entries(templates).filter(
//     ([key, value]) => value === templateValue,
//   )?.[0]?.[0];
// };

const readFileSync = promisify(readFile);

// let transporter: nodemailer.Transporter;
let templateCache: {
  [templateName: string]: handlebars.TemplateDelegate;
};

const nodeMailer = configs().node_mailer;
const transporter = nodemailer.createTransport({
  host: nodeMailer.host,
  port: nodeMailer.port,
  secure: nodeMailer.port === 456, //set to false
  auth: {
    user: nodeMailer.auth.user,
    pass: nodeMailer.auth.pass,
  },
});

async function laodTemplate(
  templateName: string,
): Promise<handlebars.TemplateDelegate> {
  if (!this.templateCache[templateName]) {
    const templatePath = join(
      __dirname,
      '..',
      'mail-templates',
      `${templateName}.hbs`,
    );
    console.log(`folder pathh`, templatePath);
    const templateSource = await readFileSync(templatePath, 'utf8');
    templateCache[templateName] = handlebars.compile(templateSource);
  }
  return templateCache[templateName];
}

export async function sendMail(options: {
  to: string;
  from: string;
  subject: string;
  template: string;
  templateVariables: any;
}) {
  const template = await laodTemplate(options.template);
  const html = template(options.templateVariables);
  const mailOptions = {
    from: options.from,
    to: options.to,
    subject: options.subject,
    html,
  };

  try {
    const info = await this.transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
  } catch (error) {
    console.error('Error sending email: ' + error.message);
    throw error;
  }
}
