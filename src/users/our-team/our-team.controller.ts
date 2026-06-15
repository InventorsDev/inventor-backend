import {
  Controller,
  Get,
  Logger,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { JwtAdminsGuard } from 'src/shared/auth/guards/jwt.admins.guard';
import { BulkUploadResult, OurTeamService } from './our-team.service';
import { TeamMemberDto } from './dto/team-member.dto';

@ApiTags('our-team')
@Controller('our-team')
export class OurTeamController {
  private readonly logger = new Logger(OurTeamController.name);

  constructor(private readonly ourTeamService: OurTeamService) {}

  @ApiOperation({ summary: 'List all team leads' })
  @Get()
  async getTeam(): Promise<TeamMemberDto[]> {
    return this.ourTeamService.getTeam();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @ApiOperation({
    summary: 'Bulk create/update team leads from a CSV file',
    description:
      'CSV headers: fullName, profilePic, bio, company, role, experience, ' +
      'primarySkill, secondarySkill, technologies, email, phone, portfolio, ' +
      'twitter, linkedIn, facebook, location, areasOfInterest. ' +
      'List columns (technologies, areasOfInterest) are ";"-separated. ' +
      'Existing emails are updated; new emails are invited.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @Post('bulk-upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async bulkUpload(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<BulkUploadResult> {
    this.logger.log('Received team bulk-upload request');
    return this.ourTeamService.bulkUpload(file);
  }
}
