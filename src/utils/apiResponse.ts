import { Response } from "express";

export function successResponse(
  res: Response,
  data: unknown,
  message: string = 'Success',
  statusCode: number = 200
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export function errorResponse(
  res: Response,
  message: string,
  statusCode: number = 400,
  errors?: unknown
) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};

