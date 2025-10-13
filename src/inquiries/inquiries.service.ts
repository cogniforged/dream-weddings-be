import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Inquiry,
  InquiryDocument,
  InquiryStatus,
} from '../schemas/inquiry.schema';
import { User, UserDocument, UserRole } from '../schemas/user.schema';
import { Vendor, VendorDocument } from '../schemas/vendor.schema';
import {
  CreateInquiryDto,
  UpdateInquiryDto,
  InquiryMessageDto,
  InquiryQueryDto,
} from './dto/inquiry.dto';

@Injectable()
export class InquiriesService {
  constructor(
    @InjectModel(Inquiry.name) private inquiryModel: Model<InquiryDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Vendor.name) private vendorModel: Model<VendorDocument>,
  ) {}

  async create(
    createInquiryDto: CreateInquiryDto,
    userId: string,
  ): Promise<InquiryDocument> {
    const { vendorId, ...inquiryData } = createInquiryDto;

    // Check if vendor exists
    const vendor = await this.vendorModel.findById(vendorId).exec();
    if (!vendor || !vendor.isActive) {
      throw new NotFoundException('Vendor not found');
    }

    const inquiry = new this.inquiryModel({
      ...inquiryData,
      customerId: new Types.ObjectId(userId),
      vendorId: new Types.ObjectId(vendorId),
      status: InquiryStatus.PENDING,
      messages: [
        {
          senderId: new Types.ObjectId(userId),
          message: inquiryData.message,
          attachments: inquiryData.attachments || [],
          isRead: false,
        },
      ],
      lastMessageAt: new Date(),
    });

    const savedInquiry = await inquiry.save();

    // Increment vendor inquiry count
    await this.vendorModel
      .findByIdAndUpdate(vendorId, { $inc: { inquiryCount: 1 } })
      .exec();

    return savedInquiry.populate(
      'customerId',
      'firstName lastName email phone',
    );
  }

  async findAll(
    queryDto: InquiryQueryDto,
    userId: string,
    userRole: UserRole,
  ): Promise<{
    inquiries: InquiryDocument[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      search,
      status,
      sortBy = 'lastMessageAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
    } = queryDto;

    let filter: any = { isActive: true };

    // Filter based on user role
    if (userRole === UserRole.CUSTOMER) {
      filter.customerId = new Types.ObjectId(userId);
    } else if (userRole === UserRole.VENDOR) {
      // Find vendor by userId
      const vendor = await this.vendorModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .exec();
      if (!vendor) {
        throw new NotFoundException('Vendor profile not found');
      }
      filter.vendorId = vendor._id;
    }
    // Admin can see all inquiries

    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
        { specialRequirements: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      filter.status = status;
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;

    const [inquiries, total] = await Promise.all([
      this.inquiryModel
        .find(filter)
        .populate('customerId', 'firstName lastName email phone')
        .populate('vendorId', 'businessName businessLogo')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.inquiryModel.countDocuments(filter).exec(),
    ]);

    return {
      inquiries,
      total,
      page,
      limit,
    };
  }

  async findOne(
    id: string,
    userId: string,
    userRole: UserRole,
  ): Promise<InquiryDocument> {
    const inquiry = await this.inquiryModel
      .findById(id)
      .populate('customerId', 'firstName lastName email phone')
      .populate('vendorId', 'businessName businessLogo')
      .exec();

    if (!inquiry || !inquiry.isActive) {
      throw new NotFoundException('Inquiry not found');
    }

    // Check access permissions
    if (
      userRole === UserRole.CUSTOMER &&
      inquiry.customerId.toString() !== userId
    ) {
      throw new ForbiddenException('You can only view your own inquiries');
    } else if (userRole === UserRole.VENDOR) {
      const vendor = await this.vendorModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .exec();
      if (!vendor || inquiry.vendorId.toString() !== vendor._id.toString()) {
        throw new ForbiddenException(
          'You can only view inquiries for your business',
        );
      }
    }

    return inquiry;
  }

  async addMessage(
    id: string,
    messageDto: InquiryMessageDto,
    userId: string,
    userRole: UserRole,
  ): Promise<InquiryDocument> {
    const inquiry = await this.inquiryModel.findById(id).exec();
    if (!inquiry || !inquiry.isActive) {
      throw new NotFoundException('Inquiry not found');
    }

    // Check access permissions
    if (
      userRole === UserRole.CUSTOMER &&
      inquiry.customerId.toString() !== userId
    ) {
      throw new ForbiddenException(
        'You can only add messages to your own inquiries',
      );
    } else if (userRole === UserRole.VENDOR) {
      const vendor = await this.vendorModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .exec();
      if (!vendor || inquiry.vendorId.toString() !== vendor._id.toString()) {
        throw new ForbiddenException(
          'You can only add messages to inquiries for your business',
        );
      }
    }

    const newMessage = {
      senderId: new Types.ObjectId(userId),
      message: messageDto.message,
      attachments: messageDto.attachments || [],
      isRead: false,
    };

    inquiry.messages.push(newMessage);
    inquiry.lastMessageAt = new Date();

    if (inquiry.status === InquiryStatus.PENDING) {
      inquiry.status = InquiryStatus.REPLIED;
    }

    return inquiry.save();
  }

  async markAsRead(
    id: string,
    userId: string,
    userRole: UserRole,
  ): Promise<{ message: string }> {
    const inquiry = await this.inquiryModel.findById(id).exec();
    if (!inquiry || !inquiry.isActive) {
      throw new NotFoundException('Inquiry not found');
    }

    // Check access permissions
    if (
      userRole === UserRole.CUSTOMER &&
      inquiry.customerId.toString() !== userId
    ) {
      throw new ForbiddenException(
        'You can only mark your own inquiries as read',
      );
    } else if (userRole === UserRole.VENDOR) {
      const vendor = await this.vendorModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .exec();
      if (!vendor || inquiry.vendorId.toString() !== vendor._id.toString()) {
        throw new ForbiddenException(
          'You can only mark inquiries for your business as read',
        );
      }
    }

    // Mark all messages as read
    inquiry.messages.forEach((message) => {
      if (message.senderId.toString() !== userId) {
        message.isRead = true;
        message.readAt = new Date();
      }
    });

    await inquiry.save();

    return { message: 'Inquiry marked as read' };
  }

  async updateStatus(
    id: string,
    updateInquiryDto: UpdateInquiryDto,
    userId: string,
    userRole: UserRole,
  ): Promise<InquiryDocument> {
    const inquiry = await this.inquiryModel.findById(id).exec();
    if (!inquiry || !inquiry.isActive) {
      throw new NotFoundException('Inquiry not found');
    }

    // Check access permissions
    if (
      userRole === UserRole.CUSTOMER &&
      inquiry.customerId.toString() !== userId
    ) {
      throw new ForbiddenException('You can only update your own inquiries');
    } else if (userRole === UserRole.VENDOR) {
      const vendor = await this.vendorModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .exec();
      if (!vendor || inquiry.vendorId.toString() !== vendor._id.toString()) {
        throw new ForbiddenException(
          'You can only update inquiries for your business',
        );
      }
    }

    Object.assign(inquiry, updateInquiryDto);

    if (updateInquiryDto.status === InquiryStatus.CLOSED) {
      inquiry.closedAt = new Date();
      inquiry.closedBy = new Types.ObjectId(userId);
    }

    return inquiry.save();
  }

  async remove(
    id: string,
    userId: string,
    userRole: UserRole,
  ): Promise<{ message: string }> {
    const inquiry = await this.inquiryModel.findById(id).exec();
    if (!inquiry || !inquiry.isActive) {
      throw new NotFoundException('Inquiry not found');
    }

    // Check access permissions
    if (
      userRole === UserRole.CUSTOMER &&
      inquiry.customerId.toString() !== userId
    ) {
      throw new ForbiddenException('You can only delete your own inquiries');
    } else if (userRole === UserRole.VENDOR) {
      const vendor = await this.vendorModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .exec();
      if (!vendor || inquiry.vendorId.toString() !== vendor._id.toString()) {
        throw new ForbiddenException(
          'You can only delete inquiries for your business',
        );
      }
    }

    inquiry.isActive = false;
    await inquiry.save();

    return { message: 'Inquiry deleted successfully' };
  }

  async getUnreadCount(userId: string, userRole: UserRole): Promise<number> {
    let filter: any = { isActive: true };

    if (userRole === UserRole.CUSTOMER) {
      filter.customerId = new Types.ObjectId(userId);
      filter.messages = {
        $elemMatch: {
          senderId: { $ne: new Types.ObjectId(userId) },
          isRead: false,
        },
      };
    } else if (userRole === UserRole.VENDOR) {
      const vendor = await this.vendorModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .exec();
      if (!vendor) {
        return 0;
      }
      filter.vendorId = vendor._id;
      filter.messages = {
        $elemMatch: {
          senderId: { $ne: new Types.ObjectId(userId) },
          isRead: false,
        },
      };
    }

    return this.inquiryModel.countDocuments(filter).exec();
  }

  async getRecentInquiries(
    userId: string,
    userRole: UserRole,
    limit: number = 5,
  ): Promise<InquiryDocument[]> {
    let filter: any = { isActive: true };

    if (userRole === UserRole.CUSTOMER) {
      filter.customerId = new Types.ObjectId(userId);
    } else if (userRole === UserRole.VENDOR) {
      const vendor = await this.vendorModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .exec();
      if (!vendor) {
        return [];
      }
      filter.vendorId = vendor._id;
    }

    return this.inquiryModel
      .find(filter)
      .populate('customerId', 'firstName lastName email phone')
      .populate('vendorId', 'businessName businessLogo')
      .sort({ lastMessageAt: -1 })
      .limit(limit)
      .exec();
  }
}
