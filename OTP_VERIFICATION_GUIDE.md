# OTP Phone Verification - Implementation Guide

## Overview

The registration flow has been enhanced to include Phone Number + OTP verification before account creation. This ensures genuine registrations and reduces fake accounts.

## Architecture

### Backend Components

#### 1. **Database Schema Changes**
- **New OTP Model**: Stores OTP data with phone number, code, expiration, and attempt tracking
- **User Model Updates**:
  - `phone`: Now unique constraint
  - `phoneVerified`: Boolean flag to track phone verification status

#### 2. **SMS Service** (`backend/src/services/smsService.ts`)
Provides utilities for OTP management:
- `generateOTP()`: Generates a random 6-digit OTP
- `sendOTP()`: Sends OTP to phone (currently mock, can be integrated with Twilio/AWS SNS)
- `validateOTPFormat()`: Validates OTP format

**Current Implementation**: Mock SMS service (logs to console)

**To Integrate Real SMS Provider**:
```typescript
// Example: Twilio Integration
import twilio from 'twilio';
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const message = await client.messages.create({
  body: `Your OTP is: ${data.code}. Valid for 10 minutes.`,
  from: process.env.TWILIO_PHONE_NUMBER,
  to: data.phone
});
```

#### 3. **Auth Endpoints**

**POST `/api/auth/send-otp`**
- Request:
  ```json
  {
    "phone": "+1234567890"
  }
  ```
- Response:
  ```json
  {
    "success": true,
    "message": "OTP sent successfully",
    "data": {
      "phone": "+1234567890",
      "expiresIn": 600
    }
  }
  ```
- Validation:
  - Phone number format (E.164 format)
  - Phone number uniqueness (must not exist in users table)

**POST `/api/auth/verify-otp`**
- Request:
  ```json
  {
    "phone": "+1234567890",
    "code": "123456"
  }
  ```
- Response:
  ```json
  {
    "success": true,
    "message": "OTP verified successfully",
    "data": {
      "phone": "+1234567890",
      "verified": true
    }
  }
  ```
- Features:
  - OTP expiration check (10 minutes)
  - Attempt limit (max 3 attempts)
  - One-time use enforcement

**POST `/api/auth/register`** (Updated)
- Request:
  ```json
  {
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "password": "securePassword123"
  }
  ```
- Requirements:
  - OTP must be verified first
  - Verification must be within 10 minutes of request
  - Email and phone must be unique
  - Password minimum 6 characters

### Frontend Components

#### 1. **Enhanced Registration Page** (`frontend/app/auth/page.tsx`)

Three-step registration flow:

**Step 1: Details**
- Collects: First Name, Last Name, Email, Phone, Password, Confirm Password
- Validates: Email format, phone format, password match
- Action: Request OTP button

**Step 2: OTP Verification**
- Displays: 6-digit OTP input field
- Features:
  - Numeric input only
  - Resend OTP option (after 30 seconds)
  - Max 3 attempts
  - Phone number confirmation
- Action: Verify OTP button

**Step 3: Confirmation**
- Shows: Green checkmark, phone verified message
- Displays: Summary of user information
- Features:
  - Edit information button (goes back to Step 1)
  - Create Account button (enabled only after verification)

#### 2. **API Integration** (`frontend/lib/api.ts`)

Added new methods to `authApi`:
```typescript
authApi.sendOTP(data)        // Send OTP to phone
authApi.verifyOTP(data)      // Verify OTP code
authApi.register(data)       // Create account (after OTP verified)
```

