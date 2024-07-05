import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '../../interfaces';

@Injectable()
export class JwtEventUserGuard extends AuthGuard('jwt-user') {
  constructor() {
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

      if (!this.hasRequiredRoles(userRoles, [UserRole.USER, UserRole.EVENT_USER])) {
        throw new UnauthorizedException('Invalid user roles, user must have event role');
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

  private hasRequiredRoles(userRoles: UserRole[], requiredRoles: UserRole[]): boolean {
    // checks if events user or admin user can access
    return requiredRoles.every(role => userRoles.includes(role)) || userRoles.includes(UserRole.ADMIN);
  }
}
