import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

export async function validateAccessTokenAfterRefreshOrRevoke(
  context: ExecutionContext,
) {
  const ctx = context.switchToHttp();
  const req = ctx.getRequest();
  const bearerToken = req.headers.authorization;
  if (!bearerToken) return true; // No bearer token supplied.
  const accessToken = bearerToken.split(' ')[1];
  // Checking if the token is an old after refresh/revoke had taken place.
  if (accessToken) {
    // const tokenType = isMobile(req) ? ReqType.MOBILE : ReqType.WEB;
    const dUser: any = await global.jwtService.decode(accessToken);
    if (!dUser) {
      throw new UnauthorizedException('Session expired!!!');
    }
  }
}
