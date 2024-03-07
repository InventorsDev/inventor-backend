export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  DISABLE = 'DISABLE',
  DELETE = 'DELETE',
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

export const userTypes = Object.values(UserRole);

export const userStatuses = Object.values(UserStatus);
