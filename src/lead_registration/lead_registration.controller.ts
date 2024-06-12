import { UseGuards, Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAdminsGuard } from 'src/shared/auth/guards/jwt.admins.guard';
import { LeadRegistrationService } from './lead_registration.service';
import { TempLeadRegistration } from 'src/shared/schema';
@Controller('lead-registration')
export class LeadRegistrationController {
  constructor(private readonly registrationService: LeadRegistrationService) {}

  // lis tall applications
  @ApiBearerAuth()
  @ApiTags('admins')
  @UseGuards(JwtAdminsGuard)
  @ApiOperation({ summary: 'view all submitted applications' })
  @Get()
  async viewApplications(): Promise<TempLeadRegistration[]> {
    return await this.registrationService.viewApplications();
  }
}
