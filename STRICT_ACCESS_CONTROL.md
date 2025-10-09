# Strict Vendor Access Control Implementation

## Overview

This document outlines the implementation of strict access controls for vendor dashboard and related operations in the Dream Weddings platform. The system now implements multiple layers of security to ensure that only verified vendor accounts can access vendor-specific functionality.

## Security Layers Implemented

### 1. Authentication Layer
- **Vendor-Specific JWT Tokens**: Only tokens with `userType: 'vendor'` are accepted
- **Role Validation**: Multiple checks ensure `role === 'vendor'`
- **Token Expiration**: Vendor tokens have 7-day expiration for business use
- **Separate Login Endpoints**: `/auth/vendor/login` only accepts vendor accounts

### 2. Authorization Layer
- **VendorAuthGuard**: Validates vendor-specific JWT tokens
- **StrictVendorAccessGuard**: Additional strict validation for vendor operations
- **VendorDashboardGuard**: Specialized guard for dashboard access
- **Role-Based Decorators**: `@VendorOperationsAccess()`, `@VendorDashboardAccess()`

### 3. Middleware Layer
- **VendorAccessMiddleware**: Pre-request validation for all vendor routes
- **Request Validation**: Checks for suspicious patterns and headers
- **Rate Limiting**: Basic protection against rapid successive requests
- **Security Headers**: Validates required vendor-specific headers

### 4. Controller Layer
- **Multiple Guards**: Each endpoint uses multiple guards for defense in depth
- **Strict Decorators**: Endpoints marked with strict access decorators
- **Request Body Validation**: Prevents modification of critical vendor data
- **Error Handling**: Clear error messages for security violations

## Implementation Details

### Guards Implemented

#### 1. StrictVendorAccessGuard
```typescript
@Injectable()
export class StrictVendorAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Multiple validation layers:
    // - User authentication
    // - Role validation (vendor only)
    // - Token type validation
    // - Account status validation
    // - Additional security checks
  }
}
```

**Features:**
- Validates user authentication
- Ensures role is 'vendor'
- Validates token type is 'vendor'
- Checks account is active and verified
- Performs additional security validations
- Validates request headers and patterns

#### 2. VendorDashboardGuard
```typescript
@Injectable()
export class VendorDashboardGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Dashboard-specific validations:
    // - Vendor authentication
    // - Profile completeness
    // - Access permissions
    // - Security context validation
  }
}
```

**Features:**
- Validates vendor authentication
- Ensures vendor profile is complete
- Checks dashboard access permissions
- Validates account status (not suspended/pending)
- Performs security context validation
- Validates request source and headers

#### 3. VendorAccessMiddleware
```typescript
@Injectable()
export class VendorAccessMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Pre-request validation:
    // - Route identification
    // - Vendor access validation
    // - Security pattern detection
    // - Request validation
  }
}
```

**Features:**
- Identifies vendor routes automatically
- Validates vendor access before processing
- Detects suspicious request patterns
- Validates request headers and content
- Implements basic rate limiting
- Prevents sensitive data modification

### Decorators Implemented

#### 1. StrictVendorAccess
```typescript
export const StrictVendorAccess = () => SetMetadata(STRICT_VENDOR_ACCESS, true);
```
- Marks endpoints requiring strict vendor access
- Used with StrictVendorAccessGuard

#### 2. VendorDashboardAccess
```typescript
export const VendorDashboardAccess = () => SetMetadata(VENDOR_DASHBOARD_ACCESS, true);
```
- Marks dashboard-specific endpoints
- Used with VendorDashboardGuard

#### 3. VendorOperationsAccess
```typescript
export const VendorOperationsAccess = () => SetMetadata(VENDOR_OPERATIONS_ACCESS, true);
```
- Marks vendor operation endpoints
- Used for leads, portfolio, packages management

### Endpoint Protection Examples

#### Vendor Analytics (Dashboard Access)
```typescript
@Get('me/analytics')
@UseGuards(VendorAuthGuard, VendorDashboardGuard)
@VendorDashboardAccess()
@ApiBearerAuth('JWT-auth')
@ApiOperation({ summary: 'Get vendor analytics' })
@ApiResponse({ status: 403, description: 'Forbidden - Vendor dashboard access strictly required' })
async getMyAnalytics(@Request() req) {
  return this.vendorsService.getVendorAnalytics(req.user._id);
}
```

#### Vendor Leads Management
```typescript
@Get('me/leads')
@UseGuards(VendorAuthGuard, StrictVendorAccessGuard)
@VendorOperationsAccess()
@ApiBearerAuth('JWT-auth')
@ApiOperation({ summary: 'Get vendor leads' })
@ApiResponse({ status: 403, description: 'Forbidden - Vendor role strictly required' })
async getMyLeads(@Request() req, @Query('status') status?: LeadStatus) {
  return this.vendorsService.getVendorLeads(req.user._id, status);
}
```

