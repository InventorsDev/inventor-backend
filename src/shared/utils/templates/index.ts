import {
    eventApplicationReceivedTemplate,
    inviteLeadTemplate,
    leadApplicationReceivedTemplate,
    leadApprovedTemplate,
    leadRejectedTemplate,
    loginNotificationTemplate,
    registrationReceivedTemplate,
    resetPasswordTemplate,
    welcomeTemplate,
} from './mail.templates';

export const templateFunctionMap = {
    'inventors-welcome': welcomeTemplate,
    'inventors-password-change': resetPasswordTemplate,
    'inventors-lead-invite': inviteLeadTemplate,
    'inventors-acknowledgement-notification': registrationReceivedTemplate,
    'inventors-signin-notification': loginNotificationTemplate,
    'user-verification-acknowledgement': eventApplicationReceivedTemplate,
    'inventors-lead-rejected': leadRejectedTemplate,
    'inventors-lead-approved': leadApprovedTemplate,
    'inventors-lead-application-received': leadApplicationReceivedTemplate,
};
