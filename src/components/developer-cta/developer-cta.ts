import illustrationUrl from '@/assets/images/dev-cta-illustration.png';
import { createElement } from '@/shared/lib/dom';
import { createUploadIcon } from '@/shared/ui/icon/icon';
import type { Component } from '@/shared/types/component';
import './developer-cta.scss';

const CONTACT_EMAIL = 'developers@minigames.com';

function createIllustration(): HTMLElement {
  const image = createElement('img', {
    className: 'dev-cta__illustration-image',
    attributes: { src: illustrationUrl, alt: '', width: '1364', height: '966' },
  });

  return createElement('div', { className: 'dev-cta__illustration', children: [image] });
}

function createCard(): HTMLElement {
  const heading = createElement('h2', {
    className: 'dev-cta__heading',
    text: 'Are You a Game Developer?',
  });

  const text = createElement('p', {
    className: 'dev-cta__text',
    text: "Want to see your game on MiniGames? We're always looking for fun, engaging mini games to add to our platform. Submit your game and reach thousands of players!",
  });

  const button = createElement('button', {
    className: 'dev-cta__button',
    attributes: { type: 'button' },
    children: [createUploadIcon(), createElement('span', { text: 'Submit Form' })],
  });

  const contactLink = createElement('a', {
    className: 'dev-cta__contact-link',
    text: CONTACT_EMAIL,
    attributes: { href: `mailto:${CONTACT_EMAIL}` },
  });
  const contact = createElement('p', {
    className: 'dev-cta__contact',
    children: [document.createTextNode('or contact us at '), contactLink],
  });

  return createElement('div', {
    className: 'dev-cta__card',
    children: [heading, text, button, contact],
  });
}

export function createDeveloperCta(): Component {
  const element = createElement('section', {
    className: 'dev-cta',
    attributes: { 'aria-label': 'Are You a Game Developer?' },
    children: [createIllustration(), createCard()],
  });

  return { element };
}
