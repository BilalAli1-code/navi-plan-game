# Payment Security Fixes

This document outlines the security improvements made to the payment system.

## Issues Fixed

### 1. **Input Validation**
- ✅ Comprehensive validation for `priceId`, `returnUrl`, and `environment`
- ✅ UserId format validation (UUID or alphanumeric-hyphen format)
- ✅ Email format validation
- ✅ Environment enum validation (sandbox/live only)

### 2. **Open Redirect Prevention**
- ✅ Whitelist-based URL validation for return URLs
- ✅ Protocol enforcement (HTTPS only, except localhost)
- ✅ Domain whitelist against common domains

### 3. **Webhook Security**
- ✅ Webhook event deduplication to prevent duplicate processing
- ✅ Timestamp format validation (numeric Unix time)
- ✅ Constant-time signature comparison (prevents timing attacks)
- ✅ Request size limit validation (1MB max)

### 4. **Error Handling & Information Disclosure**
- ✅ Sanitized error messages returned to clients
- ✅ No internal error details leaked
- ✅ Appropriate HTTP status codes (400 for validation, 500 for processing)

### 5. **Race Condition Prevention**
- ✅ Additional userId check in welcome bonus atomicity
- ✅ Prevents concurrent webhook processing from granting bonus twice
- ✅ Atomic claim with environment scope

### 6. **Additional Security Improvements**
- ✅ CreatedAt/lastVerified timestamps for audit trail
- ✅ Request body size validation
- ✅ Constant-time comparison for HMAC verification

## Database Schema Changes Required

Create a `webhook_events` table for deduplication:

```sql
CREATE TABLE webhook_events (
  id BIGSERIAL PRIMARY KEY,
  stripe_event_id TEXT NOT NULL,
  environment VARCHAR(10) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(stripe_event_id, environment)
);

CREATE INDEX idx_webhook_events_created_at ON webhook_events(created_at);
```

## Configuration Needed

Add to `.gitignore`:
```
.env
.env.production
.env.*.local
```

Update `ALLOWED_RETURN_DOMAINS` in `src/utils/payments.functions.ts` with your actual domains.

## Testing

- Test with invalid priceIds, environment values
- Test with malicious return URLs
- Test webhook deduplication with duplicate events
- Test concurrent welcome bonus granting
