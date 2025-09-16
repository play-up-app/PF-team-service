import { PrismaClient } from "../generated/prisma/index.js"

export const prismaClient = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL  // Ajout d'une valeur par défaut pour éviter undefined
        }
    },
    log: ['query', 'info', 'warn', 'error']
})

