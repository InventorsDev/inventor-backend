import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { Model } from 'mongoose';
import { UserRole, UserStatus } from 'src/shared/interfaces';
import { User, UserDocument } from 'src/shared/schema';
import { UsersService } from '../users.service';
import { TeamMemberDto } from './dto/team-member.dto';

interface TeamCsvRow {
  fullName?: string;
  profilePic?: string;
  bio?: string;
  company?: string;
  role?: string;
  experience?: string;
  primarySkill?: string;
  secondarySkill?: string;
  technologies?: string;
  email?: string;
  phone?: string;
  portfolio?: string;
  twitter?: string;
  linkedIn?: string;
  facebook?: string;
  location?: string;
  areasOfInterest?: string;
}

export interface BulkUploadResult {
  created: string[];
  updated: string[];
  errors: { row: number; email?: string; reason: string }[];
}

@Injectable()
export class OurTeamService {
  private readonly logger = new Logger(OurTeamService.name);

  constructor(
    @Inject(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly usersService: UsersService,
  ) {}

  // GET /our-team -> active team leads mapped to the public profile shape
  async getTeam(): Promise<TeamMemberDto[]> {
    this.logger.log('Fetching team leads');
    const leads = await this.userModel
      .find({ role: UserRole.LEAD, status: UserStatus.ACTIVE })
      .select('-password')
      .lean()
      .exec();

    this.logger.log(`Found ${leads.length} team lead(s)`);
    return leads.map((lead) => this.toTeamMember(lead));
  }

  private toTeamMember(user: User): TeamMemberDto {
    const basic = user.basicInfo ?? ({} as User['basicInfo']);
    const pro = user.professionalInfo ?? ({} as User['professionalInfo']);
    const contact = user.contactInfo ?? ({} as User['contactInfo']);

    const fullName = [basic.firstName, basic.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();
    const location = [basic.city, basic.country?.location]
      .filter(Boolean)
      .join(', ');

    return {
      fullName,
      profilePic: user.photo,
      bio: basic.profileSummary,
      company: pro.company,
      role: user.leadPosition || pro.jobTitle,
      experience: pro.yearsOfExperience,
      primarySkill: pro.primarySkill,
      secondarySkill: pro.secondarySkill,
      technologies: pro.technologies ?? [],
      email: user.email,
      phone: contact.phone,
      socials: {
        portfolio: contact.websiteUrl,
        twitter: contact.twitterUrl,
        linkedIn: contact.linkedInUrl,
        facebook: contact.facebookUrl,
      },
      location: location || undefined,
      areasOfInterest: pro.interestAreas ?? [],
    };
  }

  // POST /our-team/bulk-upload -> upsert leads from a CSV file
  async bulkUpload(file: Express.Multer.File): Promise<BulkUploadResult> {
    if (!file?.buffer?.length) {
      throw new BadRequestException('CSV file is required');
    }

    let rows: TeamCsvRow[];
    try {
      rows = parse(file.buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
      });
    } catch (err) {
      this.logger.error('Failed to parse CSV', err as Error);
      throw new BadRequestException('Invalid CSV file');
    }

    this.logger.log(`Processing ${rows.length} CSV row(s)`);
    const result: BulkUploadResult = { created: [], updated: [], errors: [] };

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2; // +1 header, +1 to 1-index
      const row = rows[i];
      const email = row.email?.trim().toLowerCase();

      if (!email) {
        result.errors.push({ row: rowNum, reason: 'missing email' });
        continue;
      }

      try {
        const existing = await this.userModel
          .findOne({ email })
          .select('_id')
          .lean();

        if (existing) {
          await this.userModel.updateOne(
            { email },
            { $set: this.rowToUpdate(row) },
          );
          result.updated.push(email);
          this.logger.debug(`Updated lead ${email}`);
        } else {
          await this.usersService.inviteLead(email);
          // seed the invited lead with the CSV details
          await this.userModel.updateOne(
            { email },
            { $set: this.rowToUpdate(row) },
          );
          result.created.push(email);
          this.logger.debug(`Invited new lead ${email}`);
        }
      } catch (err) {
        const reason = err instanceof Error ? err.message : 'unknown error';
        this.logger.error(`Row ${rowNum} (${email}) failed: ${reason}`);
        result.errors.push({ row: rowNum, email, reason });
      }
    }

    this.logger.log(
      `Bulk upload done: ${result.created.length} created, ${result.updated.length} updated, ${result.errors.length} errors`,
    );
    return result;
  }

  // map a CSV row to an embedded-profile dot-notation $set payload
  private rowToUpdate(row: TeamCsvRow): Record<string, unknown> {
    const set: Record<string, unknown> = {};
    const assign = (key: string, value: unknown) => {
      if (value !== undefined && value !== '') set[key] = value;
    };
    const list = (value?: string) =>
      value
        ? value
            .split(';')
            .map((v) => v.trim())
            .filter(Boolean)
        : undefined;

    if (row.fullName) {
      const [firstName, ...rest] = row.fullName.trim().split(/\s+/);
      assign('basicInfo.firstName', firstName);
      assign('basicInfo.lastName', rest.join(' '));
    }
    assign('photo', row.profilePic);
    assign('basicInfo.profileSummary', row.bio);
    assign('basicInfo.city', row.location);
    assign('professionalInfo.company', row.company);
    assign('leadPosition', row.role);
    if (row.experience && !Number.isNaN(Number(row.experience))) {
      assign('professionalInfo.yearsOfExperience', Number(row.experience));
    }
    assign('professionalInfo.primarySkill', row.primarySkill);
    assign('professionalInfo.secondarySkill', row.secondarySkill);
    assign('professionalInfo.technologies', list(row.technologies));
    assign('professionalInfo.interestAreas', list(row.areasOfInterest));
    assign('contactInfo.phone', row.phone);
    assign('contactInfo.websiteUrl', row.portfolio);
    assign('contactInfo.twitterUrl', row.twitter);
    assign('contactInfo.linkedInUrl', row.linkedIn);
    assign('contactInfo.facebookUrl', row.facebook);

    return set;
  }
}
