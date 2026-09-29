import "dotenv/config"
import { MongoClient, ObjectId } from "mongodb"

interface Libro {
    titulo: string
    autor: string
    precio: number
    stock: number
}

const client = new MongoClient(process.env.URI_DB ?? "mongodb://localhost:27017")

const conectarDB = async () => {
    try {
        await client.connect()
        await client.db("Biblioteca").command({ ping: 1 })
        console.log("Conectado a MongoDB")
    } catch (error) {
        throw new Error("No se pudo conectar a MongoDB", { cause: error })
    }
}

const libros = client.db("biblioteca").collection<Libro>("libros")
const argumentos = process.argv.slice(2)


const leerDatosLibro = (datos: string[]): Libro => {
    const [titulo, autor, precioTexto, stockTexto] = datos

    if (
        datos.length !== 4 ||
        titulo === undefined ||
        autor === undefined ||
        precioTexto === undefined ||
        stockTexto === undefined ||
        !titulo.trim() ||
        !autor.trim()||
        !precioTexto.trim() ||
        !stockTexto.trim()
    ) {
        throw new Error('Indicá título, autor, precio y stock. Ejemplo: create "El Principito" "Antoine de Saint-Exupéry" 15000 10')
    }

    const precio = Number(precioTexto)
    const stock = Number(stockTexto)

    if (!Number.isFinite(precio) || precio < 0) {
        throw new Error("El precio debe ser un número mayor o igual a 0")
    }
    if (!Number.isInteger(stock) || stock < 0) {
        throw new Error("El stock debe ser un número entero mayor o igual a 0")
    }

    return { titulo, autor, precio, stock }
}

const leerId = (id: string | undefined): ObjectId => {
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
        throw new Error("El ID debe tener 24 caracteres hexadecimales")
    }
    return new ObjectId(id)
}

const leerLibros = async () => libros.find().toArray()


const main = async () => {
    try {
        await conectarDB()

        switch (argumentos[0]) {
            

            case "read":
                console.log(await leerLibros())
                break

            default:
                console.log("Usá: create, read, update o delete")
                process.exitCode = 1
        }
    } finally {
        await client.close()
    }
}

main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
})
