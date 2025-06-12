import createHttpError from 'http-errors';
import bcrypt from 'bcrypt';

import {
  logoutUser,
  findUserByEmail,
  createUser,
  createSession,
  verifyUser,
  generateResetToken,
  resetUserPassword,
} from '../services/auth.js';

import { SessionsCollection } from '../db/models/Sessions.js';

export const registerUserController = async (req, res) => {
  const user = await findUserByEmail(req.body.email);

  if (user)
    throw createHttpError(
      409,
      'The user already exists. Please try another one',
    );

  const { user: newUser, token } = await createUser(req.body);

  res.status(201).json({
    success: true,
    data: {
      user: {
        name: newUser.name,
        email: newUser.email,
        balance: newUser.balance,
        photo: newUser.photo,
        isVerified: newUser.isVerified,
      },
      token,
    },
    message: 'User registered successfully. Please verify your email.',
  });
};

export const loginUserController = async (req, res) => {
  const user = await findUserByEmail(req.body.email);

  if (!user) {
    throw createHttpError(401, 'Email or password is incorrect');
  }

  if (!user.isVerified) {
    throw createHttpError(403, 'Please verify your email to log in');
  }

  const isPwdEqual = await bcrypt.compare(req.body.password, user.password);

  if (!isPwdEqual) throw createHttpError(401, 'Email or password is incorrect');

  await SessionsCollection.deleteOne({ userId: user._id });

  const token = await createSession(user._id, user.email);

  res.status(200).json({
    success: true,
    data: {
      user: {
        name: user.name,
        email: user.email,
        balance: user.balance,
        photo: user.photo,
        isVerified: user.isVerified,
      },
      token,
    },
    message: 'Login successful',
  });
};

export const logoutUserController = async (req, res) => {
  await logoutUser(req.user._id);

  res.status(204).send();
};

export const verifyEmailController = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    throw createHttpError(400, 'Verification token is missing');
  }

  const user = await verifyUser(token);

  if (!user) {
    throw createHttpError(404, 'Invalid or expired verification token');
  }

  res.status(200).json({
    success: true,
    message: 'Email successfully verified!',
  });
};

export const requestPasswordResetController = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw createHttpError(400, 'Email is required');
  }

  const emailSent = await generateResetToken(email);

  if (!emailSent) {
    return res.status(200).json({
      success: true,
      message:
        'If an account with that email exists, a password reset link has been sent.',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Password reset link sent to your email.',
  });
};

export const resetPasswordController = async (req, res) => {
  const { token } = req.query;
  const { newPassword } = req.body;

  if (!token || !newPassword) {
    throw createHttpError(400, 'Token and new password are required');
  }

  const passwordReset = await resetUserPassword(token, newPassword);

  if (!passwordReset) {
    throw createHttpError(400, 'Invalid or expired reset token.');
  }

  res.status(200).json({
    success: true,
    message: 'Password has been reset successfully.',
  });
};
