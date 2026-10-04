// Vite exposes the deploy base ("/minigames/"); every app URL lives under it.
// Kept free of imports so components can use it without a cycle through routes.
export const BASE_PATH = import.meta.env.BASE_URL;

// "/library?page=2" -> "/minigames/library?page=2"
export function buildHref(to: string): string {
  return `${BASE_PATH}${to.replace(/^\/+/u, '')}`;
}

export const HOME_HREF = buildHref('/');
export const LIBRARY_HREF = buildHref('/library');
