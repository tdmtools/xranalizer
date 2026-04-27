import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Company, CompanySchema } from './schemas/company.schema';
import { Webhook, WebhookSchema } from '../webhooks/schemas/webhook.schema';
import { RequestLog, RequestLogSchema } from '../requests/schemas/request.schema';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Company.name, schema: CompanySchema },
      { name: Webhook.name, schema: WebhookSchema },
      { name: RequestLog.name, schema: RequestLogSchema },
    ]),
  ],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService, MongooseModule],
})
export class CompaniesModule {}
