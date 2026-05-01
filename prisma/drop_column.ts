import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL || ""
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Dropping parentNeeds column from Bundle table...')
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Bundle" DROP COLUMN "parentNeeds";`)
    console.log("Column 'parentNeeds' dropped from 'Bundle' table successfully.")
  } catch (e: any) {
    console.error("Error dropping column:", e)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    pool.end()
  })
