import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types, isValidObjectId } from 'mongoose';
import { RequestLog, RequestLogDocument } from './schemas/request.schema';
import { SearchRequestsDto } from './dto/search-requests.dto';

@Injectable()
export class RequestsService {
  constructor(
    @InjectModel(RequestLog.name)
    private readonly requestModel: Model<RequestLogDocument>,
  ) {}

  async create(data: Partial<RequestLog>): Promise<RequestLogDocument> {
    return this.requestModel.create(data);
  }

  buildFilter(dto: SearchRequestsDto): FilterQuery<RequestLogDocument> {
    const filter: FilterQuery<RequestLogDocument> = {};
    if (dto.webhookId && isValidObjectId(dto.webhookId)) {
      filter.webhookId = new Types.ObjectId(dto.webhookId);
    }
    if (dto.companyId && isValidObjectId(dto.companyId)) {
      filter.companyId = new Types.ObjectId(dto.companyId);
    }
    if (dto.methods?.length) filter.method = { $in: dto.methods };
    if (dto.status) filter.responseStatus = dto.status;
    if (dto.ip) filter.ip = { $regex: this.escape(dto.ip), $options: 'i' };
    if (dto.from || dto.to) {
      filter.receivedAt = {};
      if (dto.from) filter.receivedAt.$gte = new Date(dto.from);
      if (dto.to) filter.receivedAt.$lte = new Date(dto.to);
    }
    if (dto.q) {
      const rx = new RegExp(this.escape(dto.q), 'i');
      filter.$or = [
        { url: rx },
        { path: rx },
        { rawBody: rx },
        { userAgent: rx },
        { 'headers.user-agent': rx },
      ];
    }
    return filter;
  }

  async search(dto: SearchRequestsDto) {
    const filter = this.buildFilter(dto);
    const limit = Math.min(dto.limit ?? 50, 200);
    const page = Math.max(dto.page ?? 1, 1);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.requestModel
        .find(filter)
        .sort({ receivedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.requestModel.countDocuments(filter),
    ]);

    return {
      items,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    if (!isValidObjectId(id)) throw new NotFoundException('Request not found');
    const doc = await this.requestModel.findById(id).lean();
    if (!doc) throw new NotFoundException('Request not found');
    return doc;
  }

  async clearForWebhook(webhookId: string) {
    if (!isValidObjectId(webhookId)) {
      throw new NotFoundException('Webhook not found');
    }
    const result = await this.requestModel.deleteMany({
      webhookId: new Types.ObjectId(webhookId),
    });
    return { deleted: result.deletedCount ?? 0 };
  }

  async stats(webhookId?: string, companyId?: string) {
    const match: FilterQuery<RequestLogDocument> = {};
    if (webhookId && isValidObjectId(webhookId)) {
      match.webhookId = new Types.ObjectId(webhookId);
    }
    if (companyId && isValidObjectId(companyId)) {
      match.companyId = new Types.ObjectId(companyId);
    }
    const [total, byMethod, byStatus, last24h] = await Promise.all([
      this.requestModel.countDocuments(match),
      this.requestModel.aggregate([
        { $match: match },
        { $group: { _id: '$method', count: { $sum: 1 } } },
      ]),
      this.requestModel.aggregate([
        { $match: match },
        { $group: { _id: '$responseStatus', count: { $sum: 1 } } },
      ]),
      this.requestModel.countDocuments({
        ...match,
        receivedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }),
    ]);
    return { total, byMethod, byStatus, last24h };
  }

  private escape(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
