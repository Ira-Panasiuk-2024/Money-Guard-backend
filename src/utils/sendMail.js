import nodemailer from 'nodemailer';
import path from 'node:path';
import fs from 'node:fs/promises';

import { getEnvVar } from './getEnvVar.js';
import { NODEMAILER, EMAIL_TEMPLATES_DIR } from '../constants/index.js';

const transporter = nodemailer.createTransport({
  host: getEnvVar(NODEMAILER.EMAIL_HOST),
  port: Number(getEnvVar(NODEMAILER.EMAIL_PORT)),
  secure: false,
  auth: {
    user: getEnvVar(NODEMAILER.EMAIL_USER),
    pass: getEnvVar(NODEMAILER.EMAIL_PASS),
  },
});

const readEmailTemplate = async (templateName, replacements = {}) => {
  const templatePath = path.join(EMAIL_TEMPLATES_DIR, `${templateName}.html`);

  let template = await fs.readFile(templatePath, 'utf8');

  for (const key in replacements) {
    template = template.replace(
      new RegExp(`{{${key}}}`, 'g'),
      replacements[key],
    );
  }
  return template;
};

export const sendEmail = async (
  to,
  subject,
  templateName,
  replacements = {},
) => {
  const htmlContent = await readEmailTemplate(templateName, replacements);

  const mailOptions = {
    from: getEnvVar(NODEMAILER.EMAIL_USER),
    to,
    subject,
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully!');
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
