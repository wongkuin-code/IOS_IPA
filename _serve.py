import http.server, socketserver, os
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'web-build'))
class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
class S(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
S(('0.0.0.0', 8080), H).serve_forever()