## Registration Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: USER ENTERS REGISTRATION DETAILS                    │
├─────────────────────────────────────────────────────────────┤
│ • First Name & Last Name                                    │
│ • Email Address (must be unique)                            │
│ • Phone Number (must be unique, E.164 format)              │
│ • Password & Confirm Password                              │
│ ✓ Validate all fields locally                              │
│ ✓ Check password match                                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: REQUEST OTP                                         │
├─────────────────────────────────────────────────────────────┤
│ POST /api/auth/send-otp                                    │
│ • Generate 6-digit OTP                                      │
│ • Save to database (10 minute expiration)                  │
│ • Send via SMS (mock or real provider)                     │
│ Response: "OTP sent successfully"                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: VERIFY OTP                                          │
├─────────────────────────────────────────────────────────────┤
│ • User enters 6-digit OTP                                   │
│ • Show resend option after 30 seconds                      │
│ POST /api/auth/verify-otp                                  │
│ • Check OTP validity (format, expiration)                  │
│ • Check attempt limit (max 3)                              │
│ • Mark as used on success                                  │
│ ✓ Phone Verified (green checkmark)                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: CREATE ACCOUNT                                      │
├─────────────────────────────────────────────────────────────┤
│ POST /api/auth/register                                    │
│ • Verify OTP was verified                                  │
│ • Check verification is recent (< 10 min)                  │
│ • Create user with phoneVerified = true                    │
│ • Return JWT token                                          │
│ ✓ Account created, user logged in                          │
└─────────────────────────────────────────────────────────────┘
```

## Validation Rules

### Phone Number
- Format: E.164 (+1234567890) or local (1234567890)
- Uniqueness: Must not exist in database
- Required for registration

### OTP
- Format: 6 digits (000000-999999)
- Expiration: 10 minutes
- Attempts: Maximum 3 failed attempts
- Single use: Can only be used once

### Password
- Minimum: 6 characters
- Must match confirmation field
- Required for account creation

### Email
- Must be valid format
- Must be unique in database
- Required for account creation

## Error Handling

| Error | Status | Message |
|-------|--------|---------|
| Invalid phone format | 400 | Invalid phone number format |
| Phone already registered | 400 | This phone number is already registered |
| OTP not sent | 500 | Failed to send OTP. Please try again. |
| OTP expired | 400 | OTP has expired. Please request a new one. |
| OTP invalid | 400 | Invalid OTP code |
| Max attempts exceeded | 400 | Maximum OTP attempts exceeded. Please request a new one. |
| OTP not verified | 400 | Phone number not verified. Please verify OTP first. |
| Email already exists | 400 | User with this email already exists |
| Phone already exists | 400 | User with this phone number already exists |

## Security Features

1. **OTP Expiration**: 10-minute validity window
2. **Attempt Limiting**: Maximum 3 failed verification attempts
3. **One-Time Use**: OTP can only be used once
4. **Phone Validation**: E.164 format required
5. **Uniqueness Constraints**:
   - Email unique at registration
   - Phone unique at registration
6. **Recent Verification**: Account creation only within 10 minutes of OTP verification
7. **Password Hashing**: Bcrypt with salt rounds

## Testing the Feature

### Local Development (Mock SMS)

1. **Frontend**:
   - Navigate to `/auth` page
   - Click "Sign up"
   - Fill in all registration details
   - Click "Request OTP"

2. **Backend**:
   - Check console logs for generated OTP
   - OTP format: 6 digits
   - Expiration: 10 minutes from request

3. **Verification**:
   - Enter OTP from console into form
   - Click "Verify OTP"
   - Proceed to account creation

### With Real SMS Provider

1. **Install Provider SDK**:
   ```bash
   npm install twilio
   ```

2. **Set Environment Variables**:
   ```
   SMS_PROVIDER=twilio
   TWILIO_ACCOUNT_SID=your_sid
   TWILIO_AUTH_TOKEN=your_token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

3. **Update SMS Service**:
   - Uncomment Twilio code in `smsService.ts`
   - Implement provider integration

4. **Test**:
   - OTP will be sent to actual phone number
   - Verify from SMS received on device

## Database Migration

Run migration to add OTP table and update User model:

```bash
cd backend
npx prisma migrate deploy
```

This will:
- Add `phoneVerified` column to users table
- Add unique constraint on phone column
- Create otps table with indexes
- Set up foreign key relationship

## Configuration

### Environment Variables

Add to `.env` files:

**Frontend** (`.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**Backend** (`.env`):
```
# SMS Configuration
SMS_PROVIDER=mock
# TWILIO_ACCOUNT_SID=your_sid
# TWILIO_AUTH_TOKEN=your_token
# TWILIO_PHONE_NUMBER=+1234567890
```

## Future Enhancements

1. **SMS Providers**:
   - Integrate Twilio
   - Integrate AWS SNS
   - Integrate Firebase Cloud Messaging

2. **Additional Verification**:
   - Email verification as alternative
   - Backup verification methods
   - Multi-factor authentication

3. **OTP Management**:
   - OTP templates/customization
   - Bulk OTP sending
   - OTP analytics

4. **User Experience**:
   - WhatsApp OTP delivery
   - Biometric verification
   - Auto-fill OTP from SMS

## Code References

### Backend Files
- [Auth Controller](../backend/src/controllers/auth.controller.ts) - OTP endpoints
- [SMS Service](../backend/src/services/smsService.ts) - OTP generation and sending
- [Auth Routes](../backend/src/routes/auth.routes.ts) - Route definitions
- [Prisma Schema](../backend/prisma/schema.prisma) - OTP and User models
- [Database Migration](../backend/prisma/migrations/20260607120000_add_otp_verification/) - Schema changes

### Frontend Files
- [Auth Page](../frontend/app/auth/page.tsx) - Registration flow UI
- [API Utils](../frontend/lib/api.ts) - OTP API methods

## Troubleshooting

### OTP Not Sending
- Check SMS provider configuration
- Verify phone number format (should be E.164)
- Check API rate limits
- Review backend logs for errors

### OTP Verification Fails
- Ensure OTP hasn't expired (10 minute window)
- Confirm correct OTP code entered
- Check attempt count (max 3)
- Verify phone number matches original request

### Account Creation Fails
- Ensure OTP was verified
- Check verification is within 10 minutes
- Verify email and phone are not already in database
- Check all required fields are provided

## Support

For issues or questions:
1. Check backend logs for error messages
2. Verify all environment variables are set
3. Check database connectivity
4. Review frontend console for API errors
5. Test API endpoints directly with Postman/cURL
