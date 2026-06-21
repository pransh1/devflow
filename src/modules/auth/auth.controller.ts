// thin layer, just handles HTTP in/out and calls the service
import { Response, Request, NextFunction } from "express";
import { registerSchema, loginSchema, refreshTokenSchema } from "./auth.schema";
import * as authService from "./auth.service";
import { successResponse, errorResponse } from "../../utils/apiResponse";
import redis from '../../config/redis';
import { CacheKeys } from '../../utils/cache';

const MAX_LOGIN_ATTEMPTS = 5;
const WINDOW_SECONDS = 60 * 15; // 15 minutes


export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const input = registerSchema.parse(req.body);
    const result = await authService.registerUser(input);
    successResponse(res, result, 'Account created successfully', 201);
  } catch (error) {
    next(error);
  }
};


export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const ip = req.ip || 'unknown';
    const rateLimitKey = CacheKeys.rateLimitLogin(ip);
    
    // check how many attempts this IP has made
    const attempts = await redis.get(rateLimitKey);
    if(attempts && parseInt(attempts) >= MAX_LOGIN_ATTEMPTS) {
      errorResponse(res, 'Too many login attempts. Try again in 15 minutes.', 429);
      return;
    }

    const input = loginSchema.parse(req.body);
    try {
      const result = await authService.loginUser(input);
       // successful login — clear rate limit
      await redis.del(rateLimitKey);
      successResponse(res, result, 'Login successful');
    } catch (loginError) {
      // failed login - increment counter
      const current = await redis.incr(rateLimitKey);
      if(current === 1) {
        // first attempt — set expiry window
        await redis.expire(rateLimitKey, WINDOW_SECONDS);
      }
      throw loginError;
    };
  } catch (error) {
    next(error);
  }
};


export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = refreshTokenSchema.parse(req.body);
    const result = await authService.refreshAccessToken(refreshToken);
    successResponse(res, result, 'Token refreshed');
  } catch (error) {
    next(error);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.getMe(req.user!.userId);
    successResponse(res, user);
  } catch (error) {
    next(error);
  }
}
