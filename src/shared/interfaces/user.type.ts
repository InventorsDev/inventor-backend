export enum UserRole {
  ADMIN = 'ADMIN',
  LEAD = 'LEAD',
  WRITER = 'WRITER',
  MODERATOR = 'MODERATOR',
  USER = 'USER',
}

export enum RegistrationMethod {
  SIGN_UP = 'SIGN_UP',
  INVITATION = 'INVITATION',
  REFERRALS = 'REFERRALS',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  DISABLE = 'DISABLE',
  DELETE = 'DELETE',
}

export enum VerificationStatus {
  NOT_VERIFIED = 'NOT_VERIFIED',
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
}

export type Contact = {
  phoneNumber: string;
  email: string;
};

export const ContactRawSchema = {
  phoneNumber: { type: String },
  email: { type: String },
};

export type Socials = {
  phoneNumber: string;
  email: string;
};

export const SocialsRawSchema = {
  phoneNumber: { type: String },
  email: { type: String },
};

export const userRoles = Object.values(UserRole);
export const userStatuses = Object.values(UserStatus);
export const registrationMethods = Object.values(RegistrationMethod);
export const verificationStatuses = Object.values(VerificationStatus);
