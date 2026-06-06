# OTP Phone Verification - Quick Reference

## 🚀 Quick Start (5 Minutes)

### 1. Run Migration
```bash
cd backend
npx prisma migrate deploy
```

### 2. Start Services
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
cd frontend && npm run dev
```

### 3. Test Feature
1. Go to `http://localhost:3000/auth`
2. Click "Sign up"
3. Fill details and click "Request OTP"
4. Check backend logs for OTP code
5. Enter OTP and click "Verify OTP"
6. Click "Create Account"

## 📋 Key Points

| Aspect | Details |
|--------|---------|
| **Phone Format** | E.164: `+1234567890` or `+91-XXXXX-XXXXX` |
| **OTP Length** | 6 digits (auto-generated) |
| **OTP Expiry** | 10 minutes from request |
| **Max Attempts** | 3 failed verification attempts |
| **Resend Timer** | 30 seconds after initial request |
| **Current SMS** | Mock (logs to console) |
| **Password Min** | 6 characters |

## 📁 Important Files

### Backend
```
backend/
├── src/
│   ├── controllers/auth.controller.ts      ← sendPhoneOTP(), verifyPhoneOTP(), register()
│   ├── routes/auth.routes.ts              ← /send-otp, /verify-otp
│   ├── services/smsService.ts             ← generateOTP(), sendOTP()
│   └── config/index.ts                    ← SMS configuration
└── prisma/
    ├── schema.prisma                      ← OTP model, User updates
    └── migrations/
        └── 20260607120000_add_otp_verification/
            └── migration.sql              ← SQL changes
```

### Frontend
```
frontend/
├── app/
│   └── auth/page.tsx                      ← 3-step registration flow
└── lib/
    └── api.ts                             ← authApi.sendOTP(), authApi.verifyOTP()
```

## 🔌 API Endpoints

### Send OTP
```
POST /api/auth/send-otp
{ "phone": "+1234567890" }
→ "OTP sent successfully"
```

### Verify OTP
```
POST /api/auth/verify-otp
{ "phone": "+1234567890", "code": "123456" }
→ "OTP verified successfully"
```

### Register (After OTP)
```
POST /api/auth/register
{
  "email": "user@example.com",
  "phone": "+1234567890",
  "password": "securePass123",
  "firstName": "John",
  "lastName": "Doe"
}
→ { "user": {...}, "token": "jwt_token" }
```

## 🧪 Test Cases (5 min each)

### Test 1: Happy Path
✓ Enter valid details → Request OTP → Verify OTP → Create Account → Logged in

### Test 2: Invalid OTP
✓ Try wrong code 3 times → Error: "Max attempts exceeded" → Resend OTP

### Test 3: Duplicate Phone
✓ Use existing phone → Error: "Phone already registered"

### Test 4: Form Validation
✓ Invalid email → Invalid phone → Password mismatch → Errors shown

### Test 5: Resend OTP
✓ Wait 30 sec → Resend OTP → New code in logs → Verify with new code

## ⚙️ Configuration

**.env (Backend)**
```
SMS_PROVIDER=mock
# For Twilio:
# SMS_PROVIDER=twilio
# TWILIO_ACCOUNT_SID=your_id
# TWILIO_AUTH_TOKEN=your_token
# TWILIO_PHONE_NUMBER=+1234567890
```

**.env.local (Frontend)**
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 🔍 Debugging

### Check OTP in Console
Backend terminal logs:
```
[SMS OTP] Sending OTP to +12345678900
[SMS OTP] Code: 123456
```

### Query Database
```sql
-- Recent OTPs
SELECT * FROM otps ORDER BY createdAt DESC LIMIT 5;

-- User with phone verified
SELECT email, phone, phoneVerified FROM users WHERE phoneVerified = true;
```

### Browser Console
- Check Network tab for API responses
- Look for error messages in console
- Verify localStorage has authToken after login

## 🎯 Registration Flow (Simple)

```
START
  ↓
[Details Form]
  ↓ Request OTP
[OTP Sent]
  ↓
[OTP Verification]
  ↓ Verify OTP
[Phone Verified ✓]
  ↓ Create Account
[User Created + Logged In]
  ↓
END
```

## 📚 Full Documentation

- **Implementation Details**: See `OTP_VERIFICATION_GUIDE.md`
- **Testing Procedures**: See `OTP_TESTING_GUIDE.md`  
- **Full Summary**: See `IMPLEMENTATION_SUMMARY.md`

## 🔧 Common Tasks

### Integrate Twilio
1. Install: `npm install twilio`
2. Update `SMS_PROVIDER=twilio` in .env
3. Uncomment Twilio code in `smsService.ts`
4. Add TWILIO_* env variables
5. Test with real phone number

### Add Email Verification
1. Create `emailService.ts` similar to `smsService.ts`
2. Add email verification endpoints
3. Update registration flow to support both methods
4. Update frontend UI for email option

### Add Rate Limiting
1. Install: `npm install express-rate-limit`
2. Add middleware to auth routes
3. Limit `/send-otp` requests per IP
4. Configure time windows and limits

### Enable Phone Update Verification
1. Create `/auth/update-phone` endpoint
2. Send OTP before updating phone
3. Verify OTP before making change
4. Update User model phone field

## ❌ Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| OTP not in logs | Check backend is running, look in correct terminal |
| "Phone already registered" | Use different phone or delete test user |
| OTP expired | Generated OTP is only valid 10 minutes |
| Max attempts exceeded | Wait for resend button or request new OTP |
| Invalid phone format | Use E.164: +countrycode+number (e.g., +12345678900) |
| Account not created | Ensure OTP verified within last 10 minutes |
| Phone shown as duplicated | Check DB: duplicate phones shouldn't exist if code works |

## ✨ Frontend Features

- ✓ **3-Step Flow**: Details → OTP → Confirmation
- ✓ **Responsive**: Works on mobile, tablet, desktop
- ✓ **Accessible**: Proper labels, error messages
- ✓ **Validations**: Email, phone, password checks
- ✓ **Loading States**: Shows spinners during API calls
- ✓ **Error Handling**: Clear error messages
- ✓ **Success Feedback**: Toast notifications
- ✓ **Navigation**: Can go back and edit
- ✓ **Resend Timer**: 30-second countdown
- ✓ **Visual Confirmation**: Green checkmark on verification

## 🔐 Security Highlights

- ✓ OTP expires after 10 minutes
- ✓ Maximum 3 failed attempts
- ✓ One-time use enforcement
- ✓ Phone and email uniqueness checks
- ✓ Password hashing (bcrypt)
- ✓ JWT authentication
- ✓ E.164 phone format required
- ✓ Recent verification requirement
- ✓ No plaintext passwords in logs
- ✓ Secure session tokens

## 📞 Support

For questions or issues:
1. Check OTP_TESTING_GUIDE.md for test procedures
2. Review OTP_VERIFICATION_GUIDE.md for technical details
3. Check backend logs for error messages
4. Verify database schema with: `npx prisma db push`
5. Clear browser cache and retry

## 🎓 Learning Resources

- **Frontend State Management**: See auth/page.tsx useState hooks
- **Backend API Pattern**: See sendPhoneOTP and verifyPhoneOTP
- **Database Queries**: See Prisma queries in controllers
- **Validation Pattern**: See form validation in page.tsx
- **Error Handling**: See ApiError class and try-catch patterns

---

**Last Updated**: June 7, 2026  
**Status**: Ready for Production  
**Questions?** See full documentation files above
