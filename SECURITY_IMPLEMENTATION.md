# Dream Weddings Authentication Security Implementation

## Overview

This document outlines the comprehensive security implementation for the Dream Weddings platform, ensuring complete separation between customer and vendor authentication systems.

## Security Issues Addressed

### Previous Vulnerability
- **Issue**: Customers and vendors shared the same login endpoint (`/auth/login`)
- **Risk**: Customers could login using vendor credentials and vice versa
- **Impact**: Cross-role access, data breach, unauthorized operations

### Solution Implemented
- **Separate Authentication Endpoints**: Different login endpoints for customers and vendors
- **Role-Specific JWT Tokens**: Different token structures and validation for each role
- **Strict Role Validation**: Multiple layers of role checking
- **Separate Token Storage**: Different localStorage keys for customer and vendor tokens

## Backend Security Implementation

### 1. Separate Authentication Endpoints

#### Customer Login
```typescript
POST /auth/customer/login
```
- **Validation**: Only users with `role: 'customer'` can login
- **Token**: Customer-specific JWT with `userType: 'customer'`
- **Expiration**: 24 hours

#### Vendor Login
```typescript
POST /auth/vendor/login
```
- **Validation**: Only users with `role: 'vendor'` can login
- **Token**: Vendor-specific JWT with `userType: 'vendor'`
- **Expiration**: 7 days (longer for business use)

### 2. JWT Token Structure

#### Customer Token Payload
```json
{
  "sub": "user_id",
  "email": "customer@example.com",
  "role": "customer",
  "name": "Customer Name",
  "userType": "customer",
  "customerId": "user_id"
}
```

#### Vendor Token Payload
```json
{
  "sub": "user_id",
  "email": "vendor@example.com",
  "role": "vendor",
  "name": "Vendor Name",
  "userType": "vendor",
  "vendorId": "user_id",
  "businessName": "Business Name",
  "category": "photography"
}
```

### 3. Authentication Strategies

#### Customer JWT Strategy
- **File**: `src/auth/strategies/customer-jwt.strategy.ts`
- **Validation**: Ensures `userType === 'customer'` and `role === 'customer'`
- **Guard**: `CustomerAuthGuard`

#### Vendor JWT Strategy
- **File**: `src/auth/strategies/vendor-jwt.strategy.ts`
- **Validation**: Ensures `userType === 'vendor'` and `role === 'vendor'`
- **Guard**: `VendorAuthGuard`

### 4. Role-Based Access Control

#### Customer-Only Endpoints
```typescript
@UseGuards(CustomerAuthGuard)
@Get('customer/profile')
async getCustomerProfile() { ... }
```

#### Vendor-Only Endpoints
```typescript
@UseGuards(VendorAuthGuard)
@Get('vendor/stats')
async getVendorStats() { ... }
```

## Frontend Security Implementation

### 1. Separate Authentication Contexts

#### Customer Auth Context
- **File**: `src/contexts/CustomerAuthContext.tsx`
- **Storage**: `dream_weddings_customer_token`, `dream_weddings_customer_user`
- **Hook**: `useCustomerAuth()`

#### Vendor Auth Context
- **File**: `src/contexts/VendorAuthContext.tsx`
- **Storage**: `dream_weddings_vendor_token`, `dream_weddings_vendor_user`
- **Hook**: `useVendorAuth()`

### 2. Combined Auth Provider
- **File**: `src/contexts/CombinedAuthContext.tsx`
- **Purpose**: Manages both customer and vendor contexts
- **Helper Methods**: `isCustomerAuthenticated()`, `isVendorAuthenticated()`, `logoutAll()`

### 3. Route Protection

#### Customer Protected Routes
```typescript
<CustomerProtectedRoute>
  <CustomerDashboard />
</CustomerProtectedRoute>
```

#### Vendor Protected Routes
```typescript
<VendorProtectedRoute>
  <VendorDashboard />
</VendorProtectedRoute>
```

#### Role Exclusive Routes
```typescript
<RoleExclusiveRoute allowedRole="customer">
  <CustomerOnlyContent />
</RoleExclusiveRoute>
```

