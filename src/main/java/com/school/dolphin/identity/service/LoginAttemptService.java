package com.school.dolphin.identity.service;

import com.school.dolphin.common.exception.TooManyLoginAttemptsException;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Minimal, single-node brute-force guard for the login endpoint.
 *
 * <p>Failed attempts are tracked per normalized username inside a rolling
 * window; after {@value #MAX_FAILURES} failures the key is locked for
 * {@link #LOCKOUT}. The map is bounded so it cannot grow without limit.
 *
 * <p>This is intentionally in-memory and per-instance. A horizontally scaled
 * deployment must replace it with a shared store (for example Redis) so the
 * counter is global; until then it still raises the cost of online guessing.
 */
@Component
public class LoginAttemptService {

    private static final int MAX_FAILURES = 5;
    private static final Duration FAILURE_WINDOW = Duration.ofMinutes(15);
    private static final Duration LOCKOUT = Duration.ofMinutes(15);
    private static final int MAX_TRACKED_KEYS = 10_000;

    private final Map<String, Attempt> attempts = new ConcurrentHashMap<>();

    public void assertNotLocked(String username) {
        Attempt attempt = attempts.get(normalize(username));

        if (attempt == null || attempt.lockedUntil() == null) {
            return;
        }

        if (Instant.now().isBefore(attempt.lockedUntil())) {
            throw new TooManyLoginAttemptsException(
                    "Too many failed login attempts. Try again later.");
        }
    }

    public void recordFailure(String username) {
        String key = normalize(username);
        Instant now = Instant.now();

        evictIfOversized();

        attempts.compute(key, (ignored, existing) -> {
            if (existing == null
                    || now.isAfter(
                            existing.windowStart().plus(FAILURE_WINDOW))) {
                return new Attempt(1, now, null);
            }

            int failures = existing.failures() + 1;

            if (failures >= MAX_FAILURES) {
                return new Attempt(0, now, now.plus(LOCKOUT));
            }

            return new Attempt(failures, existing.windowStart(), null);
        });
    }

    public void reset(String username) {
        attempts.remove(normalize(username));
    }

    private void evictIfOversized() {
        if (attempts.size() <= MAX_TRACKED_KEYS) {
            return;
        }

        Instant now = Instant.now();

        attempts.entrySet().removeIf(entry -> {
            Attempt attempt = entry.getValue();

            boolean locked = attempt.lockedUntil() != null
                    && now.isBefore(attempt.lockedUntil());

            return !locked
                    && now.isAfter(
                            attempt.windowStart().plus(FAILURE_WINDOW));
        });

        if (attempts.size() > MAX_TRACKED_KEYS) {
            attempts.clear();
        }
    }

    private String normalize(String username) {
        return username == null
                ? ""
                : username.trim().toLowerCase(Locale.ROOT);
    }

    private record Attempt(
            int failures,
            Instant windowStart,
            Instant lockedUntil
    ) {}
}
