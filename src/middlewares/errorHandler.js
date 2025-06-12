import { HttpError } from 'http-errors';
import multer from 'multer';

export const errorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    let statusCode = 400;
    let message = 'File upload error';

    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File is too large. Max size is 2MB.';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded.';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected field for file upload.';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Too many parts in the form.';
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'Field name too long.';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Field value too long.';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Too many fields in the form.';
        break;
      default:
        message = `File upload error: ${err.message}`;
    }

    res.status(statusCode).json({
      status: statusCode,
      message: message,
    });
    return;
  }

  if (err.message === 'Invalid file type. Only image files are allowed.') {
    res.status(400).json({
      status: 400,
      message: err.message,
    });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({
      status: err.status,
      message: err.message,
      errors: err.errors,
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    status: 500,
    message: 'Something went wrong',
    data: err.message,
  });
};
