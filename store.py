import sqlite3
from .models import Profile, MatchRequest

class Store:
    def __init__(self, path):
        self.path = path
        with sqlite3.connect(path) as db:
            db.executescript('''
            CREATE TABLE IF NOT EXISTS profiles (
                user_id TEXT PRIMARY KEY,
                data TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS requests (
                from_user TEXT,
                to_user TEXT,
                zone TEXT,
                status TEXT DEFAULT 'pending',
                PRIMARY KEY(from_user, to_user)
            );
            CREATE TABLE IF NOT EXISTS blocks (
                from_user TEXT,
                to_user TEXT,
                PRIMARY KEY(from_user, to_user)
            );
            ''')

    def save_profile(self, profile: Profile):
        with sqlite3.connect(self.path) as db:
            db.execute(
                "INSERT OR REPLACE INTO profiles VALUES (?, ?)",
                (profile.user_id, profile.model_dump_json())
            )
            db.commit()

    def get_profile(self, user_id):
        with sqlite3.connect(self.path) as db:
            row = db.execute(
                "SELECT data FROM profiles WHERE user_id=?", (user_id,)
            ).fetchone()
        return Profile.model_validate_json(row[0]) if row else None

    def all_profiles(self):
        with sqlite3.connect(self.path) as db:
            rows = db.execute("SELECT data FROM profiles").fetchall()
        return [Profile.model_validate_json(row[0]) for row in rows]

    def add_request(self, req: MatchRequest):
        with sqlite3.connect(self.path) as db:
            db.execute(
                "INSERT OR REPLACE INTO requests(from_user,to_user,zone,status) VALUES(?,?,?,'pending')",
                (req.from_user, req.to_user, req.zone)
            )
            db.commit()

    def accept_request(self, a, b):
        with sqlite3.connect(self.path) as db:
            db.execute(
                "UPDATE requests SET status='matched' WHERE from_user=? AND to_user=?",
                (a, b)
            )
            db.commit()

    def block(self, a, b):
        with sqlite3.connect(self.path) as db:
            db.execute("INSERT OR IGNORE INTO blocks VALUES (?,?)", (a, b))
            db.execute("INSERT OR IGNORE INTO blocks VALUES (?,?)", (b, a))
            db.commit()

    def is_blocked(self, a, b):
        with sqlite3.connect(self.path) as db:
            row = db.execute(
                "SELECT 1 FROM blocks WHERE from_user=? AND to_user=?",
                (a, b)
            ).fetchone()
        return row is not None
