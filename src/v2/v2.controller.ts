import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('v2')
@Controller()
export class V2Controller {
  @ApiOperation({ summary: 'V2 Base Health / Index Check' })
  @Get()
  getIndex(): { message: string; version: string } {
    return {
      message: 'Inventor API v2 base initialized',
      version: '2.0.0',
    };
  }
}
