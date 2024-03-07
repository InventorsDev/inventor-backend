import { OAuth2Client } from 'google-auth-library';

interface OAuthUser {
  id: string;
  email: string;
  name: string;
  picture: string;
}

interface GoogleAuthResponse {
  user: OAuthUser;
  idToken: string;
}

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  '',
);

export class GoogleAuthUtil {
  static async verifyGoogleToken(idToken: string): Promise<GoogleAuthResponse> {
    const ticket = await googleClient.verifyIdToken({
      idToken: idToken,
    });

    const payload = ticket.getPayload();
    const user: OAuthUser = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    };

    return {
      user: user,
      idToken: idToken,
    };
  }
}
