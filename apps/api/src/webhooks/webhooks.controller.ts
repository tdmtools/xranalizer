import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooks: WebhooksService) {}

  @Post()
  create(@Body() dto: CreateWebhookDto) {
    return this.webhooks.create(dto);
  }

  @Get()
  findAll(@Query('companyId') companyId?: string) {
    return this.webhooks.findAll(companyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.webhooks.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateWebhookDto) {
    return this.webhooks.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.webhooks.remove(id);
  }
}
