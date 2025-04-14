import unittest
import http.server
import socketserver
import threading
import requests

PORT = 8000

class TestWebServer(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        Handler = http.server.SimpleHTTPRequestHandler
        cls.httpd = socketserver.TCPServer(("", PORT), Handler)
        cls.server_thread = threading.Thread(target=cls.httpd.serve_forever)
        cls.server_thread.daemon = True
        cls.server_thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.server_thread.join()

    def test_server_running(self):
        response = requests.get(f'http://localhost:{PORT}')
        self.assertEqual(response.status_code, 200)

    def test_server_response(self):
        response = requests.get(f'http://localhost:{PORT}')
        self.assertIn('Directory listing for', response.text)

if __name__ == '__main__':
    unittest.main()
