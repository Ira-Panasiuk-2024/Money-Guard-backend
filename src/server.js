// import express from 'express';
// import cors from 'cors';
// import cookieParser from 'cookie-parser';

// import authRouter from './routers/auth.js';
// import usersRouter from './routers/user.js';
// import transactionsRouter from './routers/wallet.js';
// import categoriesRouter from './routers/categories.js';

// import { UPLOAD_DIR } from './constants/index.js';
// import { getEnvVar } from './utils/getEnvVar.js';

// import { notFoundHandler } from './middlewares/notFoundHandler.js';
// import { errorHandler } from './middlewares/errorHandler.js';
// import { swaggerDocs } from './middlewares/swaggerDocs.js';

// const PORT = Number(getEnvVar('PORT', '9292'));

// export const startServer = () => {
//   const app = express();

//   const corsOptions = {
//     origin: [
//       'http://localhost:5173',
//       'http://localhost:3000',
//       'https://money-guard-frontend-five.vercel.app',
//       'https://money-guard-frontend-6c301qi0i-ira-panasiuks-projects.vercel.app',
//     ],
//     credentials: true,
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization', 'x-access-token'],
//     optionsSuccessStatus: 200,
//   };
//   app.use(cors(corsOptions));

//   app.use(express.json());
//   app.use(cookieParser());

//   app.use('/api-docs', swaggerDocs());

//   app.use('/uploads', express.static(UPLOAD_DIR));

//   app.use('/auth', authRouter);
//   app.use('/users', usersRouter);
//   app.use('/transactions', transactionsRouter);
//   app.use('/categories', categoriesRouter);

//   app.all('*', notFoundHandler);
//   app.use(errorHandler);

//   app.listen(PORT, () => {
//     console.log(`Server is running on port ${PORT}`);
//   });

//   return app;
// };

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRouter from './routers/auth.js';
import usersRouter from './routers/user.js';
import transactionsRouter from './routers/wallet.js';
import categoriesRouter from './routers/categories.js';

import { UPLOAD_DIR } from './constants/index.js';
import { getEnvVar } from './utils/getEnvVar.js';

import { notFoundHandler } from './middlewares/notFoundHandler.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { swaggerDocs } from './middlewares/swaggerDocs.js';

const PORT = Number(getEnvVar('PORT', '9292'));

export const startServer = () => {
  const app = express();

  const corsOptions = {
    origin: function (origin, callback) {
      const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://money-guard-frontend-five.vercel.app',
        'https://money-guard-frontend-6c301qi0i-ira-panasiuks-projects.vercel.app',
      ];

      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-access-token',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
    optionsSuccessStatus: 200,
  };

  app.use((req, res, next) => {
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'DENY');
    res.header('X-XSS-Protection', '1; mode=block');
    next();
  });

  app.use(cors(corsOptions));

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser());

  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  app.use('/api-docs', swaggerDocs());

  app.use('/uploads', express.static(UPLOAD_DIR));

  app.use('/auth', authRouter);
  app.use('/users', usersRouter);
  app.use('/transactions', transactionsRouter);
  app.use('/categories', categoriesRouter);

  app.all(/.*/, notFoundHandler);
  app.use(errorHandler);

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
  });

  const gracefulShutdown = (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log('✅ Server closed successfully');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  return app;
};
