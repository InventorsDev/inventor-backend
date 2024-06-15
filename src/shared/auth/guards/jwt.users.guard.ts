import {
  Injectable,
  ExecutionContext,
  CanActivate,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../../interfaces';

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
      throw new UnauthorizedException();
    }
    try {
      const payload = await global.jwtService.verify(token);
      if (payload?.role != UserRole.USER) throw new Error('Invalid user role');
      request['user'] = payload;
    } catch (error) {
      throw new UnauthorizedException();
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
