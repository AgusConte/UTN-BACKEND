import "dotenv/config"
import { MongoClient, ObjectId } from "mongodb"

interface Libro {
    titulo: string
    autor: string
    precio: number
    stock: number
}

const URI_DB = process.env.URI_DB ?? "mongodb://localhost:27017"
const client = new MongoClient(URI_DB)

const conectarDB = async () => {
    try {
        await client.connect()
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
        !autor.trim() ||
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

    return { titulo: titulo.trim(), autor: autor.trim(), precio, stock }
}

const leerActualizaciones = (datos: string[]): Partial<Libro> => {
    if (datos.length === 0) {
        throw new Error("Indicá al menos un campo para actualizar. Ejemplo: update ID precio=18000")
    }

    const cambios: Partial<Libro> = {}

    for (const dato of datos) {
        const separador = dato.indexOf("=")
        if (separador < 1) {
            throw new Error(`Dato inválido: ${dato}. Usá campo=valor`)
        }

        const campo = dato.slice(0, separador)
        const valor = dato.slice(separador + 1).trim()
        if (!valor) {
            throw new Error(`Falta el valor de ${campo}`)
        }

        switch (campo) {
            case "titulo":
                cambios.titulo = valor
                break
            case "autor":
                cambios.autor = valor
                break
            case "precio": {
                const precio = Number(valor)
                if (!Number.isFinite(precio) || precio < 0) {
                    throw new Error("El precio debe ser un número mayor o igual a 0")
                }
                cambios.precio = precio
                break
            }
            case "stock": {
                const stock = Number(valor)
                if (!Number.isInteger(stock) || stock < 0) {
                    throw new Error("El stock debe ser un número entero mayor o igual a 0")
                }
                cambios.stock = stock
                break
            }
            default:
                throw new Error(`Campo desconocido: ${campo}`)
        }
    }

    return cambios
}

const leerId = (id: string | undefined): ObjectId => {
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
        throw new Error("El ID debe tener 24 caracteres hexadecimales")
    }
    return new ObjectId(id)
}

const leerLibros = async (id?: string) => {
    if (id !== undefined) {
        const libro = await libros.findOne({ _id: leerId(id) })
        if (!libro) throw new Error("No se encontró el libro")
        return libro
    }

    return libros.find(
        {},
        { projection: { _id: 0, titulo: 1, stock: 1 } }
    ).toArray()
}

const crearLibro = async (datos: Libro) => {
    const resultado = await libros.insertOne(datos)
    return libros.findOne({ _id: resultado.insertedId })
}

const actualizarLibro = async (id: ObjectId, datos: Partial<Libro>) => {
    return libros.findOneAndUpdate(
        { _id: id },
        { $set: datos },
        { returnDocument: "after" }
    )
}

const eliminarLibro = async (id: ObjectId) => {
    const resultado = await libros.deleteOne({ _id: id })
    return resultado.deletedCount === 1 ? "Libro eliminado" : "No se encontró el libro"
}

const main = async () => {
    try {
        await conectarDB()

        switch (argumentos[0]) {
            case "create":
                console.log(await crearLibro(leerDatosLibro(argumentos.slice(1))))
                break

            case "read":
                if (argumentos.length > 2) {
                    throw new Error("Uso: read [ID]")
                }
                console.log(await leerLibros(argumentos[1]))
                break

            case "update": {
                const id = leerId(argumentos[1])
                const datos = leerActualizaciones(argumentos.slice(2))
                const libroActualizado = await actualizarLibro(id, datos)
                console.log(libroActualizado ?? "No se encontró el libro")
                break
            }

            case "delete":
                if (argumentos.length !== 2) {
                    throw new Error("Uso: delete ID")
                }
                console.log(await eliminarLibro(leerId(argumentos[1])))
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
