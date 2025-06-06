import createHttpError from 'http-errors';
import bcrypt from 'bcrypt';

import {
  logoutUser,
  findUserByEmail,
  createUser,
  createSession,
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
      },
      token,
    },
    message: 'User registered successfully',
  });
};

export const loginUserController = async (req, res) => {
  const user = await findUserByEmail(req.body.email);

  if (!user) {
    throw createHttpError(401, 'Email or password is incorrect');
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
