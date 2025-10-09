# Dream Weddings API Documentation

## Overview
A comprehensive wedding platform API built with NestJS, MongoDB, and JWT authentication. Features role-based access control for customers and vendors with separate authentication tokens.

## Base URL
```
http://localhost:3001/api/v1
```

## Authentication
The API uses JWT tokens for authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Security Features
- ✅ Role-based access control (Customer, Vendor, Admin)
- ✅ Separate JWT tokens for different user types
- ✅ Password hashing with bcrypt (12 rounds)
- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ Helmet security headers
- ✅ Input validation and sanitization
- ✅ CORS protection

---

## 🔐 Authentication Endpoints

### Register User
```http
POST /auth/register
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "role": "customer", // or "vendor"
  "phone": "+94 77 123 4567",
  "address": "123 Main Street",
  "city": "Colombo"
}
```

**Vendor Registration (additional fields):**
```json
{
  "email": "vendor@example.com",
  "password": "password123",
  "name": "Jane Smith",
  "role": "vendor",
  "businessName": "Premium Photography",
  "category": "photography",
  "businessDescription": "Professional wedding photography",
  "businessPhone": "+94 77 234 5678",
  "businessAddress": "456 Business Street",
  "businessCity": "Colombo",
  "website": "https://premiumphoto.lk",
  "instagram": "@premiumphoto",
  "facebook": "https://facebook.com/premiumphoto",
  "whatsapp": "+94 77 234 5678",
  "priceRange": {
    "min": 50000,
    "max": 150000
  }
}
```

### Login
```http
POST /auth/login
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "customer",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Get Profile
```http
GET /auth/profile
Authorization: Bearer <token>
```

### Update Profile
```http
PUT /auth/profile
Authorization: Bearer <token>
```

### Change Password
```http
PUT /auth/change-password
Authorization: Bearer <token>
```

**Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

---

## 👥 Customer Endpoints

### Send Inquiry to Vendor
```http
POST /users/inquiry/:vendorId
Authorization: Bearer <customer-token>
```

**Body:**
```json
{
  "customerName": "Sarah & Michael",
  "customerEmail": "sarah@example.com",
  "customerPhone": "+94 77 123 4567",
  "message": "Hi! We are getting married on March 15th. Could you please send us more details about your photography packages?"
}
```

### Add Vendor to Favorites
```http
POST /users/favorites/:vendorId
Authorization: Bearer <customer-token>
```

**Body:**
```json
{
  "notes": "Great photographer, love their style"
}
```

### Remove from Favorites
```http
PUT /users/favorites/:vendorId
Authorization: Bearer <customer-token>
```

### Get My Favorites
```http
GET /users/favorites
Authorization: Bearer <customer-token>
```

### Submit Review
```http
POST /users/reviews/:vendorId
Authorization: Bearer <customer-token>
```

**Body:**
```json
{
  "customerName": "Sarah & Michael",
  "rating": 5,
  "comment": "Amazing photographer! Captured our special day perfectly.",
  "weddingDate": "2024-03-15T00:00:00.000Z",
  "serviceCategory": "photography",
  "photos": ["photo1.jpg", "photo2.jpg"]
}
```

### Get My Inquiries
```http
GET /users/inquiries
Authorization: Bearer <customer-token>
```

### Get My Reviews
```http
GET /users/reviews
Authorization: Bearer <customer-token>
```

### Update Wedding Details
```http
PUT /users/wedding-details
Authorization: Bearer <customer-token>
```

**Body:**
```json
{
  "weddingDate": "2024-06-15T00:00:00.000Z",
  "budget": 500000,
  "address": "123 Wedding Street",
  "city": "Colombo",
  "phone": "+94 77 123 4567"
}
```

---

## 🏪 Vendor Endpoints

### Get All Vendors (Public)
```http
GET /vendors?category=photography&city=Colombo&minPrice=50000&maxPrice=150000&rating=4&search=premium&page=1&limit=10&sortBy=rating&sortOrder=desc
```

**Query Parameters:**
- `category`: Filter by vendor category
- `city`: Filter by city
- `minPrice`/`maxPrice`: Price range filter
- `rating`: Minimum rating filter
- `isPremium`: Filter premium vendors
- `isFeatured`: Filter featured vendors
- `search`: Search in business name, description, city
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `sortBy`: Sort field (rating, createdAt, priceRange.min)
- `sortOrder`: Sort order (asc, desc)

### Get Vendor Details (Public)
```http
GET /vendors/:id
```

### Get Vendor Reviews (Public)
```http
GET /vendors/:id/reviews
```

### Get My Leads
```http
GET /vendors/me/leads?status=new
Authorization: Bearer <vendor-token>
```

### Update Lead Status
```http
PUT /vendors/me/leads/:leadId/status
Authorization: Bearer <vendor-token>
```

**Body:**
```json
{
  "status": "contacted",
  "notes": "Called customer, waiting for response"
}
```

**Lead Statuses:**
- `new`: New inquiry
- `contacted`: Vendor contacted customer
- `quoted`: Quote sent to customer
- `booked`: Customer booked the service
- `lost`: Customer chose another vendor

### Contact Lead
```http
POST /vendors/me/leads/:leadId/contact
Authorization: Bearer <vendor-token>
```

**Body:**
```json
{
  "message": "Thank you for your inquiry! I'd love to discuss your wedding photography needs. When would be a good time to call?"
}
```

### Send Quote
```http
POST /vendors/me/leads/:leadId/quote
Authorization: Bearer <vendor-token>
```

**Body:**
```json
{
  "quoteAmount": 100000,
  "quoteDetails": "Premium package includes 10 hours of photography, 500+ edited photos, online gallery, USB drive, and engagement session."
}
```

### Update Portfolio
```http
PUT /vendors/me/portfolio
Authorization: Bearer <vendor-token>
```

**Body:**
```json
{
  "portfolio": [
    "wedding1.jpg",
    "wedding2.jpg",
    "wedding3.jpg"
  ]
}
```

### Update Packages
```http
PUT /vendors/me/packages
Authorization: Bearer <vendor-token>
```

**Body:**
```json
{
  "packages": [
    {
      "id": "1",
      "name": "Basic Package",
      "description": "Perfect for intimate weddings",
      "price": 50000,
      "features": [
        "6 hours of photography",
        "200+ edited photos",
        "Online gallery",
        "USB drive with photos"
      ]
    },
    {
      "id": "2",
      "name": "Premium Package",
      "description": "Complete wedding coverage",
      "price": 100000,
      "features": [
        "10 hours of photography",
        "500+ edited photos",
        "Online gallery",
        "USB drive with photos",
        "Engagement session",
        "Photo album"
      ]
    }
  ]
}
```

### Get Analytics (Premium Feature)
```http
GET /vendors/me/analytics
Authorization: Bearer <vendor-token>
```

**Response:**
```json
{
  "leads": [
    { "_id": "new", "count": 5 },
    { "_id": "contacted", "count": 3 },
    { "_id": "quoted", "count": 2 },
    { "_id": "booked", "count": 1 }
  ],
  "reviews": {
    "averageRating": 4.8,
    "totalReviews": 25
  },
  "profileViews": 1247,
  "clicks": 89,
  "conversionRate": 18.5
}
```

---

## 📊 Database Schema

### User Schema
```typescript
{
  email: string (unique, required)
  password: string (hashed, required)
  name: string (required)
  role: 'customer' | 'vendor' | 'admin' (required)
  isActive: boolean (default: true)
  isEmailVerified: boolean (default: false)
  
  // Customer fields
  phone?: string
  address?: string
  city?: string
  weddingDate?: Date
  budget?: number
  
  // Vendor fields
  businessName?: string
  category?: VendorCategory
  businessDescription?: string
  businessPhone?: string
  businessAddress?: string
  businessCity?: string
  website?: string
  instagram?: string
  facebook?: string
  whatsapp?: string
  rating?: number (default: 0)
  reviewCount?: number (default: 0)
  priceRange?: { min: number, max: number }
  isPremium?: boolean (default: false)
  isFeatured?: boolean (default: false)
  isVerified?: boolean (default: false)
  portfolio?: string[]
  packages?: Package[]
}
```

### Lead Schema
```typescript
{
  vendorId: ObjectId (ref: User, required)
  customerId: ObjectId (ref: User, required)
  customerName: string (required)
  customerEmail: string (required)
  customerPhone: string (required)
  message: string (required)
  status: 'new' | 'contacted' | 'quoted' | 'booked' | 'lost' (default: 'new')
  vendorResponse?: string
  quoteAmount?: number
  quoteDetails?: string
  bookingDate?: Date
  notes?: string
  lastContactDate?: Date
}
```

### Review Schema
```typescript
{
  vendorId: ObjectId (ref: User, required)
  customerId: ObjectId (ref: User, required)
  customerName: string (required)
  rating: number (1-5, required)
  comment: string (required)
  weddingDate?: Date
  serviceCategory?: string
  isVerified?: boolean (default: false)
  photos?: string[]
  isFeatured?: boolean (default: false)
}
```

### Favorite Schema
```typescript
{
  customerId: ObjectId (ref: User, required)
  vendorId: ObjectId (ref: User, required)
  addedAt: Date (default: now)
  notes?: string
}
```

---

## 🔒 Security Features

### JWT Token Structure
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "customer|vendor|admin",
  "name": "User Name",
  "iat": 1640995200,
  "exp": 1641081600
}
```

