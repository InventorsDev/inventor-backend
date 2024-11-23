import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { TestModule } from 'src/shared/testkits';

describe('postController', () => {
  let controller: PostController
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [TestModule],
      controllers: [PostController],
      providers: [PostService],
    }).compile();

    controller = module.get<PostController>(PostController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe ('createPost')
  describe('createPost', () => {
    it('should call PostService.createPost and return the result', async () => {
      const payload: PostDto = { title: 'Test Post', content: 'Test Content' };
      const result = { id: '1', ...payload };
      mockPostService.createPost.mockResolvedValue(result);

  describe('updatePost', () => {
        it('should call PostService.updatePost and return the updated post', async () => {
          const id = '1';
          const updatePostDto: UpdatePostDto = { title: 'Updated Title' };
          const updatedPost = { id, ...updatePostDto };
          mockPostService.updatePost.mockResolvedValue(updatedPost);

   describe('deletePost', () => {
            it('should call PostService.softDeletePost and return success', async () => {
              const id = '1';
              const result = { message: 'Post deleted successfully' };
              mockPostService.softDeletePost.mockResolvedValue(result);
});
