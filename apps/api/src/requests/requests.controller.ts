import { Controller, Delete, Get, Param, Query } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { SearchRequestsDto } from './dto/search-requests.dto';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requests: RequestsService) {}

  @Get()
  search(@Query() dto: SearchRequestsDto) {
    return this.requests.search(dto);
  }

  @Get('stats')
  stats(
    @Query('webhookId') webhookId?: string,
    @Query('companyId') companyId?: string,
  ) {
    return this.requests.stats(webhookId, companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.requests.findOne(id);
  }

  @Delete('webhook/:webhookId')
  clear(@Param('webhookId') webhookId: string) {
    return this.requests.clearForWebhook(webhookId);
  }
}
