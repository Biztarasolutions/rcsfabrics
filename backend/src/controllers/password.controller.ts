import { Response } from 'express';
import { prisma } from '@/index';
import { AuthRequest, ApiResponse } from '@/types';
import { hashPassword } from '@/utils/auth.util';
import { ApiError } from '@/middleware/errorHandler';
import { sendOTP, generateOTP, shouldExposeOtp } from '@/services/smsService';
import { sendEmail } from '@/utils/email';

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 3;
const GENERIC_SENT = 'If an account exists for these details, a reset code has been sent.';

const findUser = async (identifier: unknown) => {
  if (typeof identifier !== 'string' || !identifier.trim()) {
    throw new ApiError(400, 'Email or phone number is required');
  }
  const id = identifier.trim();
  const compact = id.replace(/\s+/g, '');
  return prisma.user.findFirst({
    where: { OR: [{ email: id.toLowerCase() }, { email: id }, { phone: id }, { phone: compact }] },
  });
};

const respondError = (res: Response, error: unknown, label: string) => {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({ success: false, message: error.message, statusCode: error.statusCode } as ApiResponse);
  } else {
    console.error(`${label}:`, error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.', statusCode: 500 } as ApiResponse);
  }
};

/**
 * POST /api/auth/forgot-password { identifier }
 * Sends a 6-digit reset code by email (and SMS if configured).
 * Always answers the same way so it can't be used to discover accounts.
 */
export const forgotPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await findUser(req.body?.identifier);
    let devOtp: string | undefined;

    if (user) {
      const code = generateOTP();
      const expiresAt = new Date(Date.now() + OTP_TTL_MS);
      await prisma.oTP.upsert({
        where: { userId: user.id },
        update: { code, attempts: 0, isUsed: false, expiresAt, phone: user.phone || '' },
        create: { userId: user.id, phone: user.phone || '', code, attempts: 0, isUsed: false, expiresAt },
      });

      if (user.email) {
        try {
          await sendEmail({
            to: [user.email],
            subject: 'Reset your RCS Fabrics password',
            html: `
              <div style="font-family:sans-serif;padding:20px;max-width:600px;margin:0 auto;border:1px solid #e0e0e0;border-radius:8px">
                <h2 style="text-align:center">Password reset code</h2>
                <p>Hello ${String(user.firstName || '').replace(/[<>&"']/g, '') || 'there'},</p>
                <p>Use this code to reset your password:</p>
                <div style="font-size:32px;font-weight:bold;text-align:center;letter-spacing:5px;margin:30px 0">${code}</div>
                <p style="color:#666;font-size:14px">Valid for 10 minutes. If you didn't ask for this, you can ignore this email.</p>
              </div>`,
          });
        } catch (err) {
          console.error('[Forgot password] email failed:', err);
        }
      }
      if (user.phone) {
        const sms = await sendOTP({ phone: user.phone, code });
        if (!sms.success) console.warn('[Forgot password] SMS not sent:', sms.error);
      }
      if (shouldExposeOtp()) devOtp = code;
    }

    res.json({
      success: true,
      message: GENERIC_SENT,
      data: { expiresIn: OTP_TTL_MS / 1000, ...(devOtp ? { otp: devOtp } : {}) },
      statusCode: 200,
    } as ApiResponse);
  } catch (error) {
    respondError(res, error, 'Forgot password error');
  }
};

/**
 * POST /api/auth/reset-password { identifier, otp, newPassword }
 */
export const resetPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { otp, newPassword } = req.body || {};
    if (typeof otp !== 'string' || !/^\d{6}$/.test(otp)) throw new ApiError(400, 'Enter the 6-digit code');
    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      throw new ApiError(400, 'Password must be at least 8 characters');
    }

    const invalid = new ApiError(400, 'Invalid or expired code. Please request a new one.');
    const user = await findUser(req.body?.identifier);
    if (!user) throw invalid;

    const record = await prisma.oTP.findUnique({ where: { userId: user.id } });
    if (!record || record.isUsed || new Date() > record.expiresAt) throw invalid;
    if (record.attempts >= MAX_ATTEMPTS) {
      throw new ApiError(400, 'Too many wrong codes. Please request a new one.');
    }
    if (record.code !== otp) {
      await prisma.oTP.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
      throw new ApiError(400, 'Incorrect code');
    }

    const hashed = await hashPassword(newPassword);
    await prisma.$transaction([
      prisma.oTP.update({ where: { id: record.id }, data: { isUsed: true } }),
      prisma.user.update({ where: { id: user.id }, data: { password: hashed } }),
    ]);

    res.json({ success: true, message: 'Password updated. You can now sign in.', statusCode: 200 } as ApiResponse);
  } catch (error) {
    respondError(res, error, 'Reset password error');
  }
};
