# OTP Verification Feature - Testing Guide

## Quick Start - Local Testing

### Prerequisites
- Backend running on `http://localhost:5000`
- Frontend running on `http://localhost:3000`
- PostgreSQL database connected and migrated
- Node.js and npm installed

### Step 1: Run Database Migration

```bash
cd backend
npx prisma migrate deploy
```

Expected output:
```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database...
Migration 20260607120000_add_otp_verification has been applied
```

### Step 2: Start Backend

```bash
cd backend
npm run dev
```

Should see:
```
Server running on port 5000
```

### Step 3: Start Frontend

```bash
cd frontend
npm run dev
```

Should see:
```
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
```

## Manual Testing Flow

### Test Case 1: Complete Registration with OTP

**Objective**: Test the complete registration flow from details to account creation

**Steps**:
1. Navigate to `http://localhost:3000/auth`
2. Click "Sign up" to switch to registration mode
3. Fill in the registration form:
   - First Name: `John`
   - Last Name: `Doe`
   - Email: `john.doe+${timestamp}@example.com`
   - Phone: `+12345678900` (must be valid E.164 format)
   - Password: `Password123`
   - Confirm Password: `Password123`
4. Click "Request OTP"
5. **Expected**:
   - Button changes to "Sending OTP..."
   - After 1-2 seconds: Toast "OTP sent successfully"
   - Form switches to OTP verification step
   - Timer shows "Resend OTP in 30s"
   - Check backend logs: Should see `[SMS OTP] Sending OTP to +12345678900` and `[SMS OTP] Code: XXXXXX`

6. Copy the OTP code from backend console logs
7. Enter the 6-digit OTP in the input field
8. Click "Verify OTP"
9. **Expected**:
   - Button changes to "Verifying..."
   - After validation: Toast "OTP verified successfully"
   - Form switches to confirmation step
   - Green checkmark appears with "Phone verified!"
   - User information summary is displayed

10. Click "Create Account"
11. **Expected**:
    - Button changes to "Creating account..."
    - After 1-2 seconds: User redirected to home page
    - Toast "Account created successfully!"
    - User is now logged in (token in localStorage)

### Test Case 2: Invalid OTP

**Objective**: Verify error handling for invalid OTP

**Steps**:
1. Complete Steps 1-5 from Test Case 1
2. Enter wrong OTP (e.g., `000000`)
3. Click "Verify OTP"
4. **Expected**:
   - Toast "Invalid OTP code"
   - Error message shown
   - OTP input field clears
   - Can retry (attempts: 1/3)

5. Try 2 more wrong OTPs
6. On 4th attempt (exceeds max 3):
7. **Expected**:
   - Toast "Maximum OTP attempts exceeded. Please request a new one."
   - "Resend OTP" button becomes clickable
   - Can request new OTP

### Test Case 3: Expired OTP

**Objective**: Verify OTP expiration (10 minutes)

**Steps**:
1. Complete Steps 1-5 from Test Case 1
2. Wait 10 minutes (or modify test by checking database for OTP expiration)
3. Try to verify OTP
4. **Expected**:
   - Toast "OTP has expired. Please request a new one."
   - "Resend OTP" button is available

### Test Case 4: Phone Number Uniqueness

**Objective**: Ensure duplicate phone numbers are rejected

**Steps**:
1. Complete Test Case 1 successfully (account created)
2. Navigate to `/auth` again
3. Try to sign up with same phone number (+12345678900)
4. Click "Request OTP"
5. **Expected**:
   - Toast "This phone number is already registered"
   - OTP not sent
   - No step progression

### Test Case 5: Email Uniqueness

**Objective**: Ensure duplicate emails are rejected

**Steps**:
1. Create account with email `test@example.com` in Test Case 1
2. Navigate to `/auth` again
3. Try to sign up with same email but different phone
4. Click "Request OTP" and verify OTP successfully
5. Click "Create Account"
6. **Expected**:
   - Toast "User with this email already exists"
   - Account not created
   - Still logged out

### Test Case 6: Form Validation

**Objective**: Test input validation before OTP request

**Steps**:

**Sub-test 6a - Missing Fields**:
1. Leave First Name empty
2. Click "Request OTP"
3. **Expected**: Toast "Please enter your first and last name"

**Sub-test 6b - Invalid Email**:
1. Enter `invalidemail`
2. Click "Request OTP"
3. **Expected**: Toast "Please enter a valid email"

**Sub-test 6c - Invalid Phone Format**:
1. Enter `12345` (too short)
2. Click "Request OTP"
3. **Expected**: Toast "Please enter a valid phone number"

**Sub-test 6d - Password Mismatch**:
1. Password: `Pass123`
2. Confirm: `Pass456`
3. Click "Request OTP"
4. **Expected**: Toast "Passwords do not match"

**Sub-test 6e - Password Too Short**:
1. Password: `Pass1` (less than 6 chars)
2. Confirm: `Pass1`
3. Click "Request OTP"
4. **Expected**: Toast "Password must be at least 6 characters"

### Test Case 7: Resend OTP

**Objective**: Verify resend OTP functionality

