import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, SortOrder } from 'mongoose';
import { Idea, IdeaDocument, IdeaCategory } from '../schemas/idea.schema';
import { User, UserDocument, UserRole } from '../schemas/user.schema';
import {
  CreateIdeaDto,
  UpdateIdeaDto,
  IdeaQueryDto,
  LikeIdeaDto,
} from './dto/idea.dto';

@Injectable()
export class IdeasService {
  constructor(
    @InjectModel(Idea.name) private ideaModel: Model<IdeaDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(
    createIdeaDto: CreateIdeaDto,
    userId: string,
  ): Promise<IdeaDocument> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Only vendors can create ideas
    if (user.role !== UserRole.VENDOR) {
      throw new ForbiddenException('Only vendors can create ideas');
    }

    const idea = new this.ideaModel({
      ...createIdeaDto,
      authorId: new Types.ObjectId(userId),
      authorName:
        createIdeaDto.authorName || `${user.firstName} ${user.lastName}`,
      authorRole: createIdeaDto.authorRole || user.role,
      isPublished: false, // Ideas need admin approval to be published
      publishedAt: undefined,
    });

    return idea.save();
  }

  async findAll(queryDto: IdeaQueryDto): Promise<{
    ideas: IdeaDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      search,
      type,
      category,
      tags,
      sortBy = 'trending',
      sortOrder = 'desc',
      isFeatured,
      page = 1,
      limit = 10,
    } = queryDto;

    const filter: Record<string, any> = { isActive: true, isPublished: true };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    if (type) {
      filter.type = type;
    }

    if (category) {
      filter.category = category;
    }

    if (tags && tags.length > 0) {
      filter.tags = { $in: tags };
    }

    if (isFeatured !== undefined) {
      filter.isFeatured = isFeatured;
    }

    let sort: Record<string, SortOrder> = {};

