import { UserDocument } from '../../schemas/user.schema';
import { VendorDocument } from '../../schemas/vendor.schema';
import { IdeaDocument } from '../../schemas/idea.schema';

export interface AdminDashboardStats {
  overview: {
    totalUsers: number;
    totalVendors: number;
    totalIdeas: number;
    totalBookings: number;
    totalReviews: number;
    totalInquiries: number;
    totalRevenue: number;
  };
  pending: {
    pendingVendors: number;
    unpublishedIdeas: number;
    pendingBookings: number;
    unverifiedReviews: number;
  };
  completion: {
    publishedIdeas: number;
    completedBookings: number;
    verifiedReviews: number;
  };
}

export interface AdminAnalytics {
  trends: {
    users: Array<{
      _id: { year: number; month: number; day: number };
      count: number;
    }>;
    vendors: Array<{
      _id: { year: number; month: number; day: number };
      count: number;
    }>;
    revenue: Array<{
      _id: { year: number; month: number; day: number };
      revenue: number;
      bookings: number;
    }>;
  };
  topVendors: Array<{
    businessName: string;
    rating: number;
    reviewCount: number;
    totalRevenue: number;
    totalBookings: number;
  }>;
  categoryDistribution: Array<{
    _id: string;
    count: number;
  }>;
}

export interface RecentActivity {
  type: 'user' | 'vendor' | 'idea' | 'booking';
  data: Record<string, unknown>;
}

export interface AdminNotifications {
  pendingVendors: number;
  pendingBookings: number;
  pendingInquiries: number;
  unverifiedReviews: number;
  total: number;
}

export interface PaginatedUsersResponse {
  users: UserDocument[];
  total: number;
  page: number;
  limit: number;
}

export interface PaginatedVendorsResponse {
  data: VendorDocument[];
  total: number;
  page: number;
  limit: number;
}

export interface PaginatedContentResponse {
  content: IdeaDocument[];
  total: number;
  page: number;
  limit: number;
}

export interface FeaturedListingResponse {
  message: string;
}
