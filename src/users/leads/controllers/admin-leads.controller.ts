import { Controller, Logger } from '@nestjs/common';
import { LeadsService } from '../leads.service';
import { ApiTags } from '@nestjs/swagger';


@Controller('admin')
export class AdminLeadsController {
  private readonly logger = new Logger(AdminLeadsController.name)
  constructor(private readonly leadsService: LeadsService) { }
}
