import type { Response } from "express";
import mongoose from "mongoose";

export function sendSuccess<T>(
  res: Response,
  status: number,
  message: string,
  data: T,
): Response {
  return res.status(status).json({ success: true, message, data, error: null });
}

export function sendError(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: unknown,
): Response {
  return res.status(status).json({
    success: false,
    message,
    data: null,
    error: { code, ...(details === undefined ? {} : { details }) },
  });
}

export function sendUnexpectedError(res: Response, error: unknown): Response {
  if (error instanceof mongoose.Error.ValidationError) {
    return sendError(res, 400, "VALIDATION_ERROR", error.message);
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  ) {
    return sendError(res, 409, "DUPLICATE_TITLE", "Ya existe un libro con ese título");
  }

  console.error("Error inesperado en la API:", error);
  return sendError(res, 500, "INTERNAL_ERROR", "Ocurrió un error interno");
}
