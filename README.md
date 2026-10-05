# MiniGames

Single-page application for a fictional mini-games platform, built as part of the RS School qualifying stage.

## Description

MiniGames is a single-page application showcasing a catalog of browser mini-games: a hero section, a carousel of new games, a player leaderboard, a game library with filters, sorting and pagination, a game details dialog with comments, and authentication dialogs (login/sign-up). The project is built from scratch with vanilla TypeScript — no UI frameworks or routing libraries.

- Tasks: [Story 1](https://github.com/rolling-scopes-school/qualifying-stage/blob/main/tasks/minigames/story-1.md), [Story 2](https://github.com/rolling-scopes-school/qualifying-stage/blob/main/tasks/minigames/story-2.md), [Story 3](https://github.com/rolling-scopes-school/qualifying-stage/blob/main/tasks/minigames/story-3.md)
- Design (Figma): https://www.figma.com/design/vkFq0r8iaGVvluJUA3Rm0D/MiniGames--Copy-

## Features (Story 3)

- **Backend REST API** ([docs](https://faxb76kxra.execute-api.eu-central-1.amazonaws.com/docs)): featured games carousel, leaderboard, library games, categories, game details and latest comments are loaded from the API. Filtering, sorting and pagination are done by the server.
- **Feedback states**: skeleton loaders while requests are pending, error banners with retry, empty / "Data Not Found" placeholders and a reusable Snackbar for notifications.
- **Custom router** on the History API: `/` and `/home`, `/library`, and a 404 page for unknown paths. The URL is the single source of truth, so deep links and Back / Forward restore the page, Library state and dialogs:
  - `/library?category=puzzle&sort=name-asc&page=2`
  - `/library?category=arcade&page=2&game=tiny-glade`
  - `/?auth=login`, `/library?auth=register`
- Authenticated actions (favorites, posting and liking comments) are read-only until Story 4.

## Tech stack

- TypeScript
- HTML5
- Sass (SCSS)
- Vite
- ESLint + Prettier
- Husky + commitlint

## NPM scripts

| Script                 | Description                                                 |
| ---------------------- | ----------------------------------------------------------- |
| `npm run dev`          | Start the development server                                |
| `npm run build`        | Build the production bundle                                 |
| `npm run preview`      | Preview the production build locally                        |
| `npm run lint`         | Run ESLint                                                  |
| `npm run lint:fix`     | Run ESLint with autofix                                     |
| `npm run format`       | Format the codebase with Prettier                           |
| `npm run format:check` | Check formatting with Prettier                              |
| `npm run type-check`   | Run the TypeScript compiler in no-emit mode                 |
| `npm run visual-diff`  | Compare the built pages against Figma reference screenshots |

## Known deviations from the Figma mockup

- **Carousel card info overlay (mobile):** the task spec ([RSS-QS-1-4-4](https://github.com/rolling-scopes-school/qualifying-stage/blob/main/tasks/minigames/tasks/story-1/RSS-QS-1-4-4-carousel-slider.md)) requires the title/rating/likes overlay only on cards ≥288px wide. On the mobile mockup the center card is 218px wide but still shows the overlay, which contradicts the written rule. This implementation follows the written spec (no overlay below 288px) since that's what the automated/cross-check review scores against.

## Deployment

Live on GitHub Pages: https://skylive-skl.github.io/minigames/

Deployed automatically via GitHub Actions (`.github/workflows/deploy.yml`) on every push to `main`, `story-1` and `story-3`. The build also emits `404.html` (a copy of `index.html`) so deep links work on GitHub Pages.
