import { Response } from 'express';
import { prisma } from '@/index';
import { AuthRequest, ApiResponse } from '@/types';
import { generateToken, hashPassword, comparePassword } from '@/utils/auth.util';
import { validateEmail } from '@/utils/string.util';
import { ApiError } from '@/middleware/errorHandler';
import { sendOTP, generateOTP, validateOTPFormat } from '@/services/smsService';
import { sendEmail } from '@/utils/email';

/**
 * Send OTP to phone number
 * Step 1 of registration flow
 */
export const sendPhoneOTP = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { phone } = req.body;

    // Validation
    if (!phone) {
      throw new ApiError(400, 'Phone number is required');
    }

    const normalizedPhone = phone.replace(/\s+/g, '');

    // Validate phone format (basic validation)
    if (!/^\+?[1-9]\d{1,14}$/.test(normalizedPhone)) {
      throw new ApiError(400, 'Invalid phone number format');
    }

    // Check if phone already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    if (existingUser) {
      throw new ApiError(400, 'This phone number is already registered');
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Check if OTP already exists for this phone
    const existingOTP = await prisma.oTP.findFirst({
      where: { phone: normalizedPhone },
    });

    if (existingOTP) {
      // Update existing OTP
      await prisma.oTP.update({
        where: { id: existingOTP.id },
        data: {
          code: otp,
          attempts: 0,
          isUsed: false,
          expiresAt,
        },
      });
    } else {
      // Create new OTP entry (temporary, before user creation)
      await prisma.oTP.create({
        data: {
          phone: normalizedPhone,
          code: otp,
          attempts: 0,
          isUsed: false,
          expiresAt,
        },
      });
    }

    // Send OTP via SMS
    const smsResult = await sendOTP({ phone: normalizedPhone, code: otp });

    if (!smsResult.success) {
      throw new ApiError(500, smsResult.error || 'Failed to send OTP');
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        phone: normalizedPhone,
        expiresIn: 600, // 10 minutes in seconds
        // Return OTP code in response for mock/dev environment to make testing easy
        ...(process.env.SMS_PROVIDER === 'mock' || !process.env.SMS_PROVIDER ? { otp } : {}),
      },
      statusCode: 200,
    } as ApiResponse);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        statusCode: error.statusCode,
      } as ApiResponse);
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        statusCode: 500,
      } as ApiResponse);
    }
  }
};

/**
 * Verify OTP
 * Step 2 of registration flow
 */
export const verifyPhoneOTP = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { phone, code } = req.body;

    // Validation
    if (!phone || !code) {
      throw new ApiError(400, 'Phone number and OTP code are required');
    }

    if (!validateOTPFormat(code)) {
      throw new ApiError(400, 'Invalid OTP format');
    }

    const normalizedPhone = phone.replace(/\s+/g, '');

    // Find OTP record
    const otpRecord = await prisma.oTP.findFirst({
      where: { phone: normalizedPhone },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new ApiError(404, 'OTP not found. Please request a new one.');
    }

    // Check if OTP is expired
    if (new Date() > otpRecord.expiresAt) {
      throw new ApiError(400, 'OTP has expired. Please request a new one.');
    }

    // Check if OTP is already used
    if (otpRecord.isUsed) {
      throw new ApiError(400, 'OTP has already been used');
    }

    // Check attempt limit (max 3 attempts)
    if (otpRecord.attempts >= 3) {
      throw new ApiError(400, 'Maximum OTP attempts exceeded. Please request a new one.');
    }

    // Verify OTP code
    if (otpRecord.code !== code) {
      // Increment attempts
      await prisma.oTP.update({
        where: { id: otpRecord.id },
        data: { attempts: otpRecord.attempts + 1 },
      });
      throw new ApiError(400, 'Invalid OTP code');
    }

    // Mark OTP as used
    await prisma.oTP.update({
      where: { id: otpRecord.id },
      data: { isUsed: true },
    });

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        phone: normalizedPhone,
        verified: true,
      },
      statusCode: 200,
    } as ApiResponse);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        statusCode: error.statusCode,
      } as ApiResponse);
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        statusCode: 500,
      } as ApiResponse);
    }
  }
};

/**
 * Register user (after OTP verification)
 * Step 3 of registration flow
 */
export const register = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    // Validation
    if (!email || !password || !phone) {
      throw new ApiError(400, 'Email, password, and phone number are required');
    }

    if (!validateEmail(email)) {
      throw new ApiError(400, 'Invalid email format');
    }

    if (password.length < 6) {
      throw new ApiError(400, 'Password must be at least 6 characters');
    }

    const normalizedPhone = phone.replace(/\s+/g, '');

    // Check if email already exists
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      throw new ApiError(400, 'User with this email already exists');
    }

    // Check if phone already exists
    const existingUserByPhone = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    if (existingUserByPhone) {
      throw new ApiError(400, 'User with this phone number already exists');
    }

    // Verify that OTP was verified for this phone
    const otpRecord = await prisma.oTP.findFirst({
      where: {
        phone: normalizedPhone,
        isUsed: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new ApiError(400, 'Phone number not verified. Please verify OTP first.');
    }

    // Check if OTP verification is recent (within last 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    if (otpRecord.createdAt < tenMinutesAgo) {
      throw new ApiError(400, 'OTP verification expired. Please verify OTP again.');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user with phone verified
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone: normalizedPhone,
        phoneVerified: true,
      },
    });

    // Update OTP record with actual userId
    await prisma.oTP.update({
      where: { id: otpRecord.id },
      data: { userId: user.id },
    });

    const token = generateToken(user.id, user.email, user.role);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          phoneVerified: user.phoneVerified,
          role: user.role,
        },
        token,
      },
      statusCode: 201,
    } as ApiResponse);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        statusCode: error.statusCode,
      } as ApiResponse);
    } else {
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        statusCode: 500,
      } as ApiResponse);
    }
  }
};

