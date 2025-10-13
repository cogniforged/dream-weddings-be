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
import { BookingsService } from './bookings.service';
import {
  CreateBookingDto,
  UpdateBookingDto,
  BookingQueryDto,
  BookingReviewDto,
} from './dto/booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserDocument, UserRole } from '../schemas/user.schema';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  async create(
    @Body() createBookingDto: CreateBookingDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.bookingsService.create(createBookingDto, user._id.toString());
  }

  @Get()
  async findAll(
    @Query() queryDto: BookingQueryDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.bookingsService.findAll(
      queryDto,
      user._id.toString(),
      user.role,
    );
  }

  @Get('stats')
  async getBookingStats(@CurrentUser() user: UserDocument) {
    return this.bookingsService.getBookingStats(user._id.toString(), user.role);
  }

  @Get('upcoming')
  async getUpcomingBookings(
    @CurrentUser() user: UserDocument,
    @Query('limit') limit?: number,
  ) {
    return this.bookingsService.getUpcomingBookings(
      user._id.toString(),
      user.role,
      limit,
    );
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: UserDocument,
  ) {
    return this.bookingsService.findOne(
      id.toString(),
      user._id.toString(),
      user.role,
    );
  }

  @Patch(':id')
  async update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateBookingDto: UpdateBookingDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.bookingsService.update(
      id.toString(),
      updateBookingDto,
      user._id.toString(),
      user.role,
    );
  }

  @Post(':id/review')
  async addReview(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() reviewDto: BookingReviewDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.bookingsService.addReview(
      id.toString(),
      reviewDto,
      user._id.toString(),
    );
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: UserDocument,
  ) {
    return this.bookingsService.remove(
      id.toString(),
      user._id.toString(),
      user.role,
    );
  }
}
