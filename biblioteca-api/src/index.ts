import { app } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { Book } from "./models/bookModel.js";

async function start(): Promise<void> {
  try {
    process.loadEnvFile();

    const uri = process.env.URI_DB;
    if (!uri) {
      throw new Error("Falta URI_DB en el archivo .env");
    }

    const port = Number(process.env.PORT ?? "3000");
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error("PORT debe ser un número entre 1 y 65535");
    }

    await connectDatabase(uri);
    await Book.init(); // Confirma el índice único de title antes de recibir peticiones.

    app.listen(port, () => {
      console.log(`API disponible en http://localhost:${port}`);
    });
  } catch (error) {
    console.error("No se pudo iniciar la API:", error);
    await disconnectDatabase();
    process.exitCode = 1;
  }
}

void start();