#### Portfolio Management
```typescript
@Put('me/portfolio')
@UseGuards(VendorAuthGuard, StrictVendorAccessGuard)
@VendorOperationsAccess()
@ApiBearerAuth('JWT-auth')
@ApiOperation({ summary: 'Update vendor portfolio' })
@ApiResponse({ status: 403, description: 'Forbidden - Vendor role strictly required' })
async updatePortfolio(@Request() req, @Body() body: { portfolio: string[] }) {
  return this.vendorsService.updatePortfolio(req.user._id, body.portfolio);
}
```

## Security Features

### 1. Multi-Layer Validation
- **Authentication**: JWT token validation
- **Authorization**: Role and permission checks
- **Middleware**: Pre-request validation
- **Controller**: Endpoint-specific validation
- **Service**: Business logic validation

### 2. Suspicious Activity Detection
- **Invalid User Agents**: Rejects requests with suspicious user agents
- **Rapid Requests**: Basic rate limiting protection
- **Suspicious Headers**: Detects proxy and suspicious headers
- **Invalid Referers**: Validates request source for dashboard access
- **Request Patterns**: Detects unusual request patterns

### 3. Data Protection
- **Request Body Validation**: Prevents modification of critical fields
- **Role Modification Prevention**: Blocks attempts to change user role
- **Account Status Protection**: Prevents modification of account status
- **Verification Status Protection**: Prevents modification of verification status

### 4. Error Handling
- **Clear Error Messages**: Specific error messages for different violations
- **Security Logging**: Logs security violations for monitoring
- **Graceful Degradation**: Proper error responses without information leakage
- **Audit Trail**: Maintains logs of access attempts

## Access Control Matrix

| Endpoint | Customer Token | Vendor Token | Invalid Token | Suspicious Request |
|----------|---------------|--------------|---------------|-------------------|
| `/vendors/me/analytics` | ❌ 403 Forbidden | ✅ 200 OK | ❌ 401 Unauthorized | ❌ 403 Suspicious |
| `/vendors/me/leads` | ❌ 403 Forbidden | ✅ 200 OK | ❌ 401 Unauthorized | ❌ 403 Suspicious |
| `/vendors/me/portfolio` | ❌ 403 Forbidden | ✅ 200 OK | ❌ 401 Unauthorized | ❌ 403 Suspicious |
| `/vendors/me/packages` | ❌ 403 Forbidden | ✅ 200 OK | ❌ 401 Unauthorized | ❌ 403 Suspicious |
| `/vendors/me/leads/:id/status` | ❌ 403 Forbidden | ✅ 200 OK | ❌ 401 Unauthorized | ❌ 403 Suspicious |

## Testing

### Automated Testing
- **Test Script**: `test-strict-access.sh`
- **Comprehensive Coverage**: Tests all security scenarios
- **Automated Validation**: Verifies access controls work correctly
- **Security Scenarios**: Tests various attack vectors

### Manual Testing Checklist
- [ ] Customer cannot access vendor analytics
- [ ] Customer cannot access vendor leads
- [ ] Customer cannot update vendor portfolio
- [ ] Customer cannot update lead status
- [ ] Customer cannot send quotes
- [ ] Customer cannot contact leads
- [ ] Vendor can access their own analytics
- [ ] Vendor can manage their leads
- [ ] Invalid tokens are rejected
- [ ] Suspicious requests are blocked
- [ ] Cross-role token usage is prevented

## Configuration

### Environment Variables
```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Security Configuration
VENDOR_VERIFICATION_REQUIRED=true
VENDOR_DASHBOARD_ACCESS_CONTROL=true
SUSPICIOUS_ACTIVITY_DETECTION=true
```

### Middleware Configuration
```typescript
// In VendorsModule
export class VendorsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(VendorAccessMiddleware)
      .forRoutes('vendors');
  }
}
```

## Monitoring and Logging

### Security Events Logged
- Failed authentication attempts
- Access denied events
- Suspicious activity detection
- Cross-role access attempts
- Invalid token usage
- Rate limiting triggers

### Monitoring Metrics
- Authentication success/failure rates
- Access denied frequency
- Suspicious activity patterns
- Token validation failures
- Middleware processing times

## Best Practices

### 1. Token Management
- Use vendor-specific tokens only
- Implement proper token refresh
- Clear tokens on logout
- Monitor token usage patterns

### 2. Access Control
- Always use multiple guards
- Implement defense in depth
- Validate at every layer
- Log security events

### 3. Error Handling
- Provide clear error messages
- Don't leak sensitive information
- Log security violations
- Implement proper error responses

### 4. Monitoring
- Monitor access patterns
- Alert on suspicious activity
- Track security metrics
- Regular security audits

## Conclusion

The strict vendor access control implementation provides comprehensive security for vendor dashboard and operations:

1. **Complete Isolation**: Customers cannot access any vendor functionality
2. **Multiple Security Layers**: Defense in depth with guards, middleware, and validation
3. **Suspicious Activity Detection**: Proactive detection of malicious behavior
4. **Comprehensive Testing**: Automated and manual testing coverage
5. **Monitoring and Logging**: Full audit trail and security monitoring
6. **Scalable Architecture**: Easy to extend and maintain

The system now ensures that vendor dashboard and related operations are strictly restricted to verified vendor accounts only, providing maximum security while maintaining usability for legitimate vendor users.
