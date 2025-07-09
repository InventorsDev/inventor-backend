import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { Post } from 'src/shared/schema';
import { PostDocument } from 'src/shared/schema/post.schema';
import { PostDto } from './dto/post.dto';
import { ApiReq } from 'src/shared/interfaces/req.type';
import { getPagingParams, getPaginated } from 'src/shared/utils';
import { UpdatePostDto } from './dto/updatepost.dto';
import { Status } from 'src/shared/interfaces/post.type';

@Injectable()
export class PostService {
  constructor(
    @Inject(Post.name)
    private readonly postModel: Model<PostDocument>,
  ) {}

  async createPost(payload: PostDto): Promise<Post> {
    return this.postModel.create({
      title: payload.title,
      shortDesc: payload.shortDesc,
      description: payload.description,
      photo: payload.photo,
      postDate: payload.postDate,
    });
  }

  async findAll(req: ApiReq) {
    const { page, currentLimit, skip, order, dbQuery } = getPagingParams(req);
    const [records, count] = await Promise.all([
      this.postModel
        .find(dbQuery, {}, { lean: true })
        .sort({ createdAt: order })
        .skip(skip)
        .limit(currentLimit),
      this.postModel.countDocuments(dbQuery),
    ]);
    return getPaginated<PostDocument>(
      { page, count, limit: currentLimit },
      records,
    );
  }

  async findById(id: string): Promise<PostDocument> {
    const post = await this.postModel.findById(id).lean().exec();
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
    return post;
  }

  async updatePost(
    id: string,
    updatePostDto: UpdatePostDto,
  ): Promise<PostDocument> {
    const updatedPost = await this.postModel
      .findByIdAndUpdate(id, updatePostDto, { new: true, lean: true })
      .exec();

    if (!updatedPost) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
    return updatedPost;
  }

  async softDeletePost(id: string): Promise<Post> {
    let deletePost = this.postModel.findByIdAndUpdate(
      id,
      { status: Status.DELETED },
      { new: true },
    );
    if (!deletePost) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
    return deletePost;
  }

  async approvePost(id: string): Promise<Post> {
    let approvePost = this.postModel
      .findByIdAndUpdate(id, { status: Status.APPROVED }, { new: true })
      .exec();

    if (!approvePost) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
    return approvePost;
  }

  async findByStatuses(statuses: Status[]): Promise<Post[]> {
    return this.postModel
      .find({ status: { $in: statuses } }, {}, { lean: true })
      .sort({ createdAt: -1 })
      .exec();
  }
}
