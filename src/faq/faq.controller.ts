import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { FaqService } from './faq.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { ApiReq } from 'src/shared/interfaces';
import { JwtAdminsGuard } from 'src/shared/auth/guards/jwt.admins.guard';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('faq')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @Post()
  create(@Body() createFaqDto: CreateFaqDto, @Request() req: ApiReq) {
    return this.faqService.create(createFaqDto, req.user._id.toString());
  }

  @Get()
  findAll() {
    return this.faqService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.faqService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFaqDto: UpdateFaqDto) {
    return this.faqService.update(id, updateFaqDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAdminsGuard)
  @Delete(':id')
  deleteFaq(@Param('id') id: string) {
    return this.faqService.removeFaq(id);
  }
}
