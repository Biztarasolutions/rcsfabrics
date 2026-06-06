import { Response } from 'express';
import { prisma } from '@/index';
import { AuthRequest, ApiResponse } from '@/types';
import { generateToken, hashPassword, comparePassword } from '@/utils/auth.util';
import { validateEmail } from '@/utils/string.util';
import { ApiError } from '@/middleware/errorHandler';
import { sendOTP, generateOTP, validateOTPFormat } from '@/services/smsService';

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

    // Validate phone format (basic validation)
    if (!/^\+?[1-9]\d{1,14}$/.test(phone.replace(/\s+/g, ''))) {
      throw new ApiError(400, 'Invalid phone number format');
    }

    // Check if phone already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone },
    });

    if (existingUser) {
      throw new ApiError(400, 'This phone number is already registered');
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Check if OTP already exists for this phone
    const existingOTP = await prisma.oTP.findFirst({
      where: { phone },
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
      // We'll use a special userId format for pre-registration OTPs
      await prisma.oTP.create({
        data: {
          userId: `temp-${phone}-${Date.now()}`,
          phone,
          code: otp,
          attempts: 0,
          isUsed: false,
          expiresAt,
        },
      });
    }

    // Send OTP via SMS
    const smsResult = await sendOTP({ phone, code: otp });

    if (!smsResult.success) {
      throw new ApiError(500, smsResult.error || 'Failed to send OTP');
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        phone,
        expiresIn: 600, // 10 minutes in seconds
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

    // Find OTP record
    const otpRecord = await prisma.oTP.findFirst({
      where: { phone },
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
        phone,
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

    // Check if email already exists
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      throw new ApiError(400, 'User with this email already exists');
    }

    // Check if phone already exists
    const existingUserByPhone = await prisma.user.findUnique({
      where: { phone },
    });

    if (existingUserByPhone) {
      throw new ApiError(400, 'User with this phone number already exists');
    }

    // Verify that OTP was verified for this phone
    const otpRecord = await prisma.oTP.findFirst({
      where: {
        phone,
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
        phone,
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
 * Login with email and password
 */
export const login = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required');
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid email or password');
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
