import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import type {
  InviteVerifyTokenResponse,
  LeadInvitationService,
} from '../services/lead-invitation.service';

@Controller('lead-invitations')
export class leadInvitationController {
  constructor(private readonly leadInviteService: LeadInvitationService) {}

  @Get(':token')
  async verifyToken(@Param('token') token: string) {
    const isValid: InviteVerifyTokenResponse =
      await this.leadInviteService.verifyToken(token);
    if (!isValid.valid) throw new BadRequestException('Invalid token');
    else {
      return isValid;
    }
  }

  @Post(':token/accept')
  acceptInvitation(@Param('token') token: string) {
    return this.leadInviteService.acceptInvitation(token);
  }

  @Post(':token/decline')
  declineInvitation(@Param('token') token: string) {
    return this.leadInviteService.declineInvitation(token);
  }
}
