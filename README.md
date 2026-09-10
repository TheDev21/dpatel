# Weird Little Games

A collection of original, self-contained browser games. Static site, no
backend, no build step.

## Structure

- `index.html` — homepage, grid of game cards
- `support.html` — tip jar page (presets, custom amount, QR popup)
- `privacy.html` — privacy policy
- `games/<game-name>/` — each game is fully self-contained in its own
  folder, so new games can be added without touching existing ones

## Games

- **Doomscroll** (`games/doomscroll/`) — idle clicker satirizing infinite
  scroll. Progress saves to `localStorage`, Cookie Clicker style, so it
  carries over between visits. Includes a prestige loop ("go viral"):
  reset your run once you've scrolled far enough for permanent, stacking
  scroll-speed bonuses ("clout").
- **Startup Slot Machine** (`games/startup-slot-machine/`) — pull the
  lever, get a randomly generated absurd startup pitch with a rarity
  tier (common/rare/legendary/mythic). Three-reel spin with near-miss
  tension and WebAudio-generated sound effects (no audio files). Lifetime
  pull stats and pitch history saved to `localStorage`.
- Perfect Excuse, Daily Vibe Check, Stack the Nonsense — planned, not yet
  built.

## Style

- Background: light pink/cream (`#fbeae4` / `#fffaf7`)
- Ink text/borders: `#23201d` &middot; accents: orange `#ff5a1f`, red `#ff2d55`
- Display font: Bebas Neue &middot; body font: DM Mono

## Hosting

Static files only — deploy as-is to GitHub Pages, Vercel, or any static
host. No environment variables, no server process.
