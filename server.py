#!/usr/bin/env python3
"""Simple server with API for content management."""

import json
import os
import shutil
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from datetime import datetime

PORT = 3001
CONTENT_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'content.json')

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.path.dirname(os.path.abspath(__file__)), **kwargs)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == '/api/content':
            self._send_json_file()
        else:
            super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == '/api/content':
            self._save_content()
        elif parsed.path == '/api/upload':
            self._upload_file()
        else:
            self.send_error(404)

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors_headers()
        self.end_headers()

    def _cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def _send_json_file(self):
        try:
            with open(CONTENT_FILE, 'r', encoding='utf-8') as f:
                data = f.read()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self._cors_headers()
            self.end_headers()
            self.wfile.write(data.encode('utf-8'))
        except Exception as e:
            self.send_error(500, str(e))

    def _save_content(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length).decode('utf-8')
            data = json.loads(body)

            # Backup current file
            if os.path.exists(CONTENT_FILE):
                backup = CONTENT_FILE + f'.backup.{datetime.now().strftime("%Y%m%d_%H%M%S")}'
                shutil.copy2(CONTENT_FILE, backup)

            with open(CONTENT_FILE, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self._cors_headers()
            self.end_headers()
            self.wfile.write(json.dumps({"success": True}).encode('utf-8'))
        except Exception as e:
            self.send_error(500, str(e))

    def _upload_file(self):
        try:
            content_type = self.headers.get('Content-Type', '')
            length = int(self.headers.get('Content-Length', 0))

            if 'multipart/form-data' not in content_type:
                self.send_error(400, 'Expected multipart/form-data')
                return

            body = self.rfile.read(length)
            boundary = content_type.split('boundary=')[1].encode()

            parts = body.split(b'--' + boundary)
            for part in parts:
                if b'filename="' in part:
                    # Extract filename
                    header_end = part.find(b'\r\n\r\n')
                    header = part[:header_end].decode('utf-8', errors='replace')
                    file_data = part[header_end + 4:]
                    if file_data.endswith(b'\r\n'):
                        file_data = file_data[:-2]

                    filename_start = header.find('filename="') + 10
                    filename_end = header.find('"', filename_start)
                    filename = header[filename_start:filename_end]

                    # Save to assets/images
                    upload_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'assets', 'images')
                    os.makedirs(upload_dir, exist_ok=True)
                    filepath = os.path.join(upload_dir, filename)

                    with open(filepath, 'wb') as f:
                        f.write(file_data)

                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json; charset=utf-8')
                    self._cors_headers()
                    self.end_headers()
                    result = json.dumps({"success": True, "path": f"assets/images/{filename}"})
                    self.wfile.write(result.encode('utf-8'))
                    return

            self.send_error(400, 'No file found in upload')
        except Exception as e:
            self.send_error(500, str(e))

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', PORT), Handler)
    print(f'🚀 Server running at http://localhost:{PORT}')
    print(f'📝 Admin panel: http://localhost:{PORT}/admin.html')
    print(f'🌐 Landing page: http://localhost:{PORT}/')
    server.serve_forever()