### 4. Separate API Clients

#### Customer API Client
- **File**: `src/lib/axios.ts` - `customerApiClient`
- **Token**: Uses `dream_weddings_customer_token`
- **Redirect**: On 401, redirects to `/login`

#### Vendor API Client
- **File**: `src/lib/axios.ts` - `vendorApiClient`
- **Token**: Uses `dream_weddings_vendor_token`
- **Redirect**: On 401, redirects to `/vendor/login`

## Security Features

### 1. Multi-Layer Validation
1. **Endpoint Level**: Role validation in login endpoints
2. **Token Level**: `userType` validation in JWT strategies
3. **Guard Level**: Additional role checking in guards
4. **Frontend Level**: Context-based role validation

### 2. Token Security
- **Different Expiration Times**: Customers (24h), Vendors (7d)
- **Role-Specific Claims**: Different payload structures
- **Separate Storage**: Different localStorage keys
- **Automatic Cleanup**: Tokens cleared on logout/expiry

### 3. Cross-Role Prevention
- **Login Endpoints**: Customers cannot use vendor login and vice versa
- **Token Validation**: Tokens are validated against their intended role
- **Route Protection**: Routes are protected by role-specific guards
- **API Access**: Different API clients for different roles

### 4. Error Handling
- **403 Forbidden**: When wrong role tries to access endpoint
- **401 Unauthorized**: When token is invalid or expired
- **Automatic Redirect**: Users redirected to appropriate login page
- **Clear Error Messages**: Specific error messages for different scenarios

## Testing

### Security Test Script
- **File**: `test-security.sh`
- **Tests**: 
  - Customer login with customer endpoint
  - Vendor login with vendor endpoint
  - Customer trying to access vendor endpoint
  - Vendor trying to access customer endpoint
  - Cross-role login attempts
  - Invalid token access

### Manual Testing Checklist
- [ ] Customer can only login via `/auth/customer/login`
- [ ] Vendor can only login via `/auth/vendor/login`
- [ ] Customer cannot access `/auth/vendor/stats`
- [ ] Vendor cannot access customer-specific endpoints
- [ ] Customer tokens don't work for vendor endpoints
- [ ] Vendor tokens don't work for customer endpoints
- [ ] Invalid tokens are rejected
- [ ] Expired tokens are handled properly

## Migration Guide

### For Existing Users
1. **No Breaking Changes**: Existing generic `/auth/login` still works
2. **Gradual Migration**: Users can be migrated to role-specific endpoints
3. **Backward Compatibility**: Old tokens still work until expiry

### For New Implementations
1. **Use Role-Specific Endpoints**: Always use `/auth/customer/login` or `/auth/vendor/login`
2. **Implement Proper Guards**: Use `CustomerAuthGuard` or `VendorAuthGuard`
3. **Separate Contexts**: Use `CustomerAuthContext` or `VendorAuthContext`

## Security Best Practices

### 1. Token Management
- Store tokens in separate localStorage keys
- Implement token refresh mechanisms
- Clear tokens on logout
- Handle token expiration gracefully

### 2. Route Protection
- Always use role-specific protected routes
- Implement proper redirects
- Show loading states during auth checks
- Handle authentication errors

### 3. API Calls
- Use appropriate API clients for each role
- Include proper error handling
- Implement retry mechanisms
- Log security events

### 4. User Experience
- Clear error messages for authentication failures
- Proper loading states
- Smooth redirects between login pages
- Remember user's intended role

## Conclusion

This implementation provides comprehensive security separation between customers and vendors, ensuring that:

1. **Complete Isolation**: Customers and vendors have separate authentication flows
2. **Role Enforcement**: Multiple layers of role validation prevent cross-access
3. **Token Security**: Role-specific tokens with different expiration times
4. **Route Protection**: Proper guards and protected routes
5. **Error Handling**: Clear error messages and proper redirects
6. **Testing**: Comprehensive test coverage for security scenarios

The system now provides maximum security while maintaining a good user experience for both customer and vendor users.