    switch (sortBy) {
      case 'trending':
        // Trending algorithm: combination of views, likes, and recency
        sort = {
          trendingScore: -1,
          createdAt: -1,
        };
        break;
      case 'latest':
        sort = { createdAt: -1 };
        break;
      case 'popular':
        sort = { viewCount: -1, likeCount: -1 };
        break;
      case 'viewCount':
        sort = { viewCount: -1 };
        break;
      case 'likeCount':
        sort = { likeCount: -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    if (sortOrder === 'asc') {
      Object.keys(sort).forEach((key) => {
        sort[key] = sort[key] === -1 ? 1 : -1;
      });
    }

    const skip = (page - 1) * limit;

    // Calculate trending score for trending sort
    if (sortBy === 'trending') {
      const ideas = await this.ideaModel
        .find(filter)
        .populate('authorId', 'firstName lastName')
        .sort({ createdAt: -1 })
        .exec();

      // Calculate trending score and sort
      const ideasWithScore = ideas.map((idea) => {
        const daysSinceCreation =
          (Date.now() - idea.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        const trendingScore =
          idea.viewCount * 0.3 +
          idea.likeCount * 0.5 +
          idea.shareCount * 0.2 -
          daysSinceCreation * 0.1;
        return { ...idea.toObject(), trendingScore };
      });

      ideasWithScore.sort((a, b) => b.trendingScore - a.trendingScore);

      const total = ideasWithScore.length;
      const paginatedIdeas = ideasWithScore.slice(skip, skip + limit);

      return {
        ideas: paginatedIdeas as unknown as IdeaDocument[],
        total,
        page,
        limit,
      };
    }

    const [ideas, total] = await Promise.all([
      this.ideaModel
        .find(filter)
        .populate('authorId', 'firstName lastName')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.ideaModel.countDocuments(filter).exec(),
    ]);

    return {
      ideas,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<IdeaDocument> {
    const idea = await this.ideaModel
      .findById(id)
      .populate('authorId', 'firstName lastName')
      .exec();

    if (!idea || !idea.isActive || !idea.isPublished) {
      throw new NotFoundException('Idea not found');
    }

    // Increment view count
    idea.viewCount += 1;
    await idea.save();

    return idea;
  }

  async update(
    id: string,
    updateIdeaDto: UpdateIdeaDto,
    userId: string,
  ): Promise<IdeaDocument> {
    const idea = await this.ideaModel.findById(id).exec();
    if (!idea) {
      throw new NotFoundException('Idea not found');
    }

    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user owns this idea or is admin
    if (
      idea.authorId &&
      idea.authorId.toString() !== userId &&
      user.role !== UserRole.VENDOR
    ) {
      throw new ForbiddenException('You can only update your own ideas');
    }

    // If publishing for the first time, set publishedAt
    if (updateIdeaDto.isPublished && !idea.isPublished) {
      updateIdeaDto.publishedAt = new Date();
    }

    Object.assign(idea, updateIdeaDto);
    return idea.save();
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    const idea = await this.ideaModel.findById(id).exec();
    if (!idea) {
      throw new NotFoundException('Idea not found');
    }

    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user owns this idea or is admin
    if (
      idea.authorId &&
      idea.authorId.toString() !== userId &&
      user.role !== UserRole.VENDOR
    ) {
      throw new ForbiddenException('You can only delete your own ideas');
    }

    idea.isActive = false;
    await idea.save();

    return { message: 'Idea deleted successfully' };
  }

  async likeIdea(
    id: string,
    userId: string,
    likeDto: LikeIdeaDto,
  ): Promise<{ message: string; likeCount: number }> {
    const idea = await this.ideaModel.findById(id).exec();
    if (!idea) {
      throw new NotFoundException('Idea not found');
    }

    // For now, we'll just increment/decrement like count
    // In a real implementation, you'd want to track individual likes to prevent spam
    if (likeDto.isLiked) {
      idea.likeCount += 1;
    } else {
      idea.likeCount = Math.max(0, idea.likeCount - 1);
    }

    await idea.save();

    return {
      message: likeDto.isLiked ? 'Idea liked' : 'Idea unliked',
      likeCount: idea.likeCount,
    };
  }

  async getFeaturedIdeas(limit: number = 10): Promise<IdeaDocument[]> {
    return this.ideaModel
      .find({
        isActive: true,
        isPublished: true,
        isFeatured: true,
      })
      .populate('authorId', 'firstName lastName')
      .sort({ featuredAt: -1, viewCount: -1 })
      .limit(limit)
      .exec();
  }

  async getIdeasByCategory(
    category: IdeaCategory,
    limit: number = 10,
  ): Promise<IdeaDocument[]> {
    return this.ideaModel
      .find({
        isActive: true,
        isPublished: true,
        category: category,
      })
      .populate('authorId', 'firstName lastName')
      .sort({ viewCount: -1, likeCount: -1 })
      .limit(limit)
      .exec();
  }

  async getIdeasByAuthor(
    authorId: string,
    limit: number = 10,
  ): Promise<IdeaDocument[]> {
    return this.ideaModel
      .find({
        isActive: true,
        isPublished: true,
        authorId: new Types.ObjectId(authorId),
      })
      .populate('authorId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async getRelatedIdeas(
    id: string,
    limit: number = 5,
  ): Promise<IdeaDocument[]> {
    const idea = await this.ideaModel.findById(id).exec();
    if (!idea) {
      throw new NotFoundException('Idea not found');
    }

    return this.ideaModel
      .find({
        _id: { $ne: new Types.ObjectId(id) },
        isActive: true,
        isPublished: true,
        $or: [
          { category: idea.category },
          { tags: { $in: idea.tags } },
          { type: idea.type },
        ],
      })
      .populate('authorId', 'firstName lastName')
      .sort({ viewCount: -1, likeCount: -1 })
      .limit(limit)
      .exec();
  }

  async getTrendingIdeas(limit: number = 10): Promise<IdeaDocument[]> {
    const ideas = await this.ideaModel
      .find({
        isActive: true,
        isPublished: true,
      })
      .populate('authorId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 2) // Get more to calculate trending score
      .exec();

    // Calculate trending score and sort
    const ideasWithScore = ideas.map((idea) => {
      const daysSinceCreation =
        (Date.now() - idea.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const trendingScore =
        idea.viewCount * 0.3 +
        idea.likeCount * 0.5 +
        idea.shareCount * 0.2 -
        daysSinceCreation * 0.1;
      return { ...idea.toObject(), trendingScore };
    });

    ideasWithScore.sort((a, b) => b.trendingScore - a.trendingScore);

    return ideasWithScore.slice(0, limit) as unknown as IdeaDocument[];
  }

  async incrementShareCount(id: string): Promise<void> {
    await this.ideaModel
      .findByIdAndUpdate(id, { $inc: { shareCount: 1 } })
      .exec();
  }

  async getIdeasByTags(
    tags: string[],
    limit: number = 10,
  ): Promise<IdeaDocument[]> {
    return this.ideaModel
      .find({
        isActive: true,
        isPublished: true,
        tags: { $in: tags },
      })
      .populate('authorId', 'firstName lastName')
      .sort({ viewCount: -1, likeCount: -1 })
      .limit(limit)
      .exec();
  }
}
