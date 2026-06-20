// thin layer, just handles HTTP in/out and calls the service
import { Response, Request, NextFunction } from "express";
import { registerSchema, loginSchema, refreshTokenSchema } from "./auth.schema";
import * as authService from "./auth.service";
import { successResponse, errorResponse } from "../../utils/apiResponse";


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
    const input = loginSchema.parse(req.body);
    const result = await authService.loginUser(input);
    successResponse(res, result, 'Account loggedIn successfully');
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
