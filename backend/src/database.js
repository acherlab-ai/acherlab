import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, '../data.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    plan TEXT DEFAULT 'free',
    plan_expires_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    key TEXT UNIQUE NOT NULL,
    max_cpu INTEGER DEFAULT 10,
    max_ram INTEGER DEFAULT 10,
    max_disk INTEGER DEFAULT 30,
    total_cpu INTEGER DEFAULT 0,
    total_ram INTEGER DEFAULT 0,
    total_disk INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_by TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sandboxes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    api_key_id TEXT,
    daytona_id TEXT,
    name TEXT,
    plan TEXT NOT NULL,
    cpu INTEGER NOT NULL,
    ram INTEGER NOT NULL,
    disk INTEGER NOT NULL,
    ssh_token TEXT,
    ssh_command TEXT,
    expires_at TEXT,
    started_at TEXT DEFAULT (datetime('now')),
    stopped_at TEXT,
    status TEXT DEFAULT 'creating',
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (api_key_id) REFERENCES api_keys(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

const hashedPassword = bcrypt.hashSync('Hn0961718254@', 10);

const existing = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
if (!existing) {
  db.prepare('INSERT INTO users (id, username, email, password, plan) VALUES (?, ?, ?, ?, ?)').run(
    uuidv4(), 'admin', 'admin@acherlab.xyz', hashedPassword, 'admin'
  );
}

export default db;
