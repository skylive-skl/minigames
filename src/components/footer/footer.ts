import logoMarkUrl from '@/assets/icons/logo-mark.svg';
import { createElement } from '@/shared/lib/dom';
import {
  createCodeIcon,
  createMessageIcon,
  createRssIcon,
  createShareIcon,
} from '@/shared/ui/icon/icon';
import type { Component } from '@/shared/types/component';
import './footer.scss';

const HOME_HREF = '#/home';
const RS_SCHOOL_HREF = 'https://rs.school/courses/short-track';
const GITHUB_HREF = 'https://github.com/skylive-skl';
const GITHUB_HANDLE = '@skylive-skl';

interface NavColumn {
  readonly heading: string;
  readonly links: readonly string[];
}

const NAV_COLUMNS: readonly NavColumn[] = [
  { heading: 'Explore', links: ['Home', 'Library', 'Categories', 'Tournaments'] },
  { heading: 'Company', links: ['About Us', 'Contact', 'Privacy Policy', 'Terms of Service'] },
];

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

function createNavColumn(column: NavColumn): HTMLElement {
  const heading = createElement('h3', {
    className: 'footer__nav-heading',
    text: column.heading,
  });
  const list = createElement('ul', {
    className: 'footer__nav-list',
    children: column.links.map((label) =>
      createElement('li', {
        children: [
          createElement('a', {
            className: 'footer__nav-link',
            text: label,
            attributes: { href: HOME_HREF },
          }),
        ],
      }),
    ),
  });

  return createElement('nav', {
    className: 'footer__nav',
    attributes: { 'aria-label': column.heading },
    children: [heading, list],
  });
}

function createSocialLink(label: string, icon: SVGElement): HTMLAnchorElement {
  return createElement('a', {
    className: 'footer__social-link',
    attributes: { href: HOME_HREF, 'aria-label': label },
    children: [icon],
  });
}

function createCommunity(): HTMLElement {
  const heading = createElement('h3', { className: 'footer__nav-heading', text: 'Community' });
  const social = createElement('div', {
    className: 'footer__social',
    children: [
      createSocialLink('Share MiniGames', createShareIcon()),
      createSocialLink('Community chat', createMessageIcon()),
      createSocialLink('RSS feed', createRssIcon()),
    ],
  });

  return createElement('div', { className: 'footer__community', children: [heading, social] });
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
  const top = createElement('div', {
    className: 'footer__top',
    children: [
      createBrand(),
      ...NAV_COLUMNS.map((column) => createNavColumn(column)),
      createCommunity(),
    ],
  });

  const divider = createElement('hr', { className: 'footer__divider' });

  const inner = createElement('div', {
    className: 'footer__inner',
    children: [top, divider, createBottomBar()],
  });

  const element = createElement('footer', { className: 'footer', children: [inner] });

  return { element };
}
