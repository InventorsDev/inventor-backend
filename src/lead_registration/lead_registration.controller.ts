import {
  UseGuards,
  Controller,
  Get,
  Post,
  Body,
  // Param,
  // Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  // ApiParam,
  // ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAdminsGuard } from 'src/shared/auth/guards/jwt.admins.guard';
import { LeadRegistrationService } from './lead_registration.service';
import { TempLeadRegistration } from 'src/shared/schema';
import { TempLeadnDto } from './dto/temp-lead.dto';
@Controller('lead-registration')
export class LeadRegistrationController {
  constructor(private readonly registrationService: LeadRegistrationService) {}

  // lis tall applications
  @ApiBearerAuth()
  // @ApiTags('admins')
  // @UseGuards(JwtAdminsGuard)
  @ApiOperation({ summary: 'view all submitted applications' })
  @Get()
  async viewApplications(): Promise<TempLeadRegistration[]> {
    return await this.registrationService.viewApplications();
  }

  // user regestring to be a lead
  // @ApiTags('users')
  // @ApiBearerAuth()
  // @UseGuards(JwtAdminsGuard)
  @Post('create')
  @ApiOperation({ summary: 'Register to be a lead' })
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiBody({ type: TempLeadnDto })
  async create(
    @Body() tempLeadDto: TempLeadnDto,
  ): Promise<{ tempRegistrationId: string }> {
    const tempRegistration =
      await this.registrationService.createTempRegistration(tempLeadDto);
    return { tempRegistrationId: tempRegistration._id };
  }
}
