import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { Server } from "node:http";
import { after, before, test } from "node:test";
import mongoose from "mongoose";
import { app } from "../src/app.js";
import { connectDatabase, disconnectDatabase } from "../src/config/database.js";
import { Book } from "../src/models/bookModel.js";

const databaseName = `codex_biblioteca_test_${randomUUID().replaceAll("-", "")}`;
const uri = `mongodb://127.0.0.1:27017/${databaseName}`;
let server: Server;
let baseUrl: string;

interface ApiBody {
  success: boolean;
  message: string;
  data: Record<string, unknown> | Array<Record<string, unknown>> | null;
  error: { code: string; details?: unknown } | null;
}

async function request(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<{ status: number; body: ApiBody }> {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, body: (await response.json()) as ApiBody };
}

before(async () => {
  await connectDatabase(uri);
  await Book.init();
  await new Promise<void>((resolve, reject) => {
    server = app.listen(0, () => resolve());
    server.once("error", reject);
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("No se pudo obtener el puerto de prueba");
  }
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
  if (mongoose.connection.name === databaseName) {
    await mongoose.connection.dropDatabase();
  }
  await disconnectDatabase();
});

test("CRUD completo y respuestas estandarizadas", async () => {
  const empty = await request("/books");
  assert.equal(empty.status, 200);
  assert.equal(empty.body.success, true);
  assert.deepEqual(empty.body.data, []);

  const invalid = await request("/books", "POST", { title: "Sin autor" });
  assert.equal(invalid.status, 400);
  assert.equal(invalid.body.error?.code, "VALIDATION_ERROR");

  const created = await request("/books", "POST", {
    title: "El principito",
    author: "Antoine de Saint-Exupéry",
    publishedYear: 1943,
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.success, true);
  assert.equal((created.body.data as Record<string, unknown>).available, true);
  const id = (created.body.data as Record<string, unknown>)._id;
  assert.equal(typeof id, "string");

  const duplicate = await request("/books", "POST", {
    title: "El principito",
    author: "Otro autor",
  });
  assert.equal(duplicate.status, 409);
  assert.equal(duplicate.body.error?.code, "DUPLICATE_TITLE");

  const listed = await request("/books");
  assert.equal(listed.status, 200);
  assert.equal((listed.body.data as Array<unknown>).length, 1);

  const found = await request(`/books/${id}`);
  assert.equal(found.status, 200);
  assert.equal((found.body.data as Record<string, unknown>).title, "El principito");

  const updated = await request(`/books/${id}`, "PATCH", { available: false });
  assert.equal(updated.status, 200);
  assert.equal((updated.body.data as Record<string, unknown>).available, false);

  const emptyUpdate = await request(`/books/${id}`, "PATCH", {});
  assert.equal(emptyUpdate.status, 400);

  const deleted = await request(`/books/${id}`, "DELETE");
  assert.equal(deleted.status, 200);
  assert.equal((deleted.body.data as Record<string, unknown>)._id, id);

  const missing = await request(`/books/${id}`);
  assert.equal(missing.status, 404);
  assert.equal(missing.body.error?.code, "BOOK_NOT_FOUND");
});

test("IDs inválidos y rutas inexistentes", async () => {
  for (const method of ["GET", "PATCH", "DELETE"]) {
    const result = await request("/books/no-es-un-id", method, method === "PATCH" ? { genre: "Ficción" } : undefined);
    assert.equal(result.status, 400);
    assert.equal(result.body.error?.code, "INVALID_ID");
  }
  const unknown = await request("/no-existe");
  assert.equal(unknown.status, 404);
  assert.equal(unknown.body.error?.code, "ROUTE_NOT_FOUND");
});

test("JSON mal formado devuelve un error claro", async () => {
  const response = await fetch(`${baseUrl}/books`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{",
  });
  const body = (await response.json()) as ApiBody;
  assert.equal(response.status, 400);
  assert.equal(body.error?.code, "INVALID_JSON");
});

test("la edición respeta el título único y rechaza datos incorrectos", async () => {
  const first = await request("/books", "POST", {
    title: "Libro uno",
    author: "Autora A",
  });
  const second = await request("/books", "POST", {
    title: "Libro dos",
    author: "Autor B",
    available: false,
  });
  assert.equal(first.status, 201);
  assert.equal(second.status, 201);
  assert.equal((second.body.data as Record<string, unknown>).available, false);

  const secondId = (second.body.data as Record<string, unknown>)._id;
  const duplicateUpdate = await request(`/books/${secondId}`, "PATCH", {
    title: "Libro uno",
  });
  assert.equal(duplicateUpdate.status, 409);
  assert.equal(duplicateUpdate.body.error?.code, "DUPLICATE_TITLE");

  const unchanged = await request(`/books/${secondId}`);
  assert.equal((unchanged.body.data as Record<string, unknown>).title, "Libro dos");

  const invalidYear = await request("/books", "POST", {
    title: "Año incorrecto",
    author: "Autor C",
    publishedYear: "2020",
  });
  assert.equal(invalidYear.status, 400);
  assert.equal(invalidYear.body.error?.code, "VALIDATION_ERROR");

  const missingId = new mongoose.Types.ObjectId().toString();
  assert.equal((await request(`/books/${missingId}`, "PATCH", { genre: "Drama" })).status, 404);
  assert.equal((await request(`/books/${missingId}`, "DELETE")).status, 404);
});
