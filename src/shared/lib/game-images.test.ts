import { describe, expect, it } from 'vitest';
import { getGameImageUrl } from './game-images';

describe('getGameImageUrl', () => {
  it('resolves a local cover by slug and variant', () => {
    expect(getGameImageUrl('tiny-glade', 'card')).toContain('tiny-glade-card');
    expect(getGameImageUrl('tiny-glade', 'hero')).toContain('tiny-glade-hero');
  });

  it('returns an empty string for an unknown card', () => {
    expect(getGameImageUrl('unknown-game', 'card')).toBe('');
  });

  it('returns an empty string when neither hero nor card cover exists', () => {
    expect(getGameImageUrl('unknown-game', 'hero')).toBe('');
  });
});