### Role-Based Access Control
- **Customer**: Can send inquiries, add favorites, submit reviews
- **Vendor**: Can manage leads, update portfolio, view analytics
- **Admin**: Full access to all endpoints

### Rate Limiting
- 100 requests per 15 minutes per IP
- Separate limits for authentication endpoints

### Password Security
- Minimum 8 characters
- Bcrypt hashing with 12 salt rounds
- Password change requires current password verification

---

## 🚀 Getting Started

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Set Environment Variables**
   Create `.env` file with:
   ```
   MONGODB_URI=mongodb://localhost:27017/dream-weddings
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=24h
   PORT=3001
   ```

3. **Start MongoDB**
   ```bash
   mongod
   ```

4. **Run the Application**
   ```bash
   pnpm start:dev
   ```

5. **Test the API**
   ```bash
   curl http://localhost:3001/api/v1/vendors
   ```

---

## 📝 Error Handling

All endpoints return consistent error responses:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Too Many Requests
- `500`: Internal Server Error

---

## 🔧 Development

### Available Scripts
```bash
pnpm start          # Start production server
pnpm start:dev      # Start development server
pnpm build          # Build the application
pnpm test           # Run unit tests
pnpm test:e2e       # Run end-to-end tests
pnpm lint           # Run linter
pnpm format         # Format code
```

### Database Indexes
The following indexes are created for optimal performance:
- `email` (unique)
- `role`
- `category`
- `businessCity`
- `isPremium`
- `isFeatured`
- `rating` (descending)
- `createdAt` (descending)

---

## 📞 Support

For API support and questions:
- Email: api-support@dreamweddings.lk
- Documentation: http://localhost:3001/api/v1/docs
- GitHub: https://github.com/dream-weddings/api


