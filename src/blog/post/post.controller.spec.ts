import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PostService } from './post.service';
import { Post } from 'src/shared/schema';
import { PostDocument } from 'src/shared/schema/post.schema';
import { NotFoundException } from '@nestjs/common';
import { PostController } from './post.controller';
import { Model } from 'mongoose';
import { TestModule } from 'src/shared/testkits';
import { PostDto } from './dto/post.dto';
import { UpdatePostDto } from './dto/updatepost.dto';
import { Status } from 'src/shared/interfaces/post.type';

describe('PostService', () => {
  let service: PostService;
  let model: Model<PostDocument>;

  const mockPostModel = {
    create: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };

  const mockPost = {
    _id: '1',
    title: 'Sample Post',
    shortDesc: 'Short description',
    description: 'Full description',
    photo: 'photo.jpg',
    blogDate: new Date(),
    status: Status.APPROVED,
  };

  beforeEach(async () => {
    const module: TestingModule =  await Test.createTestingModule({
      imports: [TestModule],
      controllers: [PostController],
      providers: [
        PostService,
        {
          provide: getModelToken(Post.name),
          useValue: mockPostModel,
        },
      ],
    }).compile();

    service = module.get<PostService>(PostService);
    model = module.get<Model<PostDocument>>(getModelToken(Post.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPost', () => {
    it('should create a new post', async () => {
      const dto: PostDto = {
        title: 'New Post',
        shortDesc: 'Short desc',
        description: 'Description',
        photo: 'photo.jpg',
        postDate: new Date(),
      };

      mockPostModel.create.mockResolvedValueOnce(mockPost);
      const result = await service.createPost(dto);

      expect(mockPostModel.create).toHaveBeenCalledWith({
        title: dto.title,
        shortDesc: dto.shortDesc,
        description: dto.description,
        photo: dto.photo,
        blogDate: dto.postDate,
      });
      expect(result).toEqual(mockPost);
    });
  });

  // describe('findAll', () => {
  //   it('should return paginated posts', async () => {
  //     const mockPaginatedResponse = { items: [mockPost], totalCount: 1 };
  //     const mockRequest = { query: {} };

  //     jest
  //       .spyOn(require('src/shared/utils'), 'getPagingParams')
  //       .mockReturnValue({
  //         page: 1,
  //         currentLimit: 10,
  //         skip: 0,
  //         order: 1,
  //         dbQuery: {},
  //       });

  //     jest
  //       .spyOn(require('src/shared/utils'), 'getPaginated')
  //       .mockReturnValue(mockPaginatedResponse);

  //     mockPostModel.find.mockReturnValueOnce({
  //       sort: jest.fn().mockReturnThis(),
  //       skip: jest.fn().mockReturnThis(),
  //       limit: jest.fn().mockReturnThis(),
  //       lean: jest.fn().mockReturnThis(),
  //       exec: jest.fn().mockResolvedValueOnce([mockPost]),
  //     });

  //     mockPostModel.countDocuments.mockResolvedValueOnce(1);

  //     const result = await service.findAll(mockRequest);

  //     expect(result).toEqual(mockPaginatedResponse);
  //   });
  // });

  // describe('findById', () => {
  //   it('should return a post by ID', async () => {
  //     mockPostModel.findById.mockReturnValueOnce({
  //       lean: jest.fn().mockReturnThis(),
  //       exec: jest.fn().mockResolvedValueOnce(mockPost),
  //     });

  //     const result =  service.findById('1');

  //     expect(mockPostModel.findById).toHaveBeenCalledWith('1');
  //     expect(result).toEqual(mockPost);
  //   });

  //   it('should throw NotFoundException if post is not found', async () => {
  //     mockPostModel.findById.mockReturnValueOnce({
  //       lean: jest.fn().mockReturnThis(),
  //       exec: jest.fn().mockResolvedValueOnce(null),
  //     });

  //     await expect(service.findById('2')).rejects.toThrow(
  //       NotFoundException,
  //     );
  //   });
  // });

  // describe('updatePost', () => {
  //   it('should update a post', async () => {
  //     const updateDto: UpdatePostDto = { title: 'Updated Title' };

  //     mockPostModel.findByIdAndUpdate.mockReturnValueOnce({
  //       lean: jest.fn().mockReturnThis(),
  //       exec: jest.fn().mockResolvedValueOnce({ ...mockPost, ...updateDto }),
  //     });

  //     const result = service.updatePost('1', updateDto);

  //     expect(mockPostModel.findByIdAndUpdate).toHaveBeenCalledWith(
  //       '1',
  //       updateDto,
  //       { new: true, lean: true },
  //     );
  //     expect(result).toEqual({ ...mockPost, ...updateDto });
  //   });

  //   it('should throw NotFoundException if post is not found', async () => {
  //     mockPostModel.findByIdAndUpdate.mockReturnValueOnce({
  //       lean: jest.fn().mockReturnThis(),
  //       exec: jest.fn().mockResolvedValueOnce(null),
  //     });

  //     await expect(
  //       service.updatePost('2', { title: 'Updated Title' }),
  //     ).rejects.toThrow(NotFoundException);
  //   });
  // });

  // describe('softDeletePost', () => {
  //   it('should soft delete a post', async () => {
  //     mockPostModel.findByIdAndUpdate.mockReturnValueOnce({
  //       exec: jest.fn().mockResolvedValueOnce({
  //         ...mockPost,
  //         status: Status.DELETED,
  //       }),
  //     });

  //     const result =  service.softDeletePost('1');

  //     expect(mockPostModel.findByIdAndUpdate).toHaveBeenCalledWith(
  //       '1',
  //       { status: Status.DELETED },
  //       { new: true },
  //     );
  //     expect(result.status).toEqual(Status.DELETED);
  //   });

  //   it('should throw NotFoundException if post is not found', async () => {
  //     mockPostModel.findByIdAndUpdate.mockReturnValueOnce({
  //       exec: jest.fn().mockResolvedValueOnce(null),
  //     });

  //     await expect(service.softDeletePost('2')).rejects.toThrow(
  //       NotFoundException,
  //     );
  //   });
  // });

  // describe('approvePost', () => {
  //   it('should approve a post', async () => {
  //     mockPostModel.findByIdAndUpdate.mockReturnValueOnce({
  //       exec: jest.fn().mockResolvedValueOnce({
  //         ...mockPost,
  //         status: Status.APPROVED,
  //       }),
  //     });

  //     const result = service.approvePost('1');

  //     expect(mockPostModel.findByIdAndUpdate).toHaveBeenCalledWith(
  //       '1',
  //       { status: Status.APPROVED },
  //       { new: true },
  //     );
  //     expect(result.status).toEqual(Status.APPROVED);
  //   });

  //   it('should throw NotFoundException if post is not found', async () => {
  //     mockPostModel.findByIdAndUpdate.mockReturnValueOnce({
  //       exec: jest.fn().mockResolvedValueOnce(null),
  //     });

  //      await expect(service.approvePost('2')).rejects.toThrow(
  //       NotFoundException,
  //     );
  //   });
  // });
});