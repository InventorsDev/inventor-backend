import { Controller, Logger } from '@nestjs/common';
import { LeadsService } from '../leads.service';
import { ApiTags } from '@nestjs/swagger';


@Controller()
export class LeadsController {
    private readonly logger = new Logger(LeadsController.name)
    constructor(private readonly leadsService: LeadsService) { }
}