# Weird Little Games

A collection of original, self-contained browser games. Static site, no
backend, no build step.

## Structure

- `index.html` — homepage, grid of game cards
- `style.css` — shared homepage styles (fonts, colors)
- `games/<game-name>/` — each game is fully self-contained in its own
  folder, so new games can be added without touching existing ones

## Games

- **Doomscroll** (`games/doomscroll/`) — idle clicker satirizing infinite
  scroll. Saves progress to `localStorage`.
- Perfect Excuse, Daily Vibe Check, Stack the Nonsense — planned, not yet
  built.

## Style

- Background: near-black (`#0a0a0a` / `#08080a`)
- Accents: orange `#ff5a1f`, red `#ff2d55`, used sparingly
- Display font: Bebas Neue &middot; body font: DM Mono

## Hosting

Static files only — deploy as-is to GitHub Pages, Vercel, or any static
host. No environment variables, no server process.
