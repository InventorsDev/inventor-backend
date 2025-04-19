import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { TestModule } from 'src/shared/testkits';
import { PostDto } from './dto/post.dto';
import { UpdatePostDto } from './dto/updatepost.dto';

// Mocking PostService
const mockPostService = {
  createPost: jest.fn(),
  updatePost: jest.fn(),
  softDeletePost: jest.fn(),
};

describe('PostController', () => {
  let controller: PostController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TestModule],
      controllers: [PostController],
      providers: [{ provide: PostService, useValue: mockPostService }],
    }).compile();

    controller = module.get<PostController>(PostController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createPost', () => {
    it('should call PostService.createPost and return the result', async () => {
      const payload: PostDto = { title: 'Test Post', description: 'Test Description', shortDesc: 'Short', photo: 'img.jpg', postDate: new Date() };
      const result = { id: '1', ...payload };
      mockPostService.createPost.mockResolvedValue(result);

      const response = await controller.createPost(payload);
      expect(mockPostService.createPost).toHaveBeenCalledWith(payload);
      expect(response).toEqual(result);
    });
  });

  describe('updatePost', () => {
    it('should call PostService.updatePost and return the updated post', async () => {
      const id = '1';
      const updatePostDto: UpdatePostDto = { title: 'Updated Title' };
      const updatedPost = { id, ...updatePostDto };
      mockPostService.updatePost.mockResolvedValue(updatedPost);

      const response = await controller.updatePost(id, updatePostDto);
      expect(mockPostService.updatePost).toHaveBeenCalledWith(id, updatePostDto);
      expect(response).toEqual(updatedPost);
    });
  });

  describe('deletePost', () => {
    it('should call PostService.softDeletePost and return success', async () => {
      const id = '1';
      const result = { message: 'Post deleted successfully' };
      mockPostService.softDeletePost.mockResolvedValue(result);

      const response = await controller.deletePost(id);
      expect(mockPostService.softDeletePost).toHaveBeenCalledWith(id);
      expect(response).toEqual(result);
    });
  });
});
