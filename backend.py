import json
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
LEADERBOARD_FILE = DATA_DIR / "leaderboard.json"
LEADERBOARD_CHALLENGE_FILE = DATA_DIR / "leaderboard_challenge.json"
HIGHSCORE_FILE = DATA_DIR / "highscore.json"
ACCOUNTS_FILE = DATA_DIR / "accounts.json"
LEGACY_ACCOUNT_FILE = DATA_DIR / "account.json"

DATA_DIR.mkdir(exist_ok=True)


def _read_json(path, default):
    if not path.exists():
        return default
    try:
        with path.open("r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default


def _write_json(path, data):
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def _load_accounts():
    accounts = _read_json(ACCOUNTS_FILE, [])
    if not isinstance(accounts, list):
        accounts = []
    if LEGACY_ACCOUNT_FILE.exists():
        legacy = _read_json(LEGACY_ACCOUNT_FILE, {})
        if isinstance(legacy, dict) and legacy.get("username"):
            if not any(a.get("username") == legacy["username"] for a in accounts if isinstance(a, dict)):
                accounts.append({"username": legacy.get("username", ""), "password": legacy.get("password", "")})
            _write_json(ACCOUNTS_FILE, accounts)
    return accounts


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(BASE_DIR), **kwargs)

    def _send_json(self, data, status=200):
        raw = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def _read_body_json(self):
        length = int(self.headers.get("Content-Length", "0"))
        if length <= 0:
            return None
        raw = self.rfile.read(length)
        try:
            return json.loads(raw.decode("utf-8"))
        except Exception:
            return None

    def do_GET(self):
        if self.path == "/api/health":
            return self._send_json({"ok": True})
        if self.path == "/api/leaderboard":
            data = _read_json(LEADERBOARD_FILE, [])
            return self._send_json({"leaderboard": data})
        if self.path == "/api/leaderboard_challenge":
            data = _read_json(LEADERBOARD_CHALLENGE_FILE, [])
            return self._send_json({"leaderboard": data})
        if self.path == "/api/highscore":
            data = _read_json(HIGHSCORE_FILE, {"highscore": 0})
            return self._send_json(data)
        return super().do_GET()

    def do_POST(self):
        if self.path == "/api/leaderboard":
            body = self._read_body_json() or {}
            leaderboard = body.get("leaderboard", [])
            if not isinstance(leaderboard, list):
                return self._send_json({"error": "leaderboard must be list"}, status=400)
            _write_json(LEADERBOARD_FILE, leaderboard)
            return self._send_json({"ok": True})
        if self.path == "/api/leaderboard_challenge":
            body = self._read_body_json() or {}
            leaderboard = body.get("leaderboard", [])
            if not isinstance(leaderboard, list):
                return self._send_json({"error": "leaderboard must be list"}, status=400)
            _write_json(LEADERBOARD_CHALLENGE_FILE, leaderboard)
            return self._send_json({"ok": True})
        if self.path == "/api/highscore":
            body = self._read_body_json() or {}
            highscore = body.get("highscore", 0)
            if not isinstance(highscore, int):
                return self._send_json({"error": "highscore must be int"}, status=400)
            _write_json(HIGHSCORE_FILE, {"highscore": highscore})
            return self._send_json({"ok": True})
        if self.path == "/api/register":
            body = self._read_body_json() or {}
            username = body.get("username", "")
            password = body.get("password", "")
            if not isinstance(username, str) or not isinstance(password, str) or not username:
                return self._send_json({"error": "invalid account payload"}, status=400)
            accounts = _load_accounts()
            if any(a.get("username") == username for a in accounts if isinstance(a, dict)):
                return self._send_json({"error": "exists"}, status=409)
            accounts.append({"username": username, "password": password})
            _write_json(ACCOUNTS_FILE, accounts)
            return self._send_json({"ok": True})
        if self.path == "/api/login":
            body = self._read_body_json() or {}
            username = body.get("username", "")
            password = body.get("password", "")
            if not isinstance(username, str) or not isinstance(password, str) or not username:
                return self._send_json({"error": "invalid account payload"}, status=400)
            accounts = _load_accounts()
            ok = any(a.get("username") == username and a.get("password") == password for a in accounts if isinstance(a, dict))
            return self._send_json({"ok": bool(ok)})
        return self._send_json({"error": "not found"}, status=404)


if __name__ == "__main__":
    host = "0.0.0.0"
    port = int(os.environ.get('PORT', '8000'))
    print(f"Serving on http://{host}:{port}")
    server = ThreadingHTTPServer((host, port), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()

