import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = global as unknown as {
    prisma: PrismaClient
}

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
})

const prisma = globalForPrisma.prisma || new PrismaClient({
    adapter,
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

async function main() {
    console.log('Fixing StoreItem sequence...');
    await prisma.$executeRaw`SELECT setval('"StoreItem_id_seq"', COALESCE((SELECT MAX(id)+1 FROM "StoreItem"), 1), false);`;
    console.log('Sequence fixed.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
