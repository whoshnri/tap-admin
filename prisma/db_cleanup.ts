import 'dotenv/config'
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
  console.log('Cleaning up orphan comments...')
  
  // Find comments where blogId doesn't exist in Blog table
  const blogs = await prisma.blog.findMany({ select: { id: true } })
  const blogIds = blogs.map(b => b.id)
  
  const orphanComments = await prisma.comment.findMany({
    where: {
      NOT: {
        blogId: { in: blogIds }
      }
    }
  })
  
  console.log(`Found ${orphanComments.length} orphan comments. Deleting them...`)
  
  const result = await prisma.comment.deleteMany({
    where: {
      NOT: {
        blogId: { in: blogIds }
      }
    }
  })
  
  console.log(`Deleted ${result.count} comments.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
