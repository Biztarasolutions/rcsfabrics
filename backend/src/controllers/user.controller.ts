import { Response } from 'express';
import { prisma } from '@/index';
import { AuthRequest, ApiResponse } from '@/types';
import { hashPassword } from '@/utils/auth.util';
import { ApiError } from '@/middleware/errorHandler';
import { generateOTP, sendOTP } from '@/services/smsService';
import { sendEmail } from '@/utils/email';

// In-memory store for pending contact-change OTPs (10-min TTL, single-server ok)
const pendingContactOTPs = new Map<string, {
  field: 'email' | 'phone';
  newValue: string;
  code: string;
  expiresAt: number;
}>();

export const updateProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const { firstName, lastName, phone } = req.body;

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        firstName,
        lastName,
        phone,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
      },
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
      statusCode: 200,
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      statusCode: 500,
    } as ApiResponse);
  }
};

export const changePassword = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new ApiError(400, 'Current and new passwords are required');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // In production, verify current password
    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashedPassword },
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
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

export const getAddresses = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const addresses = await prisma.address.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      message: 'Addresses retrieved',
      data: addresses,
      statusCode: 200,
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      statusCode: 500,
    } as ApiResponse);
  }
};

export const addAddress = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const {
      firstName,
      lastName,
      phone,
      email,
      street,
      city,
      state,
      postalCode,
      country,
      isDefault,
    } = req.body;

    const address = await prisma.address.create({
      data: {
        userId: req.userId,
        firstName,
        lastName,
        phone,
        email,
        street,
        city,
        state,
        postalCode,
        country,
        isDefault: isDefault || false,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: address,
      statusCode: 201,
    } as ApiResponse);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      statusCode: 500,
    } as ApiResponse);
  }
};

export const updateAddress = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const { id } = req.params;
    const addressData = req.body;

    const address = await prisma.address.findUnique({
      where: { id },
    });

    if (!address || address.userId !== req.userId) {
      throw new ApiError(404, 'Address not found');
    }

    const updated = await prisma.address.update({
      where: { id },
      data: addressData,
    });

    res.json({
      success: true,
      message: 'Address updated successfully',
      data: updated,
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

export const deleteAddress = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    const { id } = req.params;

    const address = await prisma.address.findUnique({
      where: { id },
    });

    if (!address || address.userId !== req.userId) {
      throw new ApiError(404, 'Address not found');
    }

    await prisma.address.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Address deleted successfully',
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


export const getUserReviews = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) throw new ApiError(401, 'Unauthorized');
    const reviews = await prisma.review.findMany({
      where: { userId: req.userId },
      select: { productId: true, rating: true, comment: true, createdAt: true },
    });
    res.json({ success: true, data: reviews, statusCode: 200 } as ApiResponse);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ success: false, message: error.message, statusCode: error.statusCode } as ApiResponse);
    } else {
      res.status(500).json({ success: false, message: 'Internal server error', statusCode: 500 } as ApiResponse);
    }
  }
};

export const requestContactOTP = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) throw new ApiError(401, 'Unauthorized');
    const { field, newValue } = req.body;
    if (!field || !newValue) throw new ApiError(400, 'field and newValue are required');
    if (field !== 'email' && field !== 'phone') throw new ApiError(400, 'field must be email or phone');

    const existing = await prisma.user.findFirst({
      where: { [field]: newValue, NOT: { id: req.userId } },
      select: { id: true },
    });
    if (existing) {
      throw new ApiError(409, `This ${field} is already in use by another account`);
    }

    const code = generateOTP();
    pendingContactOTPs.set(req.userId, {
      field,
      newValue,
      code,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    if (field === 'email') {
      await sendEmail({
        to: [newValue],
        subject: 'Verify your new email — RCS Fabrics',
        html: `<p>Your OTP to update your email address is: <strong>${code}</strong></p><p>It expires in 10 minutes.</p>`,
      });
    } else {
      const result = await sendOTP({ phone: newValue, code });
      if (!result.success) throw new ApiError(500, result.error || 'Failed to send OTP');
    }

    res.json({
      success: true,
      message: `OTP sent to your new ${field}`,
      statusCode: 200,
      ...(process.env.SMS_PROVIDER === 'mock' || !process.env.SMS_PROVIDER ? { otp: code } : {}),
    } as ApiResponse);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ success: false, message: error.message, statusCode: error.statusCode } as ApiResponse);
    } else {
      res.status(500).json({ success: false, message: 'Internal server error', statusCode: 500 } as ApiResponse);
    }
  }
};

export const verifyContactOTP = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) throw new ApiError(401, 'Unauthorized');
    const { field, newValue, code } = req.body;
    if (!field || !newValue || !code) throw new ApiError(400, 'field, newValue and code are required');

    const pending = pendingContactOTPs.get(req.userId);
    if (!pending) throw new ApiError(400, 'No pending change request. Please request a new OTP.');
    if (pending.field !== field || pending.newValue !== newValue) throw new ApiError(400, 'OTP does not match the requested change');
    if (Date.now() > pending.expiresAt) {
      pendingContactOTPs.delete(req.userId);
      throw new ApiError(400, 'OTP has expired. Please request a new one.');
    }
    if (pending.code !== code) throw new ApiError(400, 'Incorrect OTP. Please try again.');

    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: { [field]: newValue },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true },
    });

    pendingContactOTPs.delete(req.userId);

    res.json({ success: true, message: `${field === 'email' ? 'Email' : 'Phone'} updated successfully`, data: updated, statusCode: 200 } as ApiResponse);
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ success: false, message: error.message, statusCode: error.statusCode } as ApiResponse);
    } else {
      res.status(500).json({ success: false, message: 'Internal server error', statusCode: 500 } as ApiResponse);
    }
  }
};
