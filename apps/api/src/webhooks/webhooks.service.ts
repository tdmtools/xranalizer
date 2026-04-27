import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import { Webhook, WebhookDocument } from './schemas/webhook.schema';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { Company, CompanyDocument } from '../companies/schemas/company.schema';
import { RequestLog, RequestLogDocument } from '../requests/schemas/request.schema';

@Injectable()
export class WebhooksService {
  constructor(
    @InjectModel(Webhook.name) private readonly webhookModel: Model<WebhookDocument>,
    @InjectModel(Company.name) private readonly companyModel: Model<CompanyDocument>,
    @InjectModel(RequestLog.name) private readonly requestModel: Model<RequestLogDocument>,
  ) {}

  async create(dto: CreateWebhookDto): Promise<WebhookDocument> {
    const company = await this.companyModel.findById(dto.companyId);
    if (!company) throw new NotFoundException('Company not found');

    const exists = await this.webhookModel.exists({
      companyId: company._id,
      path: dto.path,
    });
    if (exists) {
      throw new ConflictException(
        `Webhook path "${dto.path}" already exists for this company`,
      );
    }
    return this.webhookModel.create({ ...dto, companyId: company._id });
  }

  async findAll(companyId?: string): Promise<any[]> {
    const filter: any = {};
    if (companyId) {
      if (!isValidObjectId(companyId)) return [];
      filter.companyId = new Types.ObjectId(companyId);
    }
    const hooks = await this.webhookModel.find(filter).sort({ createdAt: -1 }).lean();
    if (hooks.length === 0) return [];

    const companyIds = [...new Set(hooks.map((h) => String(h.companyId)))];
    const companies = await this.companyModel
      .find({ _id: { $in: companyIds } })
      .select('name slug')
      .lean();
    const cMap = new Map(companies.map((c) => [String(c._id), c]));

    const counts = await this.requestModel.aggregate([
      { $match: { webhookId: { $in: hooks.map((h) => h._id) } } },
      { $group: { _id: '$webhookId', count: { $sum: 1 } } },
    ]);
    const rMap = new Map(counts.map((x) => [String(x._id), x.count]));

    return hooks.map((h) => ({
      ...h,
      company: cMap.get(String(h.companyId)) ?? null,
      requestCount: rMap.get(String(h._id)) ?? 0,
    }));
  }

  async findOne(id: string): Promise<any> {
    if (!isValidObjectId(id)) throw new NotFoundException('Webhook not found');
    const hook = await this.webhookModel.findById(id).lean();
    if (!hook) throw new NotFoundException('Webhook not found');
    const company = await this.companyModel
      .findById(hook.companyId)
      .select('name slug')
      .lean();
    return { ...hook, company };
  }

  async findBySlugAndPath(
    companySlug: string,
    path: string,
  ): Promise<{ webhook: WebhookDocument; company: CompanyDocument } | null> {
    const company = await this.companyModel.findOne({ slug: companySlug });
    if (!company) return null;
    const webhook = await this.webhookModel.findOne({
      companyId: company._id,
      path: path.toLowerCase(),
    });
    if (!webhook) return null;
    return { webhook, company };
  }

  async update(id: string, dto: UpdateWebhookDto): Promise<WebhookDocument> {
    if (!isValidObjectId(id)) throw new NotFoundException('Webhook not found');
    const hook = await this.webhookModel.findById(id);
    if (!hook) throw new NotFoundException('Webhook not found');

    if (dto.path && dto.path !== hook.path) {
      const conflict = await this.webhookModel.findOne({
        companyId: hook.companyId,
        path: dto.path,
        _id: { $ne: hook._id },
      });
      if (conflict) {
        throw new ConflictException(
          `Webhook path "${dto.path}" already exists for this company`,
        );
      }
    }

    Object.assign(hook, dto);
    if (dto.response) {
      hook.response = { ...hook.response, ...dto.response } as any;
    }
    return hook.save();
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    if (!isValidObjectId(id)) throw new NotFoundException('Webhook not found');
    const hook = await this.webhookModel.findById(id);
    if (!hook) throw new NotFoundException('Webhook not found');
    await this.requestModel.deleteMany({ webhookId: hook._id });
    await this.webhookModel.findByIdAndDelete(id);
    return { deleted: true };
  }
}
