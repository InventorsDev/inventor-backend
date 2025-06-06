// enviroment variables were not getting loaded here. The below import fixes that
import * as dotenv from 'dotenv';
import { emailVerificationTemplate, inviteLeadTemplate, leadApprovedTemplate, leadRejectedTemplate, loginNotificationTemplate, noTemplateFound, passwordChangedTemplate, registrationReceivedTemplate, resetPasswordTemplate, welcomeTemplate } from '../utils/templates/mail.templates';
dotenv.config();

export const configs = () => ({
  dbConfig: { autoIndex: false },
  cloudinary: {
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
  },
  redisConfig: {
    socket: {
      tls: ['production', 'stage'].includes(
        process.env.NODE_ENV.toLowerCase().trim(),
      ),
      rejectUnauthorized: false,
      connectTimeout: 300_000,
    },
    url: process.env.REDIS_URL,
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY,
    defaultEmailReceiver: 'dev@inventors.com',
    defaultEmailTo: {
      support: 'support@.com',
      engineering: 'engineering@inventors.com',
      marketing: 'marketing@inventors.com',
    },
    defaultEmailFrom: {
      hello: 'Joshua from inventors <hello@inventors.com>',
      support: 'Joshua from inventors <support@inventors.com>',
      engineering: 'Joshua from inventors <engineering@inventors.com>',
      marketing: 'Joshua from inventors <marketing@inventors.com>',
      finance: 'Joshua from inventors <finance@inventors.com>',
    },
    templates: {
      generalSignUp: welcomeTemplate,
      newLoginNotification: loginNotificationTemplate,
      passwordChangedNotification: passwordChangedTemplate,
      userPasswordReset: resetPasswordTemplate,
      leadInvite: inviteLeadTemplate,
      acknowledgementRecieved: registrationReceivedTemplate,
      leadRejected: leadRejectedTemplate,
      leadApproved: leadApprovedTemplate,
      emailVerification: emailVerificationTemplate,
      noTemplateFound: noTemplateFound,
    },
  },
});
