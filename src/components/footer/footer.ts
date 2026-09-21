import logoMarkUrl from '@/assets/icons/logo-mark.svg';
import { createElement } from '@/shared/lib/dom';
import { createCodeIcon } from '@/shared/ui/icon/icon';
import type { Component } from '@/shared/types/component';
import './footer.scss';

const HOME_HREF = '#/home';
const RS_SCHOOL_HREF = 'https://rs.school/courses/short-track';
const GITHUB_HREF = 'https://github.com/skylive-skl';
const GITHUB_HANDLE = '@skylive-skl';

function createBrand(): HTMLElement {
  const badge = createElement('img', {
    className: 'footer__logo-badge',
    attributes: { src: logoMarkUrl, alt: '', width: '32', height: '32' },
  });
  const text = createElement('span', { className: 'footer__logo-text', text: 'MiniGames' });
  const logo = createElement('a', {
    className: 'footer__logo',
    attributes: { href: HOME_HREF },
    children: [badge, text],
  });

  const description = createElement('p', {
    className: 'footer__description',
    text: 'Take a short break and have fun. Hundreds of curated casual mini-games right in your web browser. No download required.',
  });

  return createElement('div', { className: 'footer__brand', children: [logo, description] });
}

function createMetaLink(
  href: string,
  label: string,
  badge: HTMLElement | SVGElement,
): HTMLAnchorElement {
  return createElement('a', {
    className: 'footer__meta-link',
    attributes: { href, target: '_blank', rel: 'noopener noreferrer' },
    children: [badge, document.createTextNode(label)],
  });
}

function createBottomBar(): HTMLElement {
  const year = new Date().getFullYear();
  const copyright = createElement('p', {
    className: 'footer__copyright',
    text: `© ${String(year)} MiniGames. All rights reserved.`,
  });

  const rsBadge = createElement('span', {
    className: 'footer__badge footer__badge--rs',
    text: 'RS',
    attributes: { 'aria-hidden': 'true' },
  });
  const codeBadge = createElement('span', {
    className: 'footer__badge footer__badge--code',
    attributes: { 'aria-hidden': 'true' },
    children: [createCodeIcon()],
  });
  const meta = createElement('div', {
    className: 'footer__meta',
    children: [
      createMetaLink(RS_SCHOOL_HREF, 'RS School', rsBadge),
      createMetaLink(GITHUB_HREF, GITHUB_HANDLE, codeBadge),
    ],
  });

  const credit = createElement('p', { className: 'footer__credit', text: 'Designed with love' });

  return createElement('div', {
    className: 'footer__bottom',
    children: [copyright, meta, credit],
  });
}

export function createFooter(): Component {
  const top = createElement('div', { className: 'footer__top', children: [createBrand()] });
  const divider = createElement('hr', { className: 'footer__divider' });
  const inner = createElement('div', {
    className: 'footer__inner',
    children: [top, divider, createBottomBar()],
  });
  const element = createElement('footer', { className: 'footer', children: [inner] });

  return { element };
}
