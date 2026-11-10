import concurrent.futures
import importlib.util
import tempfile
import unittest
from pathlib import Path
spec = importlib.util.spec_from_file_location('counter', Path(__file__).parents[1] / 'server/counter.py')
counter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(counter)

class CounterTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        counter.DB = str(Path(self.temp.name) / 'counter.sqlite')
        counter.connect().close()
    def tearDown(self):
        self.temp.cleanup()
    def test_atomic_shared_increments_and_persistence(self):
        with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
            totals = list(pool.map(lambda i: counter.increment(str(i)), range(100)))
        self.assertEqual(sorted(totals), list(range(1, 101)))
        with counter.connect() as db:
            self.assertEqual(db.execute('SELECT total FROM counter').fetchone()[0], 100)
    def test_rate_limit_allows_repeated_clicks_and_recovers(self):
        for i in range(60): self.assertEqual(counter.increment('visitor', 120), i+1)
        self.assertIsNone(counter.increment('visitor', 120))
        self.assertEqual(counter.increment('visitor', 180), 61)

if __name__ == '__main__': unittest.main()

class RequestValidationTests(unittest.TestCase):
    def request(self, body=b'{}', origin='http://localhost:8000', content_type='application/json'):
        import io
        handler = object.__new__(counter.Handler)
        handler.path = '/api/hi'
        handler.headers = {'Origin': origin, 'Content-Type': content_type, 'Content-Length': str(len(body))}
        handler.rfile = io.BytesIO(body)
        replies = []
        handler.reply = lambda code, data: replies.append((code, data))
        handler.do_POST()
        return replies[0][0]
    def test_rejects_arbitrary_totals_and_reset(self):
        self.assertEqual(self.request(b'{"total":999}'), 400)
        self.assertEqual(self.request(b'{"reset":true}'), 400)
        self.assertEqual(self.request(b'[]'), 400)
    def test_rejects_cross_origin_and_wrong_content_type(self):
        self.assertEqual(self.request(origin='https://example.com'), 403)
        self.assertEqual(self.request(content_type='text/plain'), 400)
