# Weird Little Games -- Vote API

Small ASP.NET Core (.NET 8) minimal API backing the like/dislike buttons on
the homepage. Plain ADO.NET via MySqlConnector, no ORM, no accounts.

This folder is source only -- it is not served by GitHub Pages and needs
its own host (a VPS, a container, Azure App Service, etc.).

## What it stores

- `games` table: one row per game slug, with running `likes` / `dislikes`
  counts. This is what the API actually trusts for totals.
- `votes` table: one row per (game, anonymous voter id), so a browser can
  change its vote or click twice without it being counted extra. The
  voter id is a random UUID the API hands out on a browser's first vote --
  it is not an account, email, name, or IP address. If someone clears
  their browser storage they get a new id and can vote again; that's an
  accepted tradeoff for staying account-free.
- Nothing else. No IP address is ever written to the database or to logs.
  Per-IP rate limiting happens in memory only, inside the API process,
  and is forgotten the moment the limiting window passes.

## Setup

1. Create the database and run `sql/schema.sql` against it once:
   ```
   mysql -u youruser -p your_database < sql/schema.sql
   ```
2. Copy `appsettings.json` and fill in real values -- or, better for
   production, leave the file with placeholders and set these as
   environment variables instead (ASP.NET Core maps `Section__Key` to
   `Section:Key` automatically):

   | Environment variable            | Purpose                                           |
   |----------------------------------|----------------------------------------------------|
   | `ConnectionStrings__Default`     | Your MySQL connection string                       |
   | `Cors__AllowedOrigin`            | `https://weirdlittlegames.lol` (your GH Pages domain) |
   | `Stats__ApiKey`                  | A random string; if set, `/api/games/stats` requires header `X-Admin-Key: <value>`. Leave empty to leave it open (not recommended). |

   Never commit real credentials into `appsettings.json` -- keep that file
   with placeholder values in git and set the real ones as environment
   variables on whatever host runs the API.

3. Run locally to test:
   ```
   cd backend/GamesVoteApi
   dotnet restore
   dotnet run
   ```
   It listens on the URL printed in the console (usually
   `http://localhost:5000`). Point `API_BASE` in
   `assets/vote-widget.js` at that while testing locally, then switch it
   to your real API domain before it goes live.

## Deploying it somewhere

Any of these work; pick whichever you're already paying for or most
comfortable with:

- **A cheap VPS (DigitalOcean, Linode, etc.):** install the .NET 8
  runtime, `dotnet publish -c Release`, copy the output over, run it
  behind `systemd` + nginx (nginx does TLS termination and reverse-proxies
  to the app on localhost). This is the cheapest and most common route for
  a small API like this.
- **A container:** `dotnet publish` into a small Docker image based on
  `mcr.microsoft.com/dotnet/aspnet:8.0`, then run it on any host that
  takes containers (a VPS with Docker, Fly.io, Railway, etc.).
- **Azure App Service:** if you're already in the Azure/`.NET` ecosystem,
  this is the least manual-setup route -- deploy straight from the
  `backend/GamesVoteApi` folder, set the environment variables in the
  App Service configuration blade, done.

Whichever you pick, make sure:
- The API is served over HTTPS (required for GitHub Pages, which is
  itself HTTPS, to call it without mixed-content errors).
- MySQL is reachable from wherever the API runs (same host, a private
  network, or a managed MySQL instance with the API's IP allowed).
- The `Cors:AllowedOrigin` value exactly matches your GitHub Pages
  domain, including `https://`.

## After it's deployed

Open `assets/vote-widget.js` in the frontend repo and change:
```js
var API_BASE = 'https://api.weirdlittlegames.lol';
```
to your real API's base URL, then commit and push. The homepage cards
will start showing live counts and letting people vote.
