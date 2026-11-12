import express from "express";
import type { NextFunction, Request, Response } from "express";
import { booksRouter } from "./routes/booksRouter.js";
import { sendError, sendSuccess, sendUnexpectedError } from "./utils/responses.js";

export const app = express();

app.disable("x-powered-by");
app.use(express.json());

app.get("/", (_req, res) => {
  return sendSuccess(res, 200, "API de biblioteca disponible", { status: "ok" });
});

app.use("/books", booksRouter);

app.use((_req, res) => {
  return sendError(res, 404, "ROUTE_NOT_FOUND", "La ruta solicitada no existe");
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof SyntaxError && "body" in error) {
    return sendError(res, 400, "INVALID_JSON", "El cuerpo debe ser un JSON válido");
  }
  return sendUnexpectedError(res, error);
});
