import {
  Injectable,
  ExecutionContext,
  CanActivate,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../../interfaces';
import { hasRequiredRoles } from 'src/shared/utils';

@Injectable()
export class JwtUsersGuard
  extends AuthGuard('jwt-user')
  implements CanActivate
{
  constructor(private jwtService: JwtService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    try {
      const payload = await global.jwtService.verify(token);
      if (!payload || !payload.role) {
        throw new UnauthorizedException('Invalid token payload');
      }

      const userRoles: UserRole[] = payload.role;

      if (!hasRequiredRoles(userRoles, [UserRole.USER])) {
        throw new UnauthorizedException(
          'Invalid user roles, user must have event role',
        );
      }

      request.user = payload;
    } catch (error) {
      throw new UnauthorizedException('Token validation failed');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers['authorization']?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  // async canActivate(context: ExecutionContext): Promise<boolean> {
  //   await validateAccessTokenAfterRefreshOrRevoke(context);
  //   return (await super.canActivate(context)) as boolean;
  // }
}
