import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';
import { errorResponse } from '../utils/apiResponse';

export function internalAuth(req: Request, res: Response, next: NextFunction): void {
  const secret = req.headers["x-internal-secret"];

  if(!secret || secret !== config.internal.secret) {
    errorResponse(res, "Unauthorized", 401);
    return;
  };

  next();
};