// import multer from 'multer';
// import { TEMP_UPLOAD_DIR } from '../constants/index.js';

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, TEMP_UPLOAD_DIR);
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now();
//     cb(null, `${uniqueSuffix}_${file.originalname}`);
//   },
// });

// export const upload = multer({ storage });

import multer from 'multer';
import { TEMP_UPLOAD_DIR } from '../constants/index.js';
import path from 'node:path';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, TEMP_UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(
      null,
      `${uniqueSuffix}_${file.fieldname}${path.extname(file.originalname)}`,
    );
  },
});

export const upload = multer({
  storage: storage,

  limits: {
    fileSize: 2 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only image files are allowed.'), false);
    }
  },
});
