import { describe, it, expect } from 'vitest';
import {
  AVATAR_COLOR_POOL,
  getAvatarColor,
  getInitials,
} from './avatar-color';

describe('getAvatarColor', () => {
  it('returns the color at the given slot index', () => {
    expect(getAvatarColor(0)).toBe(AVATAR_COLOR_POOL[0]);
    expect(getAvatarColor(3)).toBe(AVATAR_COLOR_POOL[3]);
  });

  it('wraps around when slot exceeds pool size', () => {
    const poolSize = AVATAR_COLOR_POOL.length;
    expect(getAvatarColor(poolSize)).toBe(AVATAR_COLOR_POOL[0]);
    expect(getAvatarColor(poolSize + 5)).toBe(AVATAR_COLOR_POOL[5]);
  });

  it('returns a fallback color for null or undefined slot', () => {
    const fallback = getAvatarColor(null);
    expect(fallback).toMatch(/^#[0-9a-f]{6}$/i);

    const fallback2 = getAvatarColor(undefined);
    expect(fallback2).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe('getInitials', () => {
  it('returns first letter of first name + first letter of last name', () => {
    expect(getInitials('Sarah', 'Chen')).toBe('SC');
  });

  it('uppercases the initials', () => {
    expect(getInitials('sarah', 'chen')).toBe('SC');
  });

  it('handles single name by returning first two chars', () => {
    expect(getInitials('Sarah')).toBe('SA');
  });

  it('falls back to first two chars of email when no names provided', () => {
    expect(getInitials(undefined, undefined, 'sarah@example.com')).toBe('SA');
  });

  it('uppercases initials derived from email', () => {
    expect(getInitials(undefined, undefined, 'alex@example.com')).toBe('AL');
  });

  it('returns empty string when no input at all', () => {
    expect(getInitials()).toBe('');
  });
});
