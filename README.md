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

- **Keep the Ball From Falling** (`games/keep-the-ball/`) — a ball falls,
  you move a paddle with your mouse/finger to bounce it, gravity ramps up
  the longer you survive. Canvas + hand-rolled physics (gravity, velocity,
  bounce, paddle-position deflection), no physics library. Best time
  saved to `localStorage`.
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
- **Perfect Excuse** (`games/perfect-excuse/`) — Password-Game-style:
  pick a scenario, then write an excuse that has to satisfy an
  increasing list of contradictory rules revealed one at a time. Rules
  stay live once shown, so editing earlier text can break one you
  already passed. The day's exact rule set is deterministically seeded
  from today's date, so it's the same challenge for everyone until it
  resets at midnight. In-progress excuse saved to `localStorage` for the
  day.
- Daily Vibe Check, Stack the Nonsense — planned, not yet built.

## Style

- Background: light pink/cream (`#fbeae4` / `#fffaf7`)
- Ink text/borders: `#23201d` &middot; accents: orange `#ff5a1f`, red `#ff2d55`
- Display font: Bebas Neue &middot; body font: DM Mono

## Hosting

Static files only — deploy as-is to GitHub Pages, Vercel, or any static
host. No environment variables, no server process.
