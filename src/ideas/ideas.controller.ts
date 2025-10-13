import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IdeasService } from './ideas.service';
import {
  CreateIdeaDto,
  UpdateIdeaDto,
  IdeaQueryDto,
  LikeIdeaDto,
} from './dto/idea.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserDocument, UserRole } from '../schemas/user.schema';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { IdeaCategory } from '../schemas/idea.schema';

@Controller('ideas')
export class IdeasController {
  constructor(private readonly ideasService: IdeasService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async create(
    @Body() createIdeaDto: CreateIdeaDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.ideasService.create(createIdeaDto, user._id.toString());
  }

  @Get()
  async findAll(@Query() queryDto: IdeaQueryDto) {
    return this.ideasService.findAll(queryDto);
  }

  @Get('featured')
  async getFeaturedIdeas(@Query('limit') limit?: number) {
    return this.ideasService.getFeaturedIdeas(limit);
  }

  @Get('trending')
  async getTrendingIdeas(@Query('limit') limit?: number) {
    return this.ideasService.getTrendingIdeas(limit);
  }

  @Get('category/:category')
  async getIdeasByCategory(
    @Param('category') category: IdeaCategory,
    @Query('limit') limit?: number,
  ) {
    return this.ideasService.getIdeasByCategory(category, limit);
  }

  @Get('author/:authorId')
  async getIdeasByAuthor(
    @Param('authorId', ParseObjectIdPipe) authorId: string,
    @Query('limit') limit?: number,
  ) {
    return this.ideasService.getIdeasByAuthor(authorId.toString(), limit);
  }

  @Get('tags')
  async getIdeasByTags(
    @Query('tags') tags: string,
    @Query('limit') limit?: number,
  ) {
    const tagArray = tags.split(',').map((tag) => tag.trim());
    return this.ideasService.getIdeasByTags(tagArray, limit);
  }

  @Get('my-ideas')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async getMyIdeas(
    @CurrentUser() user: UserDocument,
    @Query('limit') limit?: number,
  ) {
    return this.ideasService.getIdeasByAuthor(user._id.toString(), limit);
  }

  @Get(':id')
  async findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.ideasService.findOne(id.toString());
  }

  @Get(':id/related')
  async getRelatedIdeas(
    @Param('id', ParseObjectIdPipe) id: string,
    @Query('limit') limit?: number,
  ) {
    return this.ideasService.getRelatedIdeas(id.toString(), limit);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateIdeaDto: UpdateIdeaDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.ideasService.update(
      id.toString(),
      updateIdeaDto,
      user._id.toString(),
    );
  }

  @Patch(':id/like')
  @UseGuards(JwtAuthGuard)
  async likeIdea(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() likeDto: LikeIdeaDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.ideasService.likeIdea(
      id.toString(),
      user._id.toString(),
      likeDto,
    );
  }

  @Post(':id/share')
  async shareIdea(@Param('id', ParseObjectIdPipe) id: string) {
    await this.ideasService.incrementShareCount(id.toString());
    return { message: 'Share count incremented' };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async remove(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: UserDocument,
  ) {
    return this.ideasService.remove(id.toString(), user._id.toString());
  }
}
