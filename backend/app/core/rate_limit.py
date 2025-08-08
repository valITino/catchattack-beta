import time
from collections import defaultdict, deque
from typing import Deque, Dict

from .config import settings

class RateLimiter:
    def __init__(self, max_per_min: int = 10):
        self.max = max_per_min
        self.win = 60.0
        self.events: Dict[str, Deque[float]] = defaultdict(deque)

    def allow(self, key: str) -> bool:
        now = time.time()
        q = self.events[key]
        while q and now - q[0] > self.win:
            q.popleft()
        if len(q) >= self.max:
            return False
        q.append(now)
        return True

rl = RateLimiter(settings.ai_rate_limit_per_min)
