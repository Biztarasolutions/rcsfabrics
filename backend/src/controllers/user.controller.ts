import { Response } from 'express';
import { prisma } from '@/index';
import { AuthRequest, ApiResponse } from '@/types';
import { hashPassword } from '@/utils/auth.util';
import { ApiError } from '@/middleware/errorHandler';


export const updateProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.userId) {
      throw new ApiError(401, 'Unauthorized');
    }

    // Only the name can be changed. Email and phone are fixed to the account.
    const { firstName, lastName } = req.body || {};
    const data: { firstName?: string; lastName?: string } = {};
    if (typeof firstName === 'string') {
      if (!firstName.trim()) throw new ApiError(400, 'First name is required');
      data.firstName = firstName.trim().slice(0, 100);
    }
    if (typeof lastName === 'string') data.lastName = lastName.trim().slice(0, 100);

    const user = await prisma.user.update({
      where: { id: req.userId },
      data,
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
      street,
      city,
      state,
      postalCode,
      country,
      isDefault,
    } = req.body;

    // Email always comes from the logged-in account, not the form
    const account = await prisma.user.findUnique({ where: { id: req.userId }, select: { email: true } });
    if (!account) throw new ApiError(404, 'User not found');

    const address = await prisma.address.create({
      data: {
        userId: req.userId,
        firstName,
        lastName,
        phone,
        email: account.email || '',
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
    // Only these fields may be changed; userId/email are never taken from the request
    const ALLOWED = ['firstName', 'lastName', 'phone', 'street', 'city', 'state', 'postalCode', 'country', 'isDefault'] as const;
    const addressData: Record<string, unknown> = {};
    for (const key of ALLOWED) {
      if (req.body?.[key] !== undefined) addressData[key] = key === 'isDefault' ? Boolean(req.body[key]) : String(req.body[key]).trim();
    }
    const account = await prisma.user.findUnique({ where: { id: req.userId }, select: { email: true } });
    if (account) addressData.email = account.email || '';

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

