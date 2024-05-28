export enum Location {
  PHYSICAL = 'PHYSICAL',
  ONLINE = 'ONLINE',
}

export enum JoinMethod {
  MEET = 'MEET',
  TWITTER = 'TWITTER',
}

export type SocialsLinks = {
  linkedIn: string;
  twitter: string;
  facebook: string;
};

export const SocialsLinksRawSchema = {
  linkedIn: { type: String },
  twitter: { type: String },
  facebook: { type: String }
};


export const userRoles = Object.values(Location);
