import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { hasRequiredRoles } from 'src/shared/utils';
import { UserRole } from '../../interfaces';

@Injectable()
export class JwtUsersGuard
  extends AuthGuard('jwt-user')
  implements CanActivate
{
  constructor() {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('access token not found');
    }

    let payload: any;
    try {
      payload = await global.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('access token is invalid or expired');
    }

    if (!payload?.role) {
      throw new UnauthorizedException('Invalid access token payload');
    }

    if (!hasRequiredRoles(payload.role as UserRole[], [UserRole.USER])) {
      throw new UnauthorizedException(
        'Insufficient role to access this resource',
      );
    }

    request.user = payload;
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers['authorization']?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
