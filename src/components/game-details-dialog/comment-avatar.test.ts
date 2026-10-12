import { describe, expect, it } from 'vitest';
import { AVATAR_RANDOM_COLORS, createAvatarColorPicker, getAvatarInitial } from './comment-avatar';
import { createGameDetailsComments } from './game-details-comments';
import type { GameComment } from '@/shared/types/game';

function sequence(...values: number[]): () => number {
  let call = 0;
  return () => values[call++ % values.length] ?? 0;
}

describe('createAvatarColorPicker', () => {
  it('picks only avatar-random design tokens', () => {
    const pick = createAvatarColorPicker(sequence(0, 0.99, 0.5));

    expect(pick('Ann')).toBe('var(--color-avatar-1)');
    expect(pick('Bob')).toBe('var(--color-avatar-5)');
    expect(pick('Cid')).toBe('var(--color-avatar-3)');
    expect(AVATAR_RANDOM_COLORS).toHaveLength(5);
  });

  it('keeps the first color for a commenter on later calls', () => {
    const pick = createAvatarColorPicker(sequence(0.1, 0.9));

    const first = pick('ForestDweller');

    expect(pick('ForestDweller')).toBe(first);
    expect(pick('  ForestDweller ')).toBe(first);
  });

  it('starts fresh for a new comments view', () => {
    const firstView = createAvatarColorPicker(sequence(0));
    const secondView = createAvatarColorPicker(sequence(0.99));

    expect(firstView('Ann')).not.toBe(secondView('Ann'));
  });
});

describe('getAvatarInitial', () => {
  it.each([
    ['forest', 'F'],
    ['  élodie', 'É'],
    ['иван', 'И'],
    ['42gamer', '4'],
    ['😀 Smile', '😀'],
    [' '.repeat(3), ''],
  ])('uses the first non-whitespace character of "%s"', (name, expected) => {
    expect(getAvatarInitial(name)).toBe(expected);
  });
});

function commentAvatars(section: HTMLElement): HTMLElement[] {
  const list = section.querySelector('.game-details-dialog__comments-list');
  return list === null
    ? []
    : [...list.querySelectorAll<HTMLElement>('.game-details-dialog__avatar')];
}

describe('comment avatars in the comments view', () => {
  const comment: GameComment = {
    commentId: 'c1',
    authorName: 'forestDweller',
    text: 'Lovely',
    likesCount: 0,
    isLikedByCurrentUser: false,
    createdAt: '2026-10-01T00:00:00Z',
  };
  const comments = [comment, { ...comment, commentId: 'c2', authorName: 'Ann' }];

  it('renders initials and keeps colors stable across re-renders', () => {
    const view = createGameDetailsComments();

    view.showComments(comments, 2);
    const firstColors = commentAvatars(view.element).map((avatar) => avatar.style.backgroundColor);
    view.showComments(comments, 2);
    const secondColors = commentAvatars(view.element).map((avatar) => avatar.style.backgroundColor);

    expect(secondColors).toEqual(firstColors);
    expect(firstColors[0]).toMatch(/var\(--color-avatar-[1-5]\)/u);
    expect(commentAvatars(view.element).map((avatar) => avatar.textContent)).toEqual(['F', 'A']);
  });
});
