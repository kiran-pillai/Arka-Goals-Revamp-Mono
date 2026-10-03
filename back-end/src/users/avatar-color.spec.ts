import { AVATAR_COLOR_POOL, assignColorSlot } from './avatar-color';

describe('assignColorSlot', () => {
  it('assigns slot 0 when no slots are in use', () => {
    expect(assignColorSlot([])).toBe(0);
  });

  it('assigns the next sequential slot when all prior are taken', () => {
    expect(assignColorSlot([0, 1, 2])).toBe(3);
  });

  it('fills the lowest gap when a middle slot is freed', () => {
    expect(assignColorSlot([0, 2, 3])).toBe(1);
  });

  it('fills the lowest gap when the first slot is freed', () => {
    expect(assignColorSlot([1, 2, 3])).toBe(0);
  });

  it('fills multiple gaps starting from the lowest', () => {
    // Slots 1 and 3 are free
    expect(assignColorSlot([0, 2, 4])).toBe(1);
  });

  it('handles non-sequential input order', () => {
    expect(assignColorSlot([3, 0, 2])).toBe(1);
  });

  it('handles duplicate slot values gracefully', () => {
    expect(assignColorSlot([0, 0, 1, 1])).toBe(2);
  });
});

describe('AVATAR_COLOR_POOL', () => {
  it('contains 50 colors', () => {
    expect(AVATAR_COLOR_POOL).toHaveLength(50);
  });

  it('contains only valid hex color strings', () => {
    for (const color of AVATAR_COLOR_POOL) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('contains no duplicate colors', () => {
    const unique = new Set(AVATAR_COLOR_POOL.map((c) => c.toLowerCase()));
    expect(unique.size).toBe(AVATAR_COLOR_POOL.length);
  });
});
