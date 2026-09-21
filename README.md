# MiniGames

Landing page for a fictional mini-games platform, built as part of the RS School qualifying stage (Story 1).

## Description

MiniGames is a single-page application showcasing a catalog of browser mini-games: a hero section, a carousel of new games, a player leaderboard, a call-to-action for game developers, and authentication dialogs (login/sign-up). The project is built from scratch with vanilla TypeScript — no UI frameworks.

- Task: https://github.com/rolling-scopes-school/qualifying-stage/blob/main/tasks/minigames/story-1.md
- Design (Figma): https://www.figma.com/design/vkFq0r8iaGVvluJUA3Rm0D/MiniGames--Copy-

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

Deployed automatically via GitHub Actions (`.github/workflows/deploy.yml`) on every push to `main`.
