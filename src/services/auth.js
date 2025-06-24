import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';

import { UsersCollection } from '../db/models/Users.js';
import { SessionsCollection } from '../db/models/Sessions.js';

import { getEnvVar } from '../utils/getEnvVar.js';
import { sendEmail } from '../utils/sendMail.js';

import { TOKEN_VALID_UNTIL } from '../constants/index.js';

export const createSession = async (userId, email) => {
  const token = jwt.sign({ id: userId, email }, getEnvVar('JWT_SECRET'), {
    expiresIn: '1d',
  });

  await SessionsCollection.create({
    userId,
    token,
    tokenValidUntil: new Date(Date.now() + TOKEN_VALID_UNTIL),
  });

  return token;
};

export const findUserByEmail = (email) => UsersCollection.findOne({ email });

export const findUserById = (id) => UsersCollection.findById(id);

export const createUser = async (userData) => {
  const encryptedPassword = await bcrypt.hash(userData.password, 10);
  const verificationToken = randomBytes(16).toString('hex');

  const newUser = await UsersCollection.create({
    ...userData,
    password: encryptedPassword,
    verificationToken,
    isVerified: false,
  });

  const verificationLink = `${getEnvVar(
    'FRONTEND_URL',
  )}/auth/verify?token=${verificationToken}`;
  await sendEmail(
    newUser.email,
    'Verify Your Email Address',
    'email-verification',
    {
      userName: newUser.name,
      verificationLink,
      currentYear: new Date().getFullYear(),
    },
  );

  const token = await createSession(newUser._id, newUser.email);

  return { user: newUser, token };
};

export const logoutUser = async (userId) => {
  await SessionsCollection.deleteOne({ userId });
};

export const verifyUser = async (verificationToken) => {
  const user = await UsersCollection.findOneAndUpdate(
    { verificationToken },
    { $set: { isVerified: true, verificationToken: null } },
    { new: true },
  );
  return user;
};

export const generateResetToken = async (email) => {
  const user = await findUserByEmail(email);
  if (!user) return null;

  const resetToken = randomBytes(32).toString('hex');
  const resetTokenExpires = new Date(Date.now() + 3600000);

  await UsersCollection.findByIdAndUpdate(
    user._id,
    { resetToken, resetTokenExpires },
    { new: true },
  );

  const resetLink = `${getEnvVar(
    'FRONTEND_URL',
  )}/reset-password?token=${resetToken}`;
  await sendEmail(user.email, 'Password Reset Request', 'password-reset', {
    userName: user.name,
    resetLink,
    currentYear: new Date().getFullYear(),
  });
  return true;
};

export const resetUserPassword = async (resetToken, newPassword) => {
  const user = await UsersCollection.findOne({
    resetToken,
    resetTokenExpires: { $gt: new Date() },
  });

  if (!user) return null;

  const encryptedPassword = await bcrypt.hash(newPassword, 10);

  await UsersCollection.findByIdAndUpdate(
    user._id,
    {
      password: encryptedPassword,
      resetToken: null,
      resetTokenExpires: null,
    },
    { new: true },
  );
  return true;
};
