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
import { ReviewsService } from './reviews.service';
import {
  CreateReviewDto,
  UpdateReviewDto,
  ReviewQueryDto,
  VendorResponseDto,
  ReviewHelpfulDto,
} from './dto/review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserDocument } from '../schemas/user.schema';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createReviewDto: CreateReviewDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.reviewsService.create(createReviewDto, user._id.toString());
  }

  @Get()
  async findAll(@Query() queryDto: ReviewQueryDto) {
    return this.reviewsService.findAll(queryDto);
  }

  @Get('recent')
  async getRecentReviews(@Query('limit') limit?: number) {
    return this.reviewsService.getRecentReviews(limit);
  }

  @Get('top-rated')
  async getTopRatedReviews(@Query('limit') limit?: number) {
    return this.reviewsService.getTopRatedReviews(limit);
  }

  @Get('vendor/:vendorId')
  async getReviewsByVendor(
    @Param('vendorId', ParseObjectIdPipe) vendorId: string,
    @Query('limit') limit?: number,
  ) {
    return this.reviewsService.findByVendor(vendorId.toString(), limit);
  }

  @Get('vendor/:vendorId/stats')
  async getVendorRatingStats(
    @Param('vendorId', ParseObjectIdPipe) vendorId: string,
  ) {
    return this.reviewsService.getVendorRatingStats(vendorId.toString());
  }

  @Get(':id')
  async findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.reviewsService.findOne(id.toString());
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.reviewsService.update(
      id.toString(),
      updateReviewDto,
      user._id.toString(),
    );
  }

  @Patch(':id/vendor-response')
  @UseGuards(JwtAuthGuard)
  async addVendorResponse(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() responseDto: VendorResponseDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.reviewsService.addVendorResponse(
      id.toString(),
      responseDto,
      user._id.toString(),
    );
  }

  @Patch(':id/helpful')
  @UseGuards(JwtAuthGuard)
  async markHelpful(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() helpfulDto: ReviewHelpfulDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.reviewsService.markHelpful(
      id.toString(),
      helpfulDto,
      user._id.toString(),
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: UserDocument,
  ) {
    return this.reviewsService.remove(id.toString(), user._id.toString());
  }
}
