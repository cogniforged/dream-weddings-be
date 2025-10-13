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
import { InquiriesService } from './inquiries.service';
import {
  CreateInquiryDto,
  UpdateInquiryDto,
  InquiryMessageDto,
  InquiryQueryDto,
} from './dto/inquiry.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserDocument, UserRole } from '../schemas/user.schema';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';

@Controller('inquiries')
@UseGuards(JwtAuthGuard)
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  @Post()
  async create(
    @Body() createInquiryDto: CreateInquiryDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.inquiriesService.create(createInquiryDto, user._id.toString());
  }

  @Get()
  async findAll(
    @Query() queryDto: InquiryQueryDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.inquiriesService.findAll(
      queryDto,
      user._id.toString(),
      user.role,
    );
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: UserDocument) {
    const count = await this.inquiriesService.getUnreadCount(
      user._id.toString(),
      user.role,
    );
    return { count };
  }

  @Get('recent')
  async getRecentInquiries(
    @CurrentUser() user: UserDocument,
    @Query('limit') limit?: number,
  ) {
    return this.inquiriesService.getRecentInquiries(
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
    return this.inquiriesService.findOne(
      id.toString(),
      user._id.toString(),
      user.role,
    );
  }

  @Post(':id/messages')
  async addMessage(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() messageDto: InquiryMessageDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.inquiriesService.addMessage(
      id.toString(),
      messageDto,
      user._id.toString(),
      user.role,
    );
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: UserDocument,
  ) {
    return this.inquiriesService.markAsRead(
      id.toString(),
      user._id.toString(),
      user.role,
    );
  }

  @Patch(':id')
  async updateStatus(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateInquiryDto: UpdateInquiryDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.inquiriesService.updateStatus(
      id.toString(),
      updateInquiryDto,
      user._id.toString(),
      user.role,
    );
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: UserDocument,
  ) {
    return this.inquiriesService.remove(
      id.toString(),
      user._id.toString(),
      user.role,
    );
  }
}
