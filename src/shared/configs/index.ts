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
      generalAccountDeletion: 'account-deletion',
      generalPasswordChange: 'password-change',
      generalLogin: 'signin-notification',
      generalEmailVerification: 'email-verification',
      userBirthdayNotification: 'user-birthday-notification',
    },
  },
});
