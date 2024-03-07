import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { User } from '../../schema/user.schema';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalUsersStrategy extends PassportStrategy(
  Strategy,
  'local-user',
) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, pass: string): Promise<User> {
    const user = await this.authService.validateUser(email, pass);
    if (!user) {
      throw new UnauthorizedException('Username/Password is incorrect.');
    }

    if (!user.emailVerification) {
      throw new BadRequestException('Verify your account. Check you inbox');
    }
    return user;
  }
}
