# Weird Little Games -- Vote API

Small ASP.NET Core (.NET 8) minimal API backing the like/dislike buttons on
the homepage. Plain ADO.NET via MySqlConnector, no ORM, no accounts.

This folder is source only -- it is not served by GitHub Pages. It is a
standard ASP.NET Core 8 project with no provider-specific code, plugins,
or connection strings, so it can run on any host capable of running a
.NET 8 web app plus reach a MySQL 8+ server. Which host you use is your
call -- this doc only lists what the environment needs to provide.

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

## What the runtime environment needs to provide

This project makes no assumptions about who hosts it. Whatever you run it
on needs to give it:

1. **A .NET 8 runtime (or the ASP.NET Core 8 runtime).** The project
   builds with a plain `dotnet publish -c Release`, which produces a
   self-contained set of files you can run with `dotnet GamesVoteApi.dll`
   on anything that has the .NET 8 (or ASP.NET Core 8) runtime installed
   -- a bare Linux box, a Windows server, or a container image built
   `FROM mcr.microsoft.com/dotnet/aspnet:8.0`. There is nothing in the
   code tying it to a specific OS or container platform.
2. **Network access to a MySQL 8+ server.** Same machine, a private
   network, or a managed MySQL instance elsewhere -- the API only needs a
   working connection string (see `ConnectionStrings__Default` below). It
   talks to MySQL over the standard MySQL protocol via MySqlConnector;
   nothing provider-specific.
3. **HTTPS in front of the API.** GitHub Pages serves the frontend over
   HTTPS, and browsers block a HTTPS page from calling a plain HTTP API
   (mixed content), so whatever's in front of this API -- a reverse proxy
   you run yourself (nginx, Caddy, IIS) or a host's own built-in TLS --
   needs to terminate HTTPS before traffic reaches the app.
4. **A way to set the environment variables listed below.** Every host
   that runs a process gives you some way to set environment variables
   for it; exactly how differs by host; the variable names themselves are
   standard ASP.NET Core configuration keys and don't change.

None of this requires a specific vendor. A single Linux VM with `systemd`
running `dotnet GamesVoteApi.dll` behind nginx satisfies all four points
just as well as any managed platform would.

## After it's deployed

Open `assets/vote-widget.js` in the frontend repo and change:
```js
var API_BASE = 'https://api.weirdlittlegames.lol';
```
to your real API's base URL, then commit and push. The homepage cards
will start showing live counts and letting people vote.
