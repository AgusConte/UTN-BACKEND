import type { Request, Response } from "express";
import mongoose from "mongoose";
import { Book } from "../models/bookModel.js";
import { sendError, sendSuccess, sendUnexpectedError } from "../utils/responses.js";
import { createBookSchema, updateBookSchema } from "../validators/bookValidators.js";

export async function listBooks(_req: Request, res: Response): Promise<Response> {
  try {
    const books = await Book.find().sort({ title: 1, _id: 1 });
    return sendSuccess(res, 200, "Libros obtenidos", books);
  } catch (error) {
    return sendUnexpectedError(res, error);
  }
}

export async function getBook(
  req: Request<{ id: string }>,
  res: Response,
): Promise<Response> {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return sendError(res, 400, "INVALID_ID", "El ID no es un ObjectId válido");
  }

  try {
    const book = await Book.findById(id);
    if (!book) {
      return sendError(res, 404, "BOOK_NOT_FOUND", "No se encontró el libro");
    }
    return sendSuccess(res, 200, "Libro obtenido", book);
  } catch (error) {
    return sendUnexpectedError(res, error);
  }
}

export async function createBook(req: Request, res: Response): Promise<Response> {
  const validation = createBookSchema.safeParse(req.body);
  if (!validation.success) {
    const details = validation.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    return sendError(res, 400, "VALIDATION_ERROR", "Datos de libro inválidos", details);
  }

  try {
    const book = await Book.create(validation.data);
    return sendSuccess(res, 201, "Libro creado", book);
  } catch (error) {
    return sendUnexpectedError(res, error);
  }
}

export async function updateBook(
  req: Request<{ id: string }>,
  res: Response,
): Promise<Response> {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return sendError(res, 400, "INVALID_ID", "El ID no es un ObjectId válido");
  }

  const validation = updateBookSchema.safeParse(req.body);
  if (!validation.success) {
    const details = validation.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
    return sendError(res, 400, "VALIDATION_ERROR", "Datos de libro inválidos", details);
  }

  try {
    const book = await Book.findByIdAndUpdate(id, validation.data, {
      returnDocument: "after",
      runValidators: true,
    });
    if (!book) {
      return sendError(res, 404, "BOOK_NOT_FOUND", "No se encontró el libro");
    }
    return sendSuccess(res, 200, "Libro actualizado", book);
  } catch (error) {
    return sendUnexpectedError(res, error);
  }
}

export async function deleteBook(
  req: Request<{ id: string }>,
  res: Response,
): Promise<Response> {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return sendError(res, 400, "INVALID_ID", "El ID no es un ObjectId válido");
  }

  try {
    const book = await Book.findByIdAndDelete(id);
    if (!book) {
      return sendError(res, 404, "BOOK_NOT_FOUND", "No se encontró el libro");
    }
    return sendSuccess(res, 200, "Libro eliminado", book);
  } catch (error) {
    return sendUnexpectedError(res, error);
  }
}
