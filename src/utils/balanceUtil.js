import { UsersCollection } from '../db/models/Users.js';
import { TransactionsCollection } from '../db/models/Transactions.js';
import createHttpError from 'http-errors';

export const updateBalanceOnCreate = async (
  userId,
  transaction,
  session = null,
) => {
  const user = await UsersCollection.findById(userId, null, { session });
  if (!user) {
    throw createHttpError(404, 'User not found!');
  }

  const sum = Number(transaction.sum);

  if (transaction.type === 'income') {
    user.balance = Number(user.balance) + sum;
  } else {
    user.balance = Number(user.balance) - sum;
  }

  user.balance = parseFloat(user.balance.toFixed(2));

  await user.save({ session });

  return user.balance;
};

export const updateBalanceOnUpdate = async (
  userId,
  oldTransaction,
  newTransaction,
  session = null,
) => {
  const user = await UsersCollection.findById(userId, null, { session });
  if (!user) {
    throw createHttpError(404, 'User not found!');
  }

  const oldSum = Number(oldTransaction.sum);
  const newSum = Number(newTransaction.sum);
  const oldType = oldTransaction.type;
  const newType = newTransaction.type;

  if (oldType === 'income') {
    user.balance = Number(user.balance) - oldSum;
  } else {
    user.balance = Number(user.balance) + oldSum;
  }

  if (newType === 'income') {
    user.balance = Number(user.balance) + newSum;
  } else {
    user.balance = Number(user.balance) - newSum;
  }

  user.balance = parseFloat(user.balance.toFixed(2));

  await user.save({ session });

  return user.balance;
};

export const updateBalanceOnDelete = async (
  userId,
  transaction,
  session = null,
) => {
  const user = await UsersCollection.findById(userId, null, { session });
  if (!user) {
    throw createHttpError(404, 'User not found!');
  }

  const sum = Number(transaction.sum);

  if (transaction.type === 'income') {
    user.balance = Number(user.balance) - sum;
  } else {
    user.balance = Number(user.balance) + sum;
  }

  user.balance = parseFloat(user.balance.toFixed(2));

  await user.save({ session });

  return user.balance;
};

export const recalculateBalance = async (userId, session = null) => {
  const user = await UsersCollection.findById(userId, null, { session });
  if (!user) {
    throw createHttpError(404, 'User not found!');
  }

  const transactions = await TransactionsCollection.find({ userId }, null, {
    session,
  });

  let balance = 0;

  transactions.forEach((transaction) => {
    const sum = Number(transaction.sum);

    if (transaction.type === 'income') {
      balance += sum;
    } else {
      balance -= sum;
    }
  });

  user.balance = parseFloat(balance.toFixed(2));

  await user.save({ session });

  return user.balance;
};
