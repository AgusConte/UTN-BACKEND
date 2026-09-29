import { MongoClient, ObjectId } from "mongodb"

const client = new MongoClient("mongodb://localhost:27017")
const libros = client.db("Biblioteca").collection("libros")
const argumentos = process.argv.slice(2)

const main = async () => {
    try {
        await client.connect()

        switch (argumentos[0]) {
            case "create":

                break

            case "read":
                console.log(await libros.find().toArray())
                break

            case "update":

                break

            case "delete":
                
                break
        }
    } finally {
        await client.close()
    }
}

main().catch(error => console.error(error.message))