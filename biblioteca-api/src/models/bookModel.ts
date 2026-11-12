import mongoose, { Schema } from "mongoose";
import type { BookRecord } from "../interfaces/book.js";

const bookSchema = new Schema<BookRecord>(
  {
    title: { type: String, required: true, unique: true, trim: true },
    author: { type: String, required: true, trim: true },
    publishedYear: { type: Number },
    genre: { type: String, trim: true },
    available: { type: Boolean, default: true },
  },
  { versionKey: false, collection: "books" },
);

export const Book = mongoose.model<BookRecord>("Book", bookSchema);
