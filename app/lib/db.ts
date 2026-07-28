import { PrismaClient } from '@/lib/generated/prisma'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getDirectUrl(): string {
  if (process.env.DIRECT_DATABASE_URL) {
    return process.env.DIRECT_DATABASE_URL
  }
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL environment variable is not set')
  return url
}

function createPrismaClient(): PrismaClient {
  const connectionString = getDirectUrl()
  const adapter = new PrismaPg({ connectionString })
  return new PrismaClient({ adapter } as never)
}

export const db: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
