import { Controller, Logger } from '@nestjs/common';
import { LeadsService } from '../leads.service';
import { ApiTags } from '@nestjs/swagger';


@Controller('admin/lead-candidates')
export class LeadCandidateController {
    private readonly logger = new Logger(LeadCandidateController.name)
    constructor(private readonly leadsService: LeadsService) { }
}