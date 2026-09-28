import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import clubRoutes from './routes/club.routes.js';
import eventRoutes from './routes/event.routes.js';

export const createApp = () => {
  const app = express();

  // CORS configuration
  const allowedOrigins = [
    process.env.CLIENT_URL,
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173'
  ].filter(Boolean) as string[];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, postman)
        if (!origin) return callback(null, true);
        if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(null, true); // Permissive in dev/local environments
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    })
  );

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'CampusConnect Auth API',
      timestamp: new Date().toISOString()
    });
  });

  // Mount Application Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/clubs', clubRoutes);
  app.use('/api/events', eventRoutes);

  // 404 handler for unknown routes
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: 'Endpoint not found.'
    });
  });

  // Centralized Error Handling Middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[Error Handler]', err);

    // Mongoose validation error
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e: any) => e.message);
      res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
      return;
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      res.status(409).json({
        success: false,
        message: `An account with this ${field} already exists.`
      });
      return;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
      res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
      return;
    }

    if (err.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        message: 'Token has expired.'
      });
      return;
    }

    // Default 500 Internal Server Error
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: err.message || 'Internal server error.'
    });
  });

  return app;
};

export default createApp();
