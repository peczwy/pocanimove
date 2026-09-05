function createThrottler(fps) {
    const threshold = 1000 / fps;

    let lastRefresh = -Infinity;

    return function throttle(timestamp) {
        const now = timestamp ?? performance.now();

        if (now - lastRefresh >= threshold) {
            lastRefresh = now;
            return true;
        }

        return false;
    };
}