**Steps**:
1. Complete Steps 1-5 from Test Case 1
2. Wait for "Resend OTP in 30s" to count down
3. Wait 30 seconds
4. **Expected**: "Resend OTP" button becomes clickable

5. Click "Resend OTP"
6. **Expected**:
   - Toast "OTP sent successfully"
   - Timer resets to "Resend OTP in 30s"
   - New OTP generated (check backend logs)
   - Old OTP is no longer valid

7. Verify with new OTP code

### Test Case 8: Back Navigation

**Objective**: Verify ability to go back during registration

**Steps**:
1. Complete Steps 1-5 from Test Case 1
2. Click "← Back to Details"
3. **Expected**:
   - Form returns to details step
   - OTP input clears
   - Can modify details and request new OTP

4. Modify phone number
5. Click "Request OTP"
6. **Expected**: New OTP is generated for new phone number

### Test Case 9: Edit Information

**Objective**: Verify editing capability at confirmation step

**Steps**:
1. Complete Steps 1-9 from Test Case 1
2. Click "← Edit Information"
3. **Expected**:
   - Form returns to details step
   - All details are preserved
   - Phone is no longer marked as verified

4. Modify first name
5. Complete verification again with new OTP
6. Click "Create Account"
7. **Expected**: New account created with modified information

## API Testing with cURL/Postman

### Test: Send OTP

```bash
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+12345678900"
  }'
```

**Expected Response** (201):
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "phone": "+12345678900",
    "expiresIn": 600
  },
  "statusCode": 200
}
```

### Test: Verify OTP

```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+12345678900",
    "code": "123456"
  }'
```

**Expected Response** (200):
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "phone": "+12345678900",
    "verified": true
  },
  "statusCode": 200
}
```

### Test: Register User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "+12345678900",
    "password": "Password123"
  }'
```

**Expected Response** (201):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "cuid_xxx",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+12345678900",
      "phoneVerified": true,
      "role": "CUSTOMER"
    },
    "token": "jwt_token_xxx"
  },
  "statusCode": 201
}
```

## Database Verification

### Check OTP Records

```sql
-- View all OTP records
SELECT id, phone, code, attempts, isUsed, expiresAt, createdAt FROM otps ORDER BY createdAt DESC LIMIT 10;

-- Check for a specific phone
SELECT * FROM otps WHERE phone = '+12345678900' ORDER BY createdAt DESC;
```

### Check User Records

```sql
-- View recently created users
SELECT id, email, phone, phoneVerified, createdAt FROM users ORDER BY createdAt DESC LIMIT 10;

-- Verify phone field is unique
SELECT phone, COUNT(*) as count FROM users WHERE phone IS NOT NULL GROUP BY phone HAVING COUNT(*) > 1;
```

## Performance Testing

### Load Test OTP Generation
```bash
for i in {1..100}; do
  curl -X POST http://localhost:5000/api/auth/send-otp \
    -H "Content-Type: application/json" \
    -d "{\"phone\": \"+123456789${i}\"}" &
done
wait
```

**Expected**: All requests succeed, OTPs generated for different phone numbers

## Troubleshooting

### Issue: OTP not appearing in logs

**Solution**:
- Check backend terminal for SMS OTP logs
- Ensure backend is running in foreground (not background)
- Check `src/services/smsService.ts` has console.log enabled
- Verify NODE_ENV is 'development'

### Issue: "Phone already registered" on first signup

**Solution**:
- Check if phone exists in database:
  ```sql
  SELECT * FROM users WHERE phone = 'YOUR_PHONE';
  ```
- Use different phone number or delete user record

### Issue: OTP verification fails with valid code

**Solution**:
- Check OTP hasn't expired (10 minute window)
- Verify code matches exactly (copy from logs)
- Check attempts count (max 3)
- Ensure OTP hasn't been used already

### Issue: Account creation fails after OTP verification

**Solution**:
- Check email is unique:
  ```sql
  SELECT * FROM users WHERE email = 'YOUR_EMAIL';
  ```
- Ensure OTP verification was within last 10 minutes
- Check all required fields are filled

## Checklist for Manual Testing

- [ ] Successfully register with valid OTP
- [ ] OTP expires after 10 minutes
- [ ] Can't exceed 3 OTP attempts
- [ ] Phone number uniqueness enforced
- [ ] Email uniqueness enforced
- [ ] Password validation works
- [ ] Can resend OTP after 30 seconds
- [ ] Can go back and edit information
- [ ] Account created with phoneVerified = true
- [ ] User logged in after account creation
- [ ] Token stored in localStorage
- [ ] Mobile layout is responsive
- [ ] Error messages are clear and helpful
- [ ] Loading states show properly
- [ ] Green checkmark appears on verification
- [ ] Can login with created account

## Notes

- All timestamps are UTC
- OTP codes are 6 digits (000000-999999)
- Phone format required: E.164 (+countrycode + number)
- SMS is mocked by default (logs to console)
- Database must be migrated before testing
- Clear browser localStorage between tests if needed
- Check browser console for any JavaScript errors

---

For more details, see [OTP_VERIFICATION_GUIDE.md](./OTP_VERIFICATION_GUIDE.md)
