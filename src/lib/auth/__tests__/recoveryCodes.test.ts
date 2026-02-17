import { describe, expect, it, vi } from 'vitest';

import {
  consumeRecoveryCode,
  generateRecoveryCodes,
  hashRecoveryCode,
  rotateRecoveryCodes,
} from '../recoveryCodes';

describe('recoveryCodes', () => {
  it('generates unique formatted recovery codes', () => {
    const codes = generateRecoveryCodes(10);

    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
    for (const code of codes) {
      expect(code).toMatch(/^[A-F0-9]{4}(?:-[A-F0-9]{4}){4}$/);
    }
  });

  it('hashes normalized recovery codes deterministically', () => {
    const a = hashRecoveryCode('abcd-1234-abcd-1234-abcd');
    const b = hashRecoveryCode('ABCD1234ABCD1234ABCD');

    expect(a).toBe(b);
  });

  it('consumes a valid one-time code', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const consumed = await consumeRecoveryCode({
      prisma: {
        userRecoveryCode: {
          updateMany,
          createMany: vi.fn(),
        },
      },
      userId: 'user-1',
      recoveryCode: 'ABCD-1234-ABCD-1234-ABCD',
      now: new Date('2026-02-17T12:00:00.000Z'),
    });

    expect(consumed).toBe(true);
    expect(updateMany).toHaveBeenCalledTimes(1);
  });

  it('rotates codes by revoking current and creating new hashes', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 3 });
    const createMany = vi.fn().mockResolvedValue({ count: 10 });

    const result = await rotateRecoveryCodes({
      prisma: {
        userRecoveryCode: {
          updateMany,
          createMany,
        },
      },
      userId: 'user-1',
      count: 10,
      now: new Date('2026-02-17T12:00:00.000Z'),
    });

    expect(result.codes).toHaveLength(10);
    expect(result.revokedCount).toBe(3);
    expect(result.createdCount).toBe(10);
    expect(updateMany).toHaveBeenCalledTimes(1);
    expect(createMany).toHaveBeenCalledTimes(1);
  });
});
