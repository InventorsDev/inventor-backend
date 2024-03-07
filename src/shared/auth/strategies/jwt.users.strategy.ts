import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';
import { User } from '../../schema/user.schema';
import { UserRole } from '../../interfaces';

@Injectable()
export class JwtUsersStrategy extends PassportStrategy(Strategy, 'jwt-user') {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: User) {
    const userExist = await this.authService.findByUsername(
      payload.email,
      UserRole.USER,
    );
    if (!userExist) {
      throw new UnauthorizedException('Username/Password is incorrect.');
    }

    if (!userExist.emailVerification) {
      throw new BadRequestException('Verify your account. Check you inbox');
    }
    return payload;
  }
}
