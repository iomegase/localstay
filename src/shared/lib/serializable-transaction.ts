import { Prisma } from '@prisma/client'
import { prisma } from '@/shared/lib/prisma'

const MAX_SERIALIZABLE_ATTEMPTS = 3

export async function runSerializableTransaction<T>(
  callback: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let attempt = 1; attempt <= MAX_SERIALIZABLE_ATTEMPTS; attempt += 1) {
    try {
      return await prisma.$transaction(callback, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      })
    } catch (error) {
      if (!isPrismaWriteConflict(error) || attempt === MAX_SERIALIZABLE_ATTEMPTS) throw error
    }
  }

  throw new Error('Unreachable serializable transaction state')
}

function isPrismaWriteConflict(error: unknown): boolean {
  return error instanceof Error && Reflect.get(error, 'code') === 'P2034'
}
