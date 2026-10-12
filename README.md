# MiniGames

Single-page application for a fictional mini-games platform, built as part of the RS School qualifying stage.

## Description

MiniGames is a single-page application showcasing a catalog of browser mini-games: a hero section, a carousel of new games, a player leaderboard, a game library with filters, sorting and pagination, a game details dialog with comments, and authentication dialogs (login/sign-up). The project is built from scratch with vanilla TypeScript — no UI frameworks or routing libraries.

- Tasks: [Story 1](https://github.com/rolling-scopes-school/qualifying-stage/blob/main/tasks/minigames/story-1.md), [Story 2](https://github.com/rolling-scopes-school/qualifying-stage/blob/main/tasks/minigames/story-2.md), [Story 3](https://github.com/rolling-scopes-school/qualifying-stage/blob/main/tasks/minigames/story-3.md), [Story 4](https://github.com/rolling-scopes-school/qualifying-stage/blob/main/tasks/minigames/story-4.md)
- Design (Figma): https://www.figma.com/design/vkFq0r8iaGVvluJUA3Rm0D/MiniGames--Copy-

## Features (Story 3)

- **Backend REST API** ([docs](https://faxb76kxra.execute-api.eu-central-1.amazonaws.com/docs)): featured games carousel, leaderboard, library games, categories, game details and latest comments are loaded from the API. Filtering, sorting and pagination are done by the server.
- **Feedback states**: skeleton loaders while requests are pending, error banners with retry, empty / "Data Not Found" placeholders and a reusable Snackbar for notifications.
- **Custom router** on the History API: `/` and `/home`, `/library`, and a 404 page for unknown paths. The URL is the single source of truth, so deep links and Back / Forward restore the page, Library state and dialogs:
  - `/library?category=puzzle&sort=name-asc&page=2`
  - `/library?category=arcade&page=2&game=tiny-glade`
  - `/?auth=login`, `/library?auth=register`

## Features (Story 4)

- **Firebase Authentication**: Email/Password sign-up and login, plus Google sign-in via popup. Forms validate in real time with inline errors, the submit button stays disabled while a form is invalid, and the whole dialog is locked (no double submit, no closing) while a request is pending.
- **App session**: after a successful sign-in the app stores a session record in `localStorage` under the key `minigames:skylive-minigames:app-session`. The record holds only `displayName`, `email`, `authenticatedAt` and an optional `avatarUrl`; no tokens or passwords.
  - The session lasts a fixed **5 minutes** from `authenticatedAt`. A page reload does not extend it.
  - The session is re-checked on start, before every route or dialog change, on a timer and when the tab regains focus. An expired, invalid or malformed record signs the user out of Firebase and returns the app to Guest Mode with a single notification.
  - Firebase's own `currentUser` is never used to restore the UI; only the app session counts.
- **Authenticated header**: the header and burger menu show the user's photo (or initials, or a generic avatar) with a Log Out button. Logout clears only the app session key and returns to Guest Mode on the current page.
- **Auth dialog guard**: a signed-in user cannot open Login / Sign Up; an `?auth=` deep link is removed from the URL in place and an info notification is shown.
- **Personalized Game Details** for signed-in users:
  - add / remove a game from favorites;
  - post a comment (Enter to send, Shift+Enter for a new line, 1–500 characters), after which the latest comments and the total count are refreshed;
  - like / unlike comments.

  The UI always shows the state returned by the server; buttons are locked while a request is pending. If the outcome is unknown (timeout or network failure), the app says so and never retries automatically. A guest who tries one of these actions gets a warning and the Login dialog (`?game=<slug>&auth=login`).

- **Unit tests**: Vitest + jsdom with V8 coverage; aggregate statement coverage is kept at 80%+ (enforced by the coverage threshold).

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the Firebase web app config
npm run dev
```

`.env.local` needs the Firebase web app config (Firebase Console → Project settings → Your apps):

| Variable                    | Value        |
| --------------------------- | ------------ |
| `VITE_FIREBASE_API_KEY`     | `apiKey`     |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID`  | `projectId`  |
| `VITE_FIREBASE_APP_ID`      | `appId`      |

In Firebase Authentication, enable the **Email/Password** and **Google** providers and add the deploy domain to **Authorized domains** (`localhost` is there by default). The GitHub Pages build reads the same values from repository Actions variables.

## Tech stack

- TypeScript
- HTML5
- Sass (SCSS)
- Vite
- ESLint + Prettier
- Husky + commitlint
- Firebase Authentication
- Vitest + jsdom + V8 coverage

## NPM scripts

| Script                  | Description                                                 |
| ----------------------- | ----------------------------------------------------------- |
| `npm run dev`           | Start the development server                                |
| `npm run build`         | Build the production bundle                                 |
| `npm run preview`       | Preview the production build locally                        |
| `npm run lint`          | Run ESLint                                                  |
| `npm run lint:fix`      | Run ESLint with autofix                                     |
| `npm run format`        | Format the codebase with Prettier                           |
| `npm run format:check`  | Check formatting with Prettier                              |
| `npm run type-check`    | Run the TypeScript compiler in no-emit mode                 |
| `npm test`              | Run the unit tests once                                     |
| `npm run test:watch`    | Run the unit tests in watch mode                            |
| `npm run test:coverage` | Run the unit tests with a coverage report (fails below 80%) |
| `npm run visual-diff`   | Compare the built pages against Figma reference screenshots |

## Known deviations from the Figma mockup

- **Carousel card info overlay (mobile):** the task spec ([RSS-QS-1-4-4](https://github.com/rolling-scopes-school/qualifying-stage/blob/main/tasks/minigames/tasks/story-1/RSS-QS-1-4-4-carousel-slider.md)) requires the title/rating/likes overlay only on cards ≥288px wide. On the mobile mockup the center card is 218px wide but still shows the overlay, which contradicts the written rule. This implementation follows the written spec (no overlay below 288px) since that's what the automated/cross-check review scores against.

## Deployment

Live on GitHub Pages: https://skylive-skl.github.io/minigames/

Deployed automatically via GitHub Actions (`.github/workflows/deploy.yml`) on every push to `main`, `story-1`, `story-3` and `story-4`. The build also emits `404.html` (a copy of `index.html`) so deep links work on GitHub Pages.
