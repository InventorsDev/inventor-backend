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
import { PostCommentService } from './postcomment.service';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtPostCommentUserGuard } from 'src/shared/auth/guards/jwt.postcomment.guard';
import { ApiReq } from 'src/shared/interfaces';
import { PostCommentDto } from './dto/postComment.dto';
import { UpdatePostCommentDto } from './dto/updatePostComment.dto';
import { JwtUsersGuard } from 'src/shared/auth/guards/jwt.users.guard';

@ApiTags('blog')
@Controller('postcomment')
export class PostCommentController {
  constructor(private readonly PostCommentService: PostCommentService) {}

  @ApiBearerAuth()
  @UseGuards(JwtPostCommentUserGuard)
  @Post()
  async createPostComment(@Body() payload: PostCommentDto) {
    return this.PostCommentService.createPostComment(payload);
  }

  @ApiBearerAuth()
  @Get()
  async getAllPostComment(@Req() req: ApiReq) {
   
    return this.PostCommentService.findAll(req);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: 'string' })
  async getPostCommentById(@Param('id') id: string) {
    return this.PostCommentService.findById(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtPostCommentUserGuard)
  @Patch(':id')
  @ApiParam({ name: 'id', type: 'string' })
  async updateComment(
    @Param('id') id: string,
    @Body() updatePostCommentDto: UpdatePostCommentDto,
  ) {
    return this.PostCommentService.updatePostComment(id, updatePostCommentDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtPostCommentUserGuard)
  @Delete(':id')
  @ApiParam({ name: 'id', type: 'string' })
  async deletePostComment(@Param('id') id: string) {
    return this.PostCommentService.softDeletePostComment(id);
  }
}
