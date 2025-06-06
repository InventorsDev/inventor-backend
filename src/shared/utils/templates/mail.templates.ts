const wrapEmail = (content: string) => `
<table width="100%" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; padding: 40px; border-radius: 8px;">
        <tr>
          <td>
            ${content}
          </td>
        </tr>
        <tr>
          <td style="padding-top: 30px; font-size: 12px; color: #999999; text-align: center;">
            © ${new Date().getFullYear()} Inventors. All rights reserved.
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`;

export const welcomeTemplate = ({ name }: { name: string }) =>
  wrapEmail(`
    <h1 style="color:#333;">Welcome, ${name}!</h1>
    <p>Thanks for signing up with Inventors. We're excited to have you onboard.</p>
    <p>Let’s build something great together.</p>
  `);

export const inviteLeadTemplate = ({ name, inviteLink }: { name: string, inviteLink: string }) =>
  wrapEmail(`
    <h2 style="color:#333;">You've been invited, ${name}!</h2>
    <p>Someone thinks you'd be a great fit for Inventors.</p>
    <p><a href="${inviteLink}" style="color:#007BFF;">Click here to accept your invite</a></p>
  `);


export const registrationReceivedTemplate = ({ name }: { name: string }) =>
  wrapEmail(`
      <h2 style="color:#333;">Thanks for registering, ${name}!</h2>
      <p>Your application has been received. Our team will review it and get back to you shortly.</p>
    `);

export const emailVerificationTemplate = ({
  firstName,
  emailVerificationUrl,
  emailVerificationCode,
}: {
  firstName: string;
  emailVerificationUrl: string;
  emailVerificationCode: string;
}) =>
  wrapEmail(`
        <h2 style="color:#333;">Hi ${firstName},</h2>
        <p>Thanks for signing up. Please verify your email to get started:</p>
        <p><a href="${emailVerificationUrl}" style="color:#007BFF;">Verify Email</a></p>
        <p>Your confirmation code is: <strong>${emailVerificationCode}</strong></p>
        <p>If you didn’t request this, you can ignore this email.</p>
      `);


export const resetPasswordTemplate = ({ resetLink }: { resetLink: string }) =>
  wrapEmail(`
    <h2 style="color:#333;">Reset your password</h2>
    <p>We’ve received a request to reset your password.</p>
    <p><a href="${resetLink}" style="color:#007BFF;">Click here to reset it</a></p>
    <p>If this wasn’t you, no worries — just ignore this email.</p>
  `);

export const passwordChangedTemplate = ({ name }: { name: string }) =>
  wrapEmail(`
    <h2 style="color:#333;">Password updated</h2>
    <p>Hi ${name},</p>
    <p>Your password was changed successfully.</p>
    <p>If you didn’t do this, please reset it immediately.</p>
  `);

export const leadRejectedTemplate = ({ name }: { name: string }) =>
  wrapEmail(`
      <h2 style="color:#d9534f;">Application update</h2>
      <p>Hi ${name},</p>
      <p>We reviewed your lead application, and unfortunately it was not approved.</p>
      <p>Thank you for your interest — we’d love to see you apply again in the future.</p>
    `);

export const leadApprovedTemplate = ({ name }: { name: string }) =>
  wrapEmail(`
        <h2 style="color:#28a745;">You're in!</h2>
        <p>Hi ${name},</p>
        <p>Congrats! Your lead application was approved. Welcome aboard — we’re excited to have you.</p>
      `);

export const eventApplicationReceivedTemplate = ({ name, eventName }: { name: string, eventName: string }) =>
  wrapEmail(`
          <h2 style="color:#333;">Application received</h2>
          <p>Hi ${name},</p>
          <p>We received your application for <strong>${eventName}</strong>. Our team will review it and follow up soon.</p>
        `);
export const loginNotificationTemplate = ({ location }: { location: string }) =>
  wrapEmail(`
            <h2 style="color:#333;">New login detected</h2>
            <p>A new login was detected from <strong>${location}</strong>.</p>
            <p>If this was you, great! If not, we recommend changing your password.</p>
          `);

export const leadApplicationReceivedTemplate = ({ name }: { name: string }) =>
  wrapEmail(`
                <h2 style="color:#333;">Application received</h2>
                <p>Hi ${name},</p>
                <p>Thanks for submitting your lead application. We’ll be in touch once it’s reviewed.</p>
              `);
