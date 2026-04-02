const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const { resolveDbPath } = require("./config");

const dbPath = resolveDbPath();
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

function runMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS scrape_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      url TEXT,
      engine_used TEXT,
      raw_tokens INTEGER,
      cleaned_tokens INTEGER,
      tokens_saved INTEGER,
      reduction_percentage REAL
    );
  `);
}

runMigrations();

const insertHistoryStmt = db.prepare(`
  INSERT INTO scrape_history (
    url, engine_used, raw_tokens, cleaned_tokens, tokens_saved, reduction_percentage
  ) VALUES (
    @url, @engine_used, @raw_tokens, @cleaned_tokens, @tokens_saved, @reduction_percentage
  )
`);

const listHistoryStmt = db.prepare(`
  SELECT id, timestamp, url, engine_used, raw_tokens, cleaned_tokens, tokens_saved, reduction_percentage
  FROM scrape_history
  ORDER BY timestamp DESC, id DESC
  LIMIT ? OFFSET ?
`);

const countHistoryStmt = db.prepare(`SELECT COUNT(*) AS total FROM scrape_history`);

const statsStmt = db.prepare(`
  SELECT
    COUNT(*) AS total_requests,
    COALESCE(SUM(tokens_saved), 0) AS total_tokens_saved,
    CASE
      WHEN COALESCE(SUM(raw_tokens), 0) = 0 THEN 0
      ELSE (CAST(COALESCE(SUM(tokens_saved), 0) AS REAL) / NULLIF(SUM(raw_tokens), 0)) * 100
    END AS overall_reduction_percentage
  FROM scrape_history
`);

function insertScrapeHistory(row) {
  insertHistoryStmt.run(row);
}

function listScrapeHistory(limit, offset) {
  return listHistoryStmt.all(limit, offset);
}

function countScrapeHistory() {
  return countHistoryStmt.get().total;
}

function getAggregateStats() {
  return statsStmt.get();
}

module.exports = {
  runMigrations,
  insertScrapeHistory,
  listScrapeHistory,
  countScrapeHistory,
  getAggregateStats
};
