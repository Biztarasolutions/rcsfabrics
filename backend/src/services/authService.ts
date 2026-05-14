import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'rcs-secret-key-change-in-production';
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

export class AuthService {
  // ── Register ──────────────────────────────────────────────────────────
  async register(data: {
    firstName: string; lastName?: string;
    email: string; password: string; phone?: string;
  }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new Error('Email already registered');

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: hashedPassword,
        phone: data.phone,
        role: 'CUSTOMER',
      },
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true, isVerified: true, createdAt: true },
    });

    const token = this.generateToken(user.id, user.role);
    return { user, token };
  }

  // ── Login ─────────────────────────────────────────────────────────────
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Invalid email or password');

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new Error('Invalid email or password');

    const { password: _, ...userWithoutPassword } = user;
    const token = this.generateToken(user.id, user.role);
    return { user: userWithoutPassword, token };
  }

  // ── Get profile ───────────────────────────────────────────────────────
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, firstName: true, lastName: true,
        email: true, phone: true, role: true,
        isVerified: true, createdAt: true,
        addresses: true,
        _count: { select: { orders: true } },
      },
    });
    if (!user) throw new Error('User not found');
    return user;
  }

  // ── Update profile ────────────────────────────────────────────────────
  async updateProfile(userId: string, data: {
    firstName?: string; lastName?: string; phone?: string;
  }) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, firstName: true, lastName: true, email: true, phone: true, role: true },
    });
  }

  // ── Change password ───────────────────────────────────────────────────
  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) throw new Error('Current password is incorrect');

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    return { message: 'Password changed successfully' };
  }

  // ── Token utils ───────────────────────────────────────────────────────
  generateToken(userId: string, role: string) {
    return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES } as any);
  }

  verifyToken(token: string) {
    return jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
  }
}

export const authService = new AuthService();
