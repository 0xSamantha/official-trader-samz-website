"""Shared hello API; standard library only. Run behind an HTTPS reverse proxy."""
import json
import os
import sqlite3
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

DB = os.environ.get('COUNTER_DB', '/tmp/samantha-hello.sqlite3')
ORIGIN = os.environ.get('COUNTER_ORIGIN', 'http://localhost:8000')

def connect():
    db = sqlite3.connect(DB, timeout=10)
    db.execute('CREATE TABLE IF NOT EXISTS counter (id INTEGER PRIMARY KEY CHECK(id=1), total INTEGER NOT NULL)')
    db.execute('INSERT OR IGNORE INTO counter VALUES (1, 0)')
    db.execute('CREATE TABLE IF NOT EXISTS limits (client TEXT PRIMARY KEY, bucket INTEGER NOT NULL, hits INTEGER NOT NULL)')
    db.commit()
    return db

def increment(client, now=None):
    bucket = int(time.time() if now is None else now) // 60
    with connect() as db:
        db.execute('BEGIN IMMEDIATE')
        row = db.execute('SELECT bucket, hits FROM limits WHERE client=?', (client,)).fetchone()
        if row and row[0] == bucket and row[1] >= 60:
            return None
        hits = row[1] + 1 if row and row[0] == bucket else 1
        db.execute('INSERT OR REPLACE INTO limits VALUES (?, ?, ?)', (client, bucket, hits))
        db.execute('DELETE FROM limits WHERE bucket < ?', (bucket - 2,))
        db.execute('UPDATE counter SET total=total+1 WHERE id=1')
        return db.execute('SELECT total FROM counter WHERE id=1').fetchone()[0]

class Handler(BaseHTTPRequestHandler):
    def reply(self, code, payload):
        body = json.dumps(payload).encode()
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path != '/api/hi':
            return self.reply(404, {'error': 'Not found'})
        try:
            with connect() as db:
                total = db.execute('SELECT total FROM counter WHERE id=1').fetchone()[0]
            self.reply(200, {'total': total})
        except sqlite3.Error:
            self.reply(503, {'error': 'Storage unavailable'})

    def do_POST(self):
        if self.path != '/api/hi':
            return self.reply(404, {'error': 'Not found'})
        # Strict origin, JSON shape and size. No totals, reset commands, or CORS.
        if self.headers.get('Origin') != ORIGIN:
            return self.reply(403, {'error': 'Origin rejected'})
        if self.headers.get('Content-Type') != 'application/json' or self.headers.get('Transfer-Encoding'):
            return self.reply(400, {'error': 'Expected JSON'})
        try:
            size = int(self.headers.get('Content-Length', '-1'))
            if size < 0 or size > 32 or json.loads(self.rfile.read(size)) != {}:
                raise ValueError()
        except (ValueError, json.JSONDecodeError):
            return self.reply(400, {'error': 'Only an empty JSON object is accepted'})
        try:
            # The proxy must overwrite this header; bind only on loopback.
            client = self.headers.get('X-Real-IP') or self.client_address[0]
            total = increment(client)
            self.reply(429 if total is None else 200, {'error': 'Rate limited'} if total is None else {'total': total})
        except sqlite3.Error:
            self.reply(503, {'error': 'Storage unavailable'})

if __name__ == '__main__':
    ThreadingHTTPServer(('127.0.0.1', int(os.environ.get('COUNTER_PORT', '8001'))), Handler).serve_forever()