/**
 * Login with email/phone and password/OTP
 */
export const login = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { email, identifier, password, otp } = req.body;
    const loginId = identifier || email;

    if (!loginId) {
      throw new ApiError(400, 'Email or phone number is required');
    }

    const cleanIdentifier = loginId.replace(/\s+/g, '');

    // Find user by email or phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: loginId },
          { phone: loginId },
          { phone: cleanIdentifier }
        ]
      }
    });

    if (!user) {
      throw new ApiError(401, 'Invalid email/phone or credentials');
    }

    if (otp) {
      // Find OTP record
      const otpRecord = await prisma.oTP.findUnique({
        where: { userId: user.id }
      });

      if (!otpRecord) {
        throw new ApiError(404, 'OTP not found. Please request a new one.');
      }

      if (new Date() > otpRecord.expiresAt) {
        throw new ApiError(400, 'OTP has expired. Please request a new one.');
      }

      if (otpRecord.isUsed) {
        throw new ApiError(400, 'OTP has already been used');
      }

      if (otpRecord.attempts >= 3) {
        throw new ApiError(400, 'Maximum OTP attempts exceeded. Please request a new one.');
      }

      if (otpRecord.code !== otp) {
        await prisma.oTP.update({
          where: { id: otpRecord.id },
          data: { attempts: otpRecord.attempts + 1 }
        });
        throw new ApiError(400, 'Invalid OTP code');
      }

      // Mark OTP as used
      await prisma.oTP.update({
        where: { id: otpRecord.id },
        data: { isUsed: true }
      });
    } else if (password) {
      const isPasswordValid = await comparePassword(password, user.password);

      if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid email/phone or password');
      }
    } else {
      throw new ApiError(400, 'Password or OTP is required to sign in');
    }

    const token = generateToken(user.id, user.email, user.role);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
        },
        token,
      },
      statusCode: 200,
    } as ApiResponse);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        statusCode: error.statusCode,
      } as ApiResponse);
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        statusCode: 500,
      } as ApiResponse);
    }
  }
};

/**
 * Send OTP for Login
 */
export const sendLoginOTP = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      throw new ApiError(400, 'Email or phone number is required');
    }

    const cleanIdentifier = identifier.replace(/\s+/g, '');

    // Find user by email or phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier },
          { phone: cleanIdentifier }
        ]
      }
    });

    if (!user) {
      throw new ApiError(404, 'No account found with this email or phone number');
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save or update OTP record
    const existingOTP = await prisma.oTP.findUnique({
      where: { userId: user.id }
    });

    if (existingOTP) {
      await prisma.oTP.update({
        where: { id: existingOTP.id },
        data: {
          code: otp,
          attempts: 0,
          isUsed: false,
          expiresAt,
          phone: user.phone || '',
        }
      });
    } else {
      await prisma.oTP.create({
        data: {
          userId: user.id,
          phone: user.phone || '',
          code: otp,
          attempts: 0,
          isUsed: false,
          expiresAt,
        }
      });
    }

    // Send OTP via SMS (if phone exists) and Email (if email exists)
    if (user.phone) {
      await sendOTP({ phone: user.phone, code: otp });
    }

    if (user.email) {
      try {
        await sendEmail({
          to: [user.email],
          subject: 'Your RCS Fabrics Login OTP',
          html: `
            <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
              <h2 style="color: #4f46e5; text-align: center;">RCS Fabrics Login OTP</h2>
              <p>Hello ${user.firstName || 'User'},</p>
              <p>Your OTP code to login to your account is:</p>
              <div style="font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 5px; margin: 30px 0; color: #1e1b4b;">
                ${otp}
              </div>
              <p style="color: #666; font-size: 14px;">This code is valid for 10 minutes. Please do not share it with anyone.</p>
            </div>
          `
        });
      } catch (err) {
        console.error('Error sending login OTP email:', err);
      }
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        identifier,
        expiresIn: 600,
        // Return OTP in response for mock/dev environment
        ...(process.env.SMS_PROVIDER === 'mock' || !process.env.SMS_PROVIDER ? { otp } : {})
      },
      statusCode: 200,
    } as ApiResponse);

  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        statusCode: error.statusCode,
      } as ApiResponse);
    } else {
      console.error('Send login OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        statusCode: 500,
      } as ApiResponse);
    }
  }
};

export const me = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isVerified: true,
      },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.json({
      success: true,
      message: 'User profile retrieved',
      data: user,
      statusCode: 200,
    } as ApiResponse);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        statusCode: error.statusCode,
      } as ApiResponse);
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        statusCode: 500,
      } as ApiResponse);
    }
  }
};
