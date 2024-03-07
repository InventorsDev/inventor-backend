import jwt from 'jsonwebtoken';
import * as JwksRsa from 'jwks-rsa';

interface AppleJwtPayload {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  email?: string;
}

export class AppleAuthUtil {
  private static jwksClientInstance = new JwksRsa.JwksClient({
    jwksUri: 'https://appleid.apple.com/auth/keys',
  });

  static async verifyAppleToken(identityToken: string): Promise<any> {
    const header = (jwt.decode(identityToken, { complete: true }) as any)
      ?.header;
    if (!header || typeof header.kid !== 'string') {
      throw new Error('Invalid Apple identity token');
    }

    const jwksKey = await this.getJWK(header.kid);
    const applePublicKey = jwksKey.publicKey || jwksKey.rsaPublicKey;
    return jwt.verify(identityToken, applePublicKey, {
      algorithms: ['RS256'],
    }) as AppleJwtPayload;
  }

  private static async getJWK(kid: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.jwksClientInstance.getSigningKey(kid, (err, key) => {
        if (err) {
          reject(err);
        } else {
          resolve(key);
        }
      });
    });
  }
}
