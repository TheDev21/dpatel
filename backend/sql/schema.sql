-- Weird Little Games -- vote system schema
-- Run this once against your MySQL database.

CREATE TABLE IF NOT EXISTS games (
  slug      VARCHAR(64) NOT NULL PRIMARY KEY,
  likes     INT NOT NULL DEFAULT 0,
  dislikes  INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS votes (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  game_slug   VARCHAR(64) NOT NULL,
  -- voter_id is a random UUID the API hands out to a browser on its first
  -- vote (stored client-side in localStorage). It is NOT tied to any
  -- identity, account, email, or IP address -- it exists purely so the
  -- same browser can't be double-counted, and so a vote can be changed
  -- from like <-> dislike instead of stacking.
  voter_id    CHAR(36) NOT NULL,
  vote        ENUM('like','dislike') NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_game_voter (game_slug, voter_id),
  CONSTRAINT fk_votes_game FOREIGN KEY (game_slug) REFERENCES games(slug) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Seed rows for the games that exist today. The API also does this itself
-- on startup (INSERT IGNORE) for anything listed in its KnownGameSlugs
-- config, so this is optional -- handy if you want the table populated
-- before the API is even running.
INSERT IGNORE INTO games (slug) VALUES
  ('a-buck-through-time'),
  ('avoidle'),
  ('bad-advice'),
  ('doomscroll'),
  ('escape-the-bathroom'),
  ('give-it-a-minute'),
  ('how-long-is-a-minute'),
  ('keep-the-ball'),
  ('make-a-beat'),
  ('nothing'),
  ('perfect-excuse'),
  ('pi'),
  ('startup-slot-machine'),
  ('where-can-i-go');
