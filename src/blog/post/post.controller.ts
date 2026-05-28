import { Query } from '@nestjs/common';
import { Status } from 'src/shared/interfaces/post.type';
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  Param,
  Req,
  Patch,
  Delete,
} from '@nestjs/common';
import { PostService } from './post.service';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtPostUserGuard } from 'src/shared/auth/guards/jwt.post.guard';
import { ApiReq } from 'src/shared/interfaces';
import { PostDto } from './dto/post.dto';
import { UpdatePostDto } from './dto/updatepost.dto';
import { JwtUsersGuard } from 'src/shared/auth/guards/jwt.users.guard';

@ApiTags('blog')
@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @ApiBearerAuth()
  @UseGuards(JwtPostUserGuard)
  @Get('status/list')
  async getPostsByStatus(
  @Query('statuses') statuses: string,
) {
   const statusList = statuses?.split(',') as Status[];
  return this.postService.findByStatuses(statusList);
}
  @Post()
  async createPost(@Body() payload: PostDto) {
    return this.postService.createPost(payload);
  }

  @ApiBearerAuth()
  @Get()
  async getAllPost(@Req() req: ApiReq) {
    return this.postService.findAll(req);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: 'string' })
  async getPostById(@Param('id') id: string) {
    return this.postService.findById(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtPostUserGuard)
  @Patch(':id')
  @ApiParam({ name: 'id', type: 'string' })
  
  async updatePost(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    return this.postService.updatePost(id, updatePostDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtPostUserGuard)
  @Delete(':id')
  @ApiParam({ name: 'id', type: 'string' })
  async deletePost(@Param('id') id: string) {
    return this.postService.softDeletePost(id);
  }
}
