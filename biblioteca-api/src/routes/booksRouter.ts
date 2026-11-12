import { Router } from "express";
import {
  createBook,
  deleteBook,
  getBook,
  listBooks,
  updateBook,
} from "../controllers/booksController.js";

export const booksRouter = Router();

booksRouter.get("/", listBooks);
booksRouter.get("/:id", getBook);
booksRouter.post("/", createBook);
booksRouter.patch("/:id", updateBook);
booksRouter.delete("/:id", deleteBook);
