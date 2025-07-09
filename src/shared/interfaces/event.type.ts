export enum Location {
  PHYSICAL = 'PHYSICAL',
  ONLINE = 'ONLINE',
}

export enum JoinMethod {
  MEET = 'MEET',
  TWITTER = 'TWITTER',
}

export enum Status {
  APPROVED = 'APPROVED',
  PENDING = 'PENDING',
  DELETED = 'DELETED',
  ACTIVE = 'ACTIVE',
}

export type SocialsLinks = {
  linkedIn: string;
  twitter: string;
  facebook: string;
};

export const SocialsLinksRawSchema = {
  linkedIn: { type: String },
  twitter: { type: String },
  facebook: { type: String },
};

export const userRoles = Object.values(Location);
