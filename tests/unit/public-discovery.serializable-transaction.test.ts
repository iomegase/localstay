const mockTransaction = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: { $transaction: (...args: unknown[]) => mockTransaction(...args) },
}))

import { runSerializableTransaction } from '@/shared/lib/serializable-transaction'

describe('041 serializable transaction retry', () => {
  beforeEach(() => jest.clearAllMocks())

  it('retries bounded P2034 write conflicts with Serializable isolation', async () => {
    const conflict = Object.assign(new Error('write conflict'), { code: 'P2034' })
    mockTransaction
      .mockRejectedValueOnce(conflict)
      .mockRejectedValueOnce(conflict)
      .mockResolvedValueOnce('committed')

    await expect(runSerializableTransaction(async () => 'result')).resolves.toBe('committed')
    expect(mockTransaction).toHaveBeenCalledTimes(3)
    for (const call of mockTransaction.mock.calls) {
      expect(call[1]).toEqual({ isolationLevel: 'Serializable' })
    }
  })

  it('does not retry unrelated infrastructure failures', async () => {
    const failure = new Error('connection unavailable')
    mockTransaction.mockRejectedValue(failure)

    await expect(runSerializableTransaction(async () => 'result')).rejects.toBe(failure)
    expect(mockTransaction).toHaveBeenCalledTimes(1)
  })

  it('stops after the bounded maximum number of conflicts', async () => {
    const conflict = Object.assign(new Error('write conflict'), { code: 'P2034' })
    mockTransaction.mockRejectedValue(conflict)

    await expect(runSerializableTransaction(async () => 'result')).rejects.toBe(conflict)
    expect(mockTransaction).toHaveBeenCalledTimes(3)
  })
})
