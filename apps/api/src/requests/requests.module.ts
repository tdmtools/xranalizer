import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RequestLog, RequestLogSchema } from './schemas/request.schema';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RequestLog.name, schema: RequestLogSchema },
    ]),
  ],
  controllers: [RequestsController],
  providers: [RequestsService],
  exports: [RequestsService, MongooseModule],
})
export class RequestsModule {}
