import { CategoriesCollection } from '../db/models/Categories.js';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '../constants/index.js';

export const initializeDefaultCategories = async () => {
  try {
    const existingCategories = await CategoriesCollection.find();

    if (existingCategories.length === 0) {
      console.log('Initializing default categories...');

      const categoryPromises = [];

      INCOME_CATEGORIES.forEach((name) => {
        categoryPromises.push(
          CategoriesCollection.create({
            type: 'income',
            name,
          }),
        );
      });

      EXPENSE_CATEGORIES.forEach((name) => {
        categoryPromises.push(
          CategoriesCollection.create({
            type: 'expense',
            name,
          }),
        );
      });

      await Promise.all(categoryPromises);
      console.log('Default categories have been initialized');
    } else {
      console.log('Categories already exist, skipping initialization');
    }
  } catch (error) {
    console.error('Failed to initialize default categories:', error);
    throw error;
  }
};
