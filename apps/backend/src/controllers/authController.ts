import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import crypto from 'crypto';
import User from '../models/User';
import VerificationCode from '../models/VerificationCode';
import { AuthRequest } from '../middleware/auth';
import { sendVerificationEmail, sendWelcomeEmail } from '../services/emailService';

const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: '7d'
  });
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Create new user
    const user = new User({
      email,
      password,
      name,
      phone
    });

    await user.save();

    // Generate token
    const token = generateToken((user._id as mongoose.Types.ObjectId).toString());

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        rating: user.rating,
        totalErrands: user.totalErrands,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken((user._id as mongoose.Types.ObjectId).toString());

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        rating: user.rating,
        totalErrands: user.totalErrands,
        isVerified: user.isVerified,
        location: user.location
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        rating: user.rating,
        totalErrands: user.totalErrands,
        isVerified: user.isVerified,
        location: user.location
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { name, phone, avatar } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { name, phone, avatar },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Generate 6-digit verification code
const generateVerificationCode = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

// Send email verification code
export const sendEmailVerification = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if email already exists and is verified
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const isEmailVerified = existingUser.verification.some(
        v => v.type === 'email' && v.status === 'verified'
      );
      if (isEmailVerified) {
        return res.status(400).json({ error: 'Email is already verified' });
      }
    }

    // Check for recent verification codes (rate limiting)
    const recentCode = await VerificationCode.findOne({
      email,
      type: 'email',
      createdAt: { $gte: new Date(Date.now() - 60 * 1000) } // Within last minute
    });

    if (recentCode) {
      return res.status(429).json({
        error: 'Please wait before requesting a new code',
        retryAfter: 60
      });
    }

    // Generate and save verification code
    const code = generateVerificationCode();
    const verificationCode = new VerificationCode({
      email,
      code,
      type: 'email'
    });

    await verificationCode.save();

    // Send email
    await sendVerificationEmail(email, code);

    res.json({
      success: true,
      message: 'Verification code sent to email',
      expiresIn: 600 // 10 minutes in seconds
    });
  } catch (error) {
    console.error('Send email verification error:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
};

// Verify email code
export const verifyEmailCode = async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    // Find verification code
    const verificationCode = await VerificationCode.findOne({
      email,
      code,
      type: 'email',
      isUsed: false,
      expiresAt: { $gt: new Date() }
    });

    if (!verificationCode) {
      // Check if code exists but expired or used
      const anyCode = await VerificationCode.findOne({ email, code, type: 'email' });
      if (anyCode) {
        if (anyCode.isUsed) {
          return res.status(400).json({ error: 'Verification code already used' });
        }
        if (anyCode.expiresAt < new Date()) {
          return res.status(400).json({ error: 'Verification code expired' });
        }
      }

      // Increment attempts
      await VerificationCode.updateMany(
        { email, type: 'email', isUsed: false },
        { $inc: { attempts: 1 } }
      );

      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Check max attempts
    if (verificationCode.attempts >= 5) {
      return res.status(400).json({ error: 'Too many failed attempts. Please request a new code.' });
    }

    // Mark as used
    verificationCode.isUsed = true;
    await verificationCode.save();

    // Update user verification status
    const user = await User.findOne({ email });
    if (user) {
      // Check if email verification already exists
      const emailVerificationIndex = user.verification.findIndex(v => v.type === 'email');

      if (emailVerificationIndex >= 0) {
        // Update existing verification
        user.verification[emailVerificationIndex].status = 'verified';
        user.verification[emailVerificationIndex].verifiedAt = new Date();
      } else {
        // Add new verification
        user.verification.push({
          type: 'email',
          status: 'verified',
          verifiedAt: new Date()
        });
      }

      // Update verification status
      user.getVerificationStatus();
      await user.save();

      // Send welcome email if this is the first verification
      if (user.verificationLevel === 1) {
        await sendWelcomeEmail(email, user.name);
      }
    }

    res.json({
      success: true,
      message: 'Email verified successfully',
      verified: true
    });
  } catch (error) {
    console.error('Verify email code error:', error);
    res.status(500).json({ error: 'Failed to verify code' });
  }
};

// Resend verification code
export const resendVerificationCode = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check for recent codes (rate limiting)
    const recentCode = await VerificationCode.findOne({
      email,
      type: 'email',
      createdAt: { $gte: new Date(Date.now() - 60 * 1000) }
    });

    if (recentCode) {
      return res.status(429).json({
        error: 'Please wait before requesting a new code',
        retryAfter: 60
      });
    }

    // Invalidate old codes
    await VerificationCode.updateMany(
      { email, type: 'email', isUsed: false },
      { isUsed: true }
    );

    // Generate and save new code
    const code = generateVerificationCode();
    const verificationCode = new VerificationCode({
      email,
      code,
      type: 'email'
    });

    await verificationCode.save();

    // Send email
    await sendVerificationEmail(email, code);

    res.json({
      success: true,
      message: 'New verification code sent to email',
      expiresIn: 600
    });
  } catch (error) {
    console.error('Resend verification code error:', error);
    res.status(500).json({ error: 'Failed to resend verification code' });
  }
};

// Change password
export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};