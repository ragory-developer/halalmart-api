import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import prisma from '../config/database';
import { ConflictError, ForbiddenError, TooManyRequestsError, UnauthorizedError } from '../utils/errors';
import { sendGlobalSms } from '../utils/sms';

export class AuthService {
  /** Register a new user */
  async register(data: { email: string; password: string; name: string; phone?: string }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    
    let user;
    if (data.phone) {
      const existingPhone = await prisma.user.findUnique({ where: { phone: data.phone } });
      if (existingPhone) {
        if (!existingPhone.isGuest) {
          throw new ConflictError('Phone number already registered');
        } else {
          // Upgrade the existing guest account
          user = await prisma.user.update({
            where: { id: existingPhone.id },
            data: {
              email: data.email,
              password: hashedPassword,
              name: data.name,
              isGuest: false,
            },
            select: { id: true, email: true, name: true, role: true, permissions: true },
          });
        }
      }
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          name: data.name,
          phone: data.phone,
        },
        select: { id: true, email: true, name: true, role: true, permissions: true },
      });
      // Create an empty cart for the new user
      await prisma.cart.create({ data: { userId: user.id } });
    }

    const tokens = this.generateTokens(user.id, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return { user, ...tokens };
  }

  /** Setup first super admin */
  async setupSuperAdmin(data: { email: string; password: string; name: string; adminAccessKey: string }) {
    const superAdminCount = await prisma.user.count({ where: { role: 'SUPER_ADMIN' } });
    if (superAdminCount > 0) {
      throw new ForbiddenError('A super admin already exists. This route is disabled.');
    }

    if (data.adminAccessKey !== config.adminAccessKey) {
      throw new UnauthorizedError('Invalid admin access key');
    }

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    
    // Create the admin user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: 'SUPER_ADMIN',
        isGuest: false,
      },
      select: { id: true, email: true, name: true, role: true, permissions: true },
    });

    const tokens = this.generateTokens(user.id, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return { user, ...tokens };
  }

  /**
   * Complete registration — called after OTP verification.
   * Upgrades the OTP-created guest stub to a full user account.
   */
  async completeRegistration(data: { phone: string; name: string; email?: string; password: string }) {
    // Find the stub user created during OTP verification
    const stub = await prisma.user.findUnique({ where: { phone: data.phone } });
    if (!stub) {
      throw new UnauthorizedError('Phone number not verified. Please start over.');
    }

    // Check if email is already in use by a DIFFERENT account
    if (data.email) {
      const emailUser = await prisma.user.findUnique({ where: { email: data.email } });
      if (emailUser && emailUser.id !== stub.id) {
        throw new ConflictError('Email address is already registered with another account.');
      }
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.update({
      where: { id: stub.id },
      data: {
        name: data.name,
        email: data.email || null,
        password: hashedPassword,
        isGuest: false,
      },
    });

    const tokens = this.generateTokens(user.id, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        isGuest: user.isGuest,
        permissions: user.permissions ? JSON.parse(user.permissions) : [],
      },
      ...tokens,
    };
  }

  /** Login with email and password */
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      throw new UnauthorizedError('Invalid login credentials');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const tokens = this.generateTokens(user.id, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        isGuest: user.isGuest,
        permissions: user.permissions ? JSON.parse(user.permissions) : [],
      },
      ...tokens,
    };
  }

  /** Login with phone number and password */
  async loginWithPhone(phone: string, password: string) {
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user || !user.password) {
      throw new UnauthorizedError('Invalid phone number or password');
    }
    if (user.isGuest) {
      throw new UnauthorizedError('This number has no registered account. Please sign up first.');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedError('Invalid phone number or password');
    }

    const tokens = this.generateTokens(user.id, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        isGuest: user.isGuest,
        permissions: user.permissions ? JSON.parse(user.permissions) : [],
      },
      ...tokens,
    };
  }

  /** Refresh access token using a valid refresh token */
  async refresh(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as { userId: string; role: string };
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      const tokens = this.generateTokens(user.id, user.role);
      await this.saveRefreshToken(user.id, tokens.refreshToken);

      return tokens;
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  /** Logout — clear the refresh token */
  async logout(userId: string) {
    await prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
  }

  /** Send OTP to a phone number */
  async sendOtp(phone: string) {
    const existingOtp = await prisma.oTPVerification.findUnique({ where: { phone } });
    
    if (existingOtp) {
      // Check if currently blocked
      if (existingOtp.blockedUntil && existingOtp.blockedUntil > new Date()) {
        const waitMins = Math.ceil((existingOtp.blockedUntil.getTime() - Date.now()) / (60 * 1000));
        throw new TooManyRequestsError(`Too many requests. Please try again after ${waitMins} minutes.`);
      }
      
      // Reset attempts if block has expired OR if last update was long ago (e.g. 1 hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if ((existingOtp.blockedUntil && existingOtp.blockedUntil <= new Date()) || existingOtp.updatedAt < oneHourAgo) {
        await prisma.oTPVerification.update({
          where: { phone },
          data: { attempts: 0, blockedUntil: null }
        });
        existingOtp.attempts = 0;
      }
    }

    // Check if user is already registered (not a guest)
    const user = await prisma.user.findFirst({
      where: { phone }
    });
    const exists = !!user;
    const isRegistered = !!(user && !user.isGuest);

    // Manage attempts
    const attempts = (existingOtp?.attempts || 0) + 1;
    let blockedUntil: Date | null = null;
    
    const MAX_ATTEMPTS = 3;
    const BLOCK_DURATION = 10 * 60 * 1000; // 10 minutes

    if (attempts >= MAX_ATTEMPTS) {
      blockedUntil = new Date(Date.now() + BLOCK_DURATION);
    }

    // Generate a 4-digit or 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits for production
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins expiry

    // Save or update to OTP table
    await prisma.oTPVerification.upsert({
      where: { phone },
      update: { code, expiresAt, verified: false, attempts, blockedUntil },
      create: { phone, code, expiresAt, verified: false, attempts, blockedUntil },
    });

    const message = `Your HalalMart verification code is: ${code}`;
    const smsSuccess = await sendGlobalSms(phone, message, 'OTP');

    if (!smsSuccess) {
      console.warn(`[SMS] Failed to send OTP to ${phone}`);
    }

    return { exists, isRegistered };
  }



  /** Verify OTP without login/registration logic */
  async verifyOnly(phone: string, code: string) {
    const otpRec = await prisma.oTPVerification.findUnique({ where: { phone } });
    
    if (!otpRec) {
      throw new UnauthorizedError('No OTP request found for this number');
    }

    if (otpRec.blockedUntil && otpRec.blockedUntil > new Date()) {
      const waitMins = Math.ceil((otpRec.blockedUntil.getTime() - Date.now()) / (60 * 1000));
      throw new TooManyRequestsError(`Too many failed attempts. Please try again after ${waitMins} minutes.`);
    }

    if (otpRec.code !== code || otpRec.expiresAt < new Date()) {
      const attempts = (otpRec.attempts || 0) + 1;
      let blockedUntil = null;
      if (attempts >= 5) {
        blockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins block
      }
      await prisma.oTPVerification.update({
        where: { phone },
        data: { attempts, blockedUntil },
      });
      throw new UnauthorizedError('Invalid or expired OTP');
    }

    await prisma.oTPVerification.update({
      where: { phone },
      data: { verified: true, attempts: 0, blockedUntil: null },
    });

    return true;
  }

  /** Verify OTP and login/register the user (guest or returning) */
  async verifyOtp(phone: string, code: string, name?: string) {
    const otpRec = await prisma.oTPVerification.findUnique({ where: { phone } });
    
    if (!otpRec) {
      throw new UnauthorizedError('No OTP request found for this number');
    }

    if (otpRec.blockedUntil && otpRec.blockedUntil > new Date()) {
      const waitMins = Math.ceil((otpRec.blockedUntil.getTime() - Date.now()) / (60 * 1000));
      throw new TooManyRequestsError(`Too many failed attempts. Please try again after ${waitMins} minutes.`);
    }

    if (otpRec.code !== code || otpRec.expiresAt < new Date()) {
      const attempts = (otpRec.attempts || 0) + 1;
      let blockedUntil = null;
      if (attempts >= 5) {
        blockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins block
      }
      await prisma.oTPVerification.update({
        where: { phone },
        data: { attempts, blockedUntil },
      });
      throw new UnauthorizedError('Invalid or expired OTP');
    }

    await prisma.oTPVerification.update({
      where: { phone },
      data: { verified: true, attempts: 0, blockedUntil: null },
    });

    // Find if user already exists
    let user = await prisma.user.findFirst({ where: { phone } });
    if (!user) {
      // Auto-create a real user account silently (tagged as guest)
      // Generate a random password so the account is properly secured
      const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10).toUpperCase();
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      
      user = await prisma.user.create({
        data: {
          name: name?.trim() || 'Guest User',
          phone,
          password: hashedPassword,
          isGuest: true,
          role: 'USER',
        },
      });
      // Give them a cart
      await prisma.cart.create({ data: { userId: user.id } });
    } else if (name?.trim() && user.isGuest && user.name === 'Guest User') {
      // Update name if returning guest had default name
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name: name.trim() },
      });
    }

    const tokens = this.generateTokens(user.id, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        isGuest: user.isGuest,
        permissions: user.permissions ? JSON.parse(user.permissions) : [],
      },
      ...tokens,
    };
  }

  /** Generate JWT access + refresh tokens */
  private generateTokens(userId: string, role: string) {
    const accessToken = jwt.sign({ userId, role }, config.jwt.accessSecret as any, {
      expiresIn: config.jwt.accessExpiresIn as any,
    });
    const refreshToken = jwt.sign({ userId, role }, config.jwt.refreshSecret as any, {
      expiresIn: config.jwt.refreshExpiresIn as any,
    });
    return { accessToken, refreshToken };
  }

  /** Persist the refresh token in the database */
  private async saveRefreshToken(userId: string, refreshToken: string) {
    await prisma.user.update({ where: { id: userId }, data: { refreshToken } });
  }
}
