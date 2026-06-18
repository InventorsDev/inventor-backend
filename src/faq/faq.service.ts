import { Inject, Injectable, Logger } from '@nestjs/common';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { Faq, FaqDocument } from 'src/shared/schema';
import { Model } from 'mongoose';

@Injectable()
export class FaqService {
  private readonly logger = new Logger(FaqService.name);
  constructor(
    @Inject(Faq.name)
    private readonly faqModel: Model<FaqDocument>,
  ) {}
  async create(createFaqDto: CreateFaqDto, userId: string) {
    return await this.faqModel.create({ ...createFaqDto, createdBy: userId });
  }

  async findAll() {
    return this.faqModel.find({});
  }

  async findOne(id: string) {
    return this.faqModel.findById(id);
  }

  async update(id: string, updateFaqDto: UpdateFaqDto) {
    return await this.faqModel
      .findByIdAndUpdate(id, updateFaqDto, { new: true, lean: true })
      .exec();
  }

  async removeFaq(id: string): Promise<boolean> {
    const result = await this.faqModel.deleteOne({ _id: id });
    return result.deletedCount > 0;
  }
}
