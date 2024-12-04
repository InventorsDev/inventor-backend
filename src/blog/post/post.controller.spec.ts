import { Test, TestingModule } from '@nestjs/testing';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { PostDto } from './dto/post.dto';
import { UpdatePostDto } from './dto/updatepost.dto';

const mockPost = {
  id: '1',
  title: 'Test Post',
  shortDesc: 'Test Short Desc',
  description: 'Test Description',
  photo: 'test.jpg',
  postDate: new Date(),
};

const mockPostService = {
  createPost: jest.fn().mockResolvedValue(mockPost),
  findAll: jest.fn().mockResolvedValue([mockPost]),
  findById: jest.fn().mockResolvedValue(mockPost),
  updatePost: jest.fn().mockResolvedValue(mockPost),
  softDeletePost: jest.fn().mockResolvedValue(mockPost),
};

describe('PostController', () => {
  let controller: PostController;
  let service: PostService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostController],
      providers: [{ provide: PostService, useValue: mockPostService }],
    }).compile();

    controller = module.get<PostController>(PostController);
    service = module.get<PostService>(PostService);
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
      const result = await controller.createPost(dto);
      expect(service.createPost).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockPost);
    });
  });

  describe('getAllPost', () => {
    it('should return all posts', async () => {
      const req = { query: {} } as any;
      const result = await controller.getAllPost(req);
      expect(service.findAll).toHaveBeenCalledWith(req);
      expect(result).toEqual([mockPost]);
    });
  });

  describe('getPostById', () => {
    it('should return a post by ID', async () => {
      const result = await controller.getPostById('1');
      expect(service.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockPost);
    });
  });

  describe('updatePost', () => {
    it('should update a post', async () => {
      const dto: UpdatePostDto = { title: 'Updated Title' };
      const result = await controller.updatePost('1', dto);
      expect(service.updatePost).toHaveBeenCalledWith('1', dto);
      expect(result).toEqual(mockPost);
    });
  });
  describe('deletePost', () => {
    it('should delete a post', async () => {
      const result = await controller.deletePost('1');
      expect(service.softDeletePost).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockPost);
    });
  });
});