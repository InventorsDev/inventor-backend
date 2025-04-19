import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { PostComment } from 'src/shared/schema';
import { PostCommentDocument } from 'src/shared/schema/postcomment.schema';
import { PostCommentDto } from './dto/postComment.dto';
import { ApiReq } from 'src/shared/interfaces/req.type';
import { getPagingParams, getPaginated } from 'src/shared/utils';
import { UpdatePostCommentDto } from './dto/updatePostComment.dto';
import { Status } from 'src/shared/interfaces/post.type';

@Injectable()
export class PostCommentService {
  constructor(
    @Inject(PostComment.name)
    private readonly PostCommentModel: Model<PostCommentDocument>,
  ) {}

  async createPostComment(payload: PostCommentDto): Promise<PostComment> {
       return this.PostCommentModel.create({
         title: payload.title,
         shortDesc: payload.shortDesc,
         description: payload.description,
         photo: payload.photo,
         PostCommentDate: payload.PostCommentDate,
       });
  }

  async findAll(req: ApiReq) {
    const { page, currentLimit, skip, order, dbQuery } = getPagingParams(req);
    const [records, count] = await Promise.all([
      this.PostCommentModel
        .find(dbQuery, {}, { lean: true })
        .sort({ createdAt: order })
        .skip(skip)
        .limit(currentLimit),
      this.PostCommentModel.countDocuments(dbQuery),
    ]);
    return getPaginated<PostCommentDocument>(
      { page, count, limit: currentLimit },
      records,
    );
  }

  async findById(id: string): Promise<PostCommentDocument> {
    const PostComment = await this.PostCommentModel.findById(id).lean().exec();
    if (!PostComment) {
      throw new NotFoundException(`comment with ID ${id} not found`);
    }
    return PostComment;
  }

  async updatePostComment(
    id: string,
    updatePostCommentDto: UpdatePostCommentDto,
  ): Promise<PostCommentDocument> {
    const updatedPostComment = await this.PostCommentModel
      .findByIdAndUpdate(id, updatePostCommentDto, { new: true, lean: true })
      .exec();
      
    if (!updatedPostComment) {
      throw new NotFoundException(`PostComment with ID ${id} not found`);
    }
    return updatedPostComment;
  }

  async softDeletePostcomment(id: string): Promise<PostComment> {
    let deletePostcomment = this.PostCommentModel.findByIdAndUpdate(
      id,
      { status: Status.DELETED },
      { new: true },
    );
    if (!deletePostcomment) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
    return deletePostcomment;
  }

  async approvePostcomment(id: string): Promise<PostComment> {
    let approvePostcomment = this.PostCommentModel.findByIdAndUpdate(
      id,
      { status: Status.APPROVED },
      { new: true },
    );
    if (!approvePostcomment) {
      throw new NotFoundException(`Postcomment with ID ${id} not found`);
    }

    return approvePostcomment; 
  }
}
