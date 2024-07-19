// enviroment variables were not getting loaded here. The below import fixes that
import * as dotenv from 'dotenv';
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
  mailgun: {
    apiKey: process.env.MAIL_GUN_API_KEY,
    domain: process.env.MAIL_GUN_DOMAIN,
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
      generalSignUp: 'inventors-welcome',
      generalAccountDeletion: 'inventors-account-deletion',
      generalPasswordChange: 'inventors-password-change',
      generalLogin: 'inventors-signin-notification',
      generalEmailVerification: 'inventors-email-verification',
      userBirthdayNotification: 'inventors-birthday-notification',
      generalLeadRegistration: 'inventors-lead-invite',
    },
  },
  // create transponder object for nodeMailer
  // unorthodox name because of confusion in mailing service
  node_mailer: {
    host: process.env.SMTP_HOST, //email provider ie gmail
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    defaultEmailReciver: 'dev@inventors.com',
    defaultEmailTO: {
      support: 'support@.com',
      engineering: 'engineering@inventors.com',
      marketing: 'marketing@inventors.com',
    },
    defaultEmailFrom: {
      hello: 'hello@inventors.com',
      support: 'Joshua from inventors <support@inventors.com>',
      engineering: 'Joshua from inventors <engineering@inventors.com>',
      marketing: 'Joshua from inventors <marketing@inventors.com>',
      financeeee: 'Joshua from inventors <finance@inventors.com>',
    },
    templates: {
      generalSignUp: 'inventors-welcome',
      generalAccountDeletion: 'inventors-account-deletion',
      generalPasswordChange: 'inventors-password-change',
      generalLogin: 'inventors-signin-notification',
      generalEmailVerification: 'inventors-email-verification',
      userBirthdayNotification: 'inventors-birthday-notification',
      generalLeadRegistration: 'inventors-lead-invite',
      leadApplicationStauts: 'lead-application-status',
    },
  },
});
