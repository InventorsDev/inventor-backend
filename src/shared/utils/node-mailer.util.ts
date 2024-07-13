// import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import { configs } from '../configs';
import { join } from 'path';
import { readFileSync } from 'fs';

export const nodeMailerTemplate = () => configs().node_mailer.templates;
class NodeMailer {
  private transporter: nodemailer.Transporter;

  constructor() {
    const nodeMailer = configs().node_mailer;
    this.transporter = nodemailer.createTransport({
      host: nodeMailer.host,
      port: nodeMailer.port,
      secure: nodeMailer.port === 456, //set to false
      auth: {
        user: nodeMailer.auth.user,
        pass: nodeMailer.auth.pass,
      },
    });
  }

  private laodTemplate(templateName: string, variables: any): string {
    const templatePath = join(
      __dirname,
      'mail-templates',
      `${templateName}.hbs`,
    );
    const templateSource = readFileSync(templatePath, 'utf8');
    const compiledTemplate = handlebars.compile(templateSource);
    return compiledTemplate(variables);
  }

  async sendMail(options: {
    to: string;
    from: string;
    subject: string;
    template: string;
    templateVariables: any;
  }) {
    const html = this.laodTemplate(options.template, options.templateVariables);
    const mailOptions = {
      from: options.from,
      to: options.to,
      subject: options.subject,
      html: html,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent: ' + info.response);
    } catch (error) {
      console.error('Error sending email: ' + error.message);
    }
  }
}

export { NodeMailer };
