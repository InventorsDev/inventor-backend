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
  brevo: {
    apiKey: process.env.BREVO_API_KEY,
    senderName: process.env.BREVO_SENDER_NAME || 'Inventors',
    // map EmailFromType -> verified Brevo sender address
    defaultEmailFrom: {
      hello: process.env.BREVO_SENDER_EMAIL || 'hello@inventors.com',
      support: 'support@inventors.com',
      engineering: 'engineering@inventors.com',
      marketing: 'marketing@inventors.com',
      finance: 'finance@inventors.com',
    },
    templates: {
      generalSignUp: 'inventors-welcome',
      generalAccountDeletion: 'inventors-account-deletion',
      generalPasswordChange: 'inventors-password-change',
      generalLogin: 'inventors-signin-notification',
      generalEmailVerification: 'inventors-email-verification',
      userBirthdayNotification: 'inventors-birthday-notification',
      generalLeadRegistration: 'inventors-lead-invite',
      leadApplicationReceived: 'inventors-lead-application',
      leadApplicationStauts: 'lead-application-status',
      userVerificationAcknowledgement: 'user-verification-acknowledgement',
    },
  },
});
