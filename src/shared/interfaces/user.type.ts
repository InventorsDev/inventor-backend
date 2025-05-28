export enum UserRole {
  ADMIN = 'ADMIN',
  LEAD = 'LEAD',
  WRITER = 'WRITER',
  MODERATOR = 'MODERATOR',
  USER = 'USER',
  EVENT_USER = 'EVENT_USER',
  POST_USER = 'POST_USER'


}

export enum RegistrationMethod {
  SIGN_UP = 'SIGN_UP',
  INVITATION = 'INVITATION',
  REFERRALS = 'REFERRALS',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  DISABLE = 'DISABLE',
  DEACTIVATED = 'DEACTIVATED',
  PENDING = 'PENDING',
}

export enum ApplicationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
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
export const applicatonStatus = Object.values(ApplicationStatus);
