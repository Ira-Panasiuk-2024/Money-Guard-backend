import path from 'node:path';

export const TEMP_UPLOAD_DIR = path.join(process.cwd(), 'temp');
export const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

export const CLOUDINARY = {
  CLOUD_NAME: 'CLOUD_NAME',
  API_KEY: 'API_KEY',
  API_SECRET: 'API_SECRET',
};

export const SWAGGER_PATH = path.join(process.cwd(), 'docs', 'swagger.json');
export const TOKEN_VALID_UNTIL = 24 * 60 * 60 * 1000;

export const NODEMAILER = {
  EMAIL_HOST: 'EMAIL_HOST',
  EMAIL_PORT: 'EMAIL_PORT',
  EMAIL_USER: 'EMAIL_USER',
  EMAIL_PASS: 'EMAIL_PASS',
};

export const INCOME_CATEGORIES = [
  'Incomes',
  'Salary',
  'Freelance',
  'Investments',
];

export const EXPENSE_CATEGORIES = [
  'Main expenses',
  'Products',
  'Car',
  'Self care',
  'Child care',
  'Household products',
  'Education',
  'Leisure',
  'Other expenses',
  'Entertainment',
];

export const MINIMUM_YEAR = 2022;
