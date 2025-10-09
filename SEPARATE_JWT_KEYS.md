# Separate JWT Keys Configuration

## Environment Variables Required

```bash
# Customer-specific JWT Secret
CUSTOMER_JWT_SECRET=customer-specific-jwt-secret-key-here

# Vendor-specific JWT Secret  
VENDOR_JWT_SECRET=vendor-specific-jwt-secret-key-here
```

## Security Benefits of Separate Keys

### 1. **Key Isolation**
- If customer JWT key is compromised, vendor tokens remain secure
- If vendor JWT key is compromised, customer tokens remain secure
- Independent key rotation capabilities

### 2. **Enhanced Security**
- Different encryption keys for different user types
- Reduced attack surface
- Better security audit trail

### 3. **Operational Benefits**
- Independent key management
- Separate key rotation schedules
- Granular security controls

## Implementation Details

### Customer JWT Configuration
```typescript
// Customer JWT Module
JwtModule.registerAsync({
  useFactory: (configService: ConfigService) => ({
    secret: configService.get<string>('CUSTOMER_JWT_SECRET'),
    signOptions: { expiresIn: '24h' },
  }),
})
```

### Vendor JWT Configuration
```typescript
// Vendor JWT Module
JwtModule.registerAsync({
  useFactory: (configService: ConfigService) => ({
    secret: configService.get<string>('VENDOR_JWT_SECRET'),
    signOptions: { expiresIn: '7d' },
  }),
})
```

### Token Generation
```typescript
// Customer tokens use customer JWT service
return this.customerJwtService.sign(payload);

// Vendor tokens use vendor JWT service
return this.vendorJwtService.sign(payload);
```

### Token Validation
```typescript
// Customer strategy uses customer secret
secretOrKey: configService.get<string>('CUSTOMER_JWT_SECRET')

// Vendor strategy uses vendor secret
secretOrKey: configService.get<string>('VENDOR_JWT_SECRET')
```

## Key Generation Recommendations

### Generate Strong Keys
```bash
# Generate customer JWT secret (64 characters)
openssl rand -base64 48

# Generate vendor JWT secret (64 characters)  
openssl rand -base64 48
```

### Key Rotation Strategy
1. **Customer Keys**: Rotate every 30 days
2. **Vendor Keys**: Rotate every 90 days (longer for business continuity)

## Security Best Practices

### 1. **Key Storage**
- Store keys in environment variables
- Use secure key management services in production
- Never commit keys to version control

### 2. **Key Rotation**
- Implement automated key rotation
- Maintain backward compatibility during rotation
- Monitor key usage and expiration

### 3. **Monitoring**
- Log key usage patterns
- Monitor for suspicious token activity
- Alert on key compromise attempts

## Migration Guide

### Clean Implementation (No Backward Compatibility)

1. **Set environment variables**:
   ```bash
   CUSTOMER_JWT_SECRET=customer-specific-secret
   VENDOR_JWT_SECRET=vendor-specific-secret
   ```

2. **Deploy updated code** with separate JWT modules

3. **All new logins** will use role-specific keys

4. **Monitor and validate** the implementation

## Conclusion

Using separate JWT keys for customers and vendors provides:
- ✅ **Enhanced Security**: Key isolation and independent encryption
- ✅ **Better Control**: Granular key management and rotation
- ✅ **Reduced Risk**: Compromise of one key doesn't affect the other
- ✅ **Operational Benefits**: Independent key lifecycle management

This implementation follows security best practices and provides maximum protection for both customer and vendor authentication systems.
