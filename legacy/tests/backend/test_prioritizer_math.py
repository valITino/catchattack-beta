from app.services.coverage.prioritizer import prioritize

# You can spin up a tiny in-memory DB if you want; here we just sanity-check interface via existing API tests.
def test_prioritizer_exists():
    assert callable(prioritize)
