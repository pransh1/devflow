import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { errorResponse } from '../utils/apiResponse';

// Extend Express Request type to include our user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
};

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith('Bearer ')) {
      errorResponse(res, 'No token provided', 401);
      return;
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();

  } catch (error) {
    errorResponse(res, 'Invalid or expired token', 401);
  }
};

