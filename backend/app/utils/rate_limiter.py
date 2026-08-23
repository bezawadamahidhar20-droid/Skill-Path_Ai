import time
from fastapi import Request, HTTPException, status
from collections import defaultdict

# Simple sliding window token bucket rate limiter in memory
_request_counts = defaultdict(list)

def rate_limit(max_requests: int = 60, window_seconds: int = 60):
    """
    FastAPI dependency function that enforces rate limiting by IP address or client host.
    """
    async def dependency(request: Request):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        
        # Clean expired timestamps
        timestamps = [t for t in _request_counts[client_ip] if now - t < window_seconds]
        
        if len(timestamps) >= max_requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Maximum {max_requests} requests per {window_seconds} seconds."
            )
            
        timestamps.append(now)
        _request_counts[client_ip] = timestamps
        return True

    return dependency
