"""Start and check the laptop-only preview without third-party dependencies."""

import argparse
import hashlib
import http.client
import logging
from logging.handlers import RotatingFileHandler
import os
from pathlib import Path
import socket
import subprocess
import sys
import time
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent
HOST = "127.0.0.1"
PORT = 5173
URL = f"http://{HOST}:{PORT}/"
PROJECT_ID = hashlib.sha256(str(ROOT).casefold().encode()).hexdigest()[:16]
LOG_DIR = ROOT / ".preview"


class PreviewHandler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".js": "application/javascript",
        ".mjs": "application/javascript",
        ".svg": "image/svg+xml",
        ".wav": "audio/wav",
    }

    def end_headers(self):
        self.send_header("X-TGS-Preview", PROJECT_ID)
        self.send_header("X-TGS-Preview-Pid", str(os.getpid()))
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def send_head(self):
        parts = Path(unquote(urlsplit(self.path).path)).parts
        if any(part.startswith(".") for part in parts):
            self.send_error(404)
            return None
        target = Path(self.translate_path(self.path)).resolve()
        if not target.is_relative_to(ROOT):
            self.send_error(404)
            return None
        return super().send_head()

    def list_directory(self, path):
        self.send_error(404)
        return None

    def log_message(self, message, *args):
        logging.info("%s %s", self.client_address[0], message % args)

    def handle(self):
        try:
            super().handle()
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            # Closing a browser tab is a normal client disconnect.
            pass


def health():
    """Check headers only; do not retrieve or inspect browser page content."""
    connection = http.client.HTTPConnection(HOST, PORT, timeout=1)
    try:
        connection.request("HEAD", "/index.html")
        response = connection.getresponse()
        return response.status == 200 and response.getheader("X-TGS-Preview") == PROJECT_ID
    except (OSError, http.client.HTTPException):
        return False
    finally:
        connection.close()


def port_in_use():
    try:
        with socket.create_connection((HOST, PORT), timeout=1):
            return True
    except OSError:
        return False


def serve():
    handler = partial(PreviewHandler, directory=str(ROOT))
    with ThreadingHTTPServer((HOST, PORT), handler) as server:
        logging.info("Preview started: %s (PID %s, folder %s)", URL, os.getpid(), ROOT)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            logging.info("Preview stopped from the console")


def start():
    if health():
        logging.info("Preview already running: %s", URL)
        return
    if port_in_use():
        raise RuntimeError("Port 5173 is occupied by another server. No process was stopped.")
    options = {
        "cwd": str(ROOT),
        "stdin": subprocess.DEVNULL,
        "stdout": subprocess.DEVNULL,
        "stderr": subprocess.DEVNULL,
    }
    if os.name == "nt":
        options["creationflags"] = subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP
    else:
        options["start_new_session"] = True
    process = subprocess.Popen([sys.executable, str(Path(__file__).resolve()), "serve"], **options)
    deadline = time.monotonic() + 10
    while time.monotonic() < deadline:
        if health():
            logging.info("Preview ready: %s (background PID %s)", URL, process.pid)
            return
        if process.poll() is not None:
            if health():
                return
            raise RuntimeError(f"Preview exited during startup. See {LOG_DIR / 'preview.log'}")
        time.sleep(.2)
    raise RuntimeError(f"Preview did not become ready. See {LOG_DIR / 'preview.log'}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("start", "serve", "status"), nargs="?", default="start")
    args = parser.parse_args()
    LOG_DIR.mkdir(exist_ok=True)
    handlers = [RotatingFileHandler(LOG_DIR / "preview.log", maxBytes=1_000_000, backupCount=2, encoding="utf-8")]
    if sys.stdout is not None:
        handlers.append(logging.StreamHandler(sys.stdout))
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s", handlers=handlers)
    try:
        if not (ROOT / "index.html").is_file():
            raise RuntimeError(f"The website's index.html is missing from {ROOT}")
        if args.command == "serve":
            serve()
        elif args.command == "start":
            start()
        elif health():
            logging.info("Preview healthy: %s", URL)
        else:
            raise RuntimeError("Preview is unavailable. Run Start Preview.cmd to restore it.")
        return 0
    except (OSError, RuntimeError) as error:
        logging.error("%s", error)
        return 1


if __name__ == "__main__":
    sys.exit(main())
