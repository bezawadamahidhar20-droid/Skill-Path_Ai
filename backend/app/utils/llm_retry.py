import time
import logging
from typing import Callable, Any

logger = logging.getLogger("llm_retry")

def call_with_retry_and_fallback(
    primary_fn: Callable[[], Any],
    fallback_fn: Callable[[], Any],
    max_retries: int = 2,
    initial_delay: float = 0.5,
    backoff_factor: float = 2.0
) -> Any:
    """
    Executes primary_fn with exponential backoff retries.
    If all attempts fail or timeout, executes fallback_fn cleanly.
    """
    delay = initial_delay
    for attempt in range(1, max_retries + 1):
        try:
            return primary_fn()
        except Exception as exc:
            logger.warning(f"Attempt {attempt}/{max_retries} failed: {exc}")
            if attempt == max_retries:
                logger.error("All retries exhausted for primary AI call. Invoking fallback mechanism.")
                break
            time.sleep(delay)
            delay *= backoff_factor

    try:
        return fallback_fn()
    except Exception as exc:
        logger.error(f"Fallback function also failed: {exc}")
        raise exc
