#!/usr/bin/env python3
import http.server
import socketserver
import urllib.request
import urllib.parse
import sys
from urllib.error import URLError

HOST_IP = "172.16.6.89"
MINIKUBE_IP = "192.168.49.2"

class BackstageProxy(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # Determine target based on path
            if self.path.startswith('/auth') or self.path == '/auth':
                target_url = f"http://{MINIKUBE_IP}:30400{self.path}"
            else:
                target_url = f"http://{MINIKUBE_IP}:30300{self.path}"
            
            print(f"[PROXY] Forwarding {self.path} to {target_url}")
            
            # Forward request
            req = urllib.request.Request(target_url)
            with urllib.request.urlopen(req, timeout=10) as response:
                self.send_response(response.getcode())
                for header, value in response.headers.items():
                    if header.lower() not in ['connection', 'transfer-encoding']:
                        self.send_header(header, value)
                self.end_headers()
                self.wfile.write(response.read())
                
        except URLError as e:
            self.send_response(502)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(f"Proxy Error: {str(e)}".encode())
    
    def do_POST(self):
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            # Determine target based on path
            if self.path.startswith('/auth') or self.path == '/auth':
                target_url = f"http://{MINIKUBE_IP}:30400{self.path}"
            else:
                target_url = f"http://{MINIKUBE_IP}:30300{self.path}"
            
            print(f"[PROXY] POST {self.path} to {target_url}")
            
            # Forward request
            req = urllib.request.Request(target_url, data=post_data, method='POST')
            for header, value in self.headers.items():
                if header.lower() not in ['host', 'connection']:
                    req.add_header(header, value)
            
            with urllib.request.urlopen(req, timeout=10) as response:
                self.send_response(response.getcode())
                for header, value in response.headers.items():
                    if header.lower() not in ['connection', 'transfer-encoding']:
                        self.send_header(header, value)
                self.end_headers()
                self.wfile.write(response.read())
                
        except URLError as e:
            self.send_response(502)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(f"Proxy Error: {str(e)}".encode())
    
    def log_message(self, format, *args):
        print(f"[PROXY] {format % args}")

if __name__ == "__main__":
    PORT = 9090
    try:
        with socketserver.TCPServer(("0.0.0.0", PORT), BackstageProxy) as httpd:
            print(f"🔗 Backstage Proxy serving on http://0.0.0.0:{PORT}")
            print(f"   Main Server: http://{HOST_IP}:{PORT}/")
            print(f"   Auth Server: http://{HOST_IP}:{PORT}/auth")
            print(f"   Health Check: http://{HOST_IP}:{PORT}/health")
            print(f"   Forwarding to Minikube at {MINIKUBE_IP}")
            httpd.serve_forever()
    except Exception as e:
        print(f"Error starting proxy: {e}")
        sys.exit(1)