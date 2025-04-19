import { Test, TestingModule } from '@nestjs/testing';
import { PostCommentController } from './postcomment.controller';
import { PostCommentService } from './postcomment.service';
import { PostCommentDto } from './dto/postcomment.dto';
import { UpdatePostCommentDto } from './dto/updatepostcomment.dto';

const mockPostComment = {
  id: '1',
  title: 'Test Postcomment',
  shortDesc: 'Test Short Desc',
  description: 'Test Description',
  photo: 'test.jpg',
  postCommentDate: new Date(),
};

const mockPostCommentService = {
  createPostComment: jest.fn().mockResolvedValue(mockPostComment),
  findAll: jest.fn().mockResolvedValue([mockPostComment]),
  findById: jest.fn().mockResolvedValue(mockPostComment),
  updatePost: jest.fn().mockResolvedValue(mockPostComment),
  softDeletePost: jest.fn().mockResolvedValue(mockPostComment),
};

describe('PostCommentController', () => {
  let controller: PostCommentController;
  let service: PostCommentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostCommentController],
      providers: [{ provide: PostCommentService, useValue: mockPostCommentService }],
    }).compile();

    controller = module.get<PostCommentController>(PostCommentController);
    service = module.get<PostCommentService>(PostCommentService);
  });

  describe('createPostComment', () => {
    it('should create a new postcomment', async () => {
      const dto: PostCommentDto = {
        title: 'New PostComment',
        shortDesc: 'Short desc',
        description: 'Description',
        photo: 'photo.jpg',
        PostCommentDate: new Date(),
      };
      const result = await controller.createPostComment(dto);
      expect(service.createPostComment).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockPostComment);
    });
  });

  describe('getAllPost', () => {
    it('should return all postcomments', async () => {
      const req = { query: {} } as any;
      const result = await controller.getAllPostComment(req);
      expect(service.findAll).toHaveBeenCalledWith(req);
      expect(result).toEqual([mockPostComment]);
    });
  });

  describe('getPostCommentById', () => {
    it('should return a post by ID', async () => {
      const result = await controller.getPostCommentById('1');
      expect(service.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockPostComment);
    });
  });
  describe('updatePostComment', () => {
    it('should update a postcomment', async () => {
      const dto: UpdatePostCommentDto = { title: 'Updated Title' };
      const result = await controller.updatePostComment('1', dto);
      expect(service.updatePostComment).toHaveBeenCalledWith('1', dto);
      expect(result).toEqual(mockPostComment);
    });
  });
  describe('deletePostcomment', () => {
    it('should delete a postcomment', async () => {
      const result = await controller.deletePostcomment('1');
      expect(service.softDeletePostcomment).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockPostComment);
    });
  });
});