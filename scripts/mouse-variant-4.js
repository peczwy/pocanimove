(() => {
    const video = document.getElementById("video");
    const textCoord = document.getElementById("text_coord");

    const params = new URLSearchParams(window.location.search);

    const REQUESTED_FPS = Number(params.get("fps")) || 23;

    const MIN_FPS = 6;
    const DEBUG_FPS = 5;

    let effectiveFps = REQUESTED_FPS;
    let frameInterval = 1000 / effectiveFps;

    let pointerActive = false;

    let pointerX = 0;
    let pointerY = 0;

    let targetTime = null;
    let lastRequestedTime = null;

    let seekPending = false;
    let seekTimer = null;

    let lastSeekAt = -Infinity;
    let lastDebugAt = -Infinity;

    let viewportWidth = window.innerWidth;
    let viewportHeight = window.innerHeight;

    let halfWidth = viewportWidth / 2;
    let halfHeight = viewportHeight / 2;


    function updateViewportSize() {
        viewportWidth = window.innerWidth;
        viewportHeight = window.innerHeight;

        halfWidth = viewportWidth / 2;
        halfHeight = viewportHeight / 2;
    }


    window.addEventListener("resize", updateViewportSize);


    video.addEventListener("pointerdown", event => {
        pointerActive = true;

        video.setPointerCapture(event.pointerId);

        updatePointer(event);
        updateTargetTime(event.clientX, event.clientY);
    });


    video.addEventListener("pointermove", event => {
        if (event.pointerType !== "mouse" && !pointerActive) {
            return;
        }

        updatePointer(event);
        updateTargetTime(event.clientX, event.clientY);
    });


    video.addEventListener("pointerup", event => {
        updatePointer(event);
        updateTargetTime(event.clientX, event.clientY);

        pointerActive = false;
    });


    video.addEventListener("pointercancel", () => {
        pointerActive = false;
    });


    function updatePointer(event) {
        pointerX = event.clientX;
        pointerY = event.clientY;

        const now = performance.now();
        const debugInterval = 1000 / DEBUG_FPS;

        if (
            textCoord &&
            now - lastDebugAt >= debugInterval
        ) {
            lastDebugAt = now;

            textCoord.textContent =
                `v7; requested: ${REQUESTED_FPS} FPS; effective: ${effectiveFps.toFixed(1)} FPS; x: ${pointerX.toFixed(0)}, y: ${pointerY.toFixed(0)}`;
        }
    }


    function updateTargetTime(x, y) {
        const duration = video.duration;

        if (!Number.isFinite(duration) || duration <= 0) {
            return;
        }

        const dx = x - halfWidth;
        const dy = y - halfHeight;

        if (dx === 0 && dy === 0) {
            return;
        }

        const angle = Math.atan2(dy, dx);

        const percent =
            (angle + Math.PI) % (Math.PI * 2) / (Math.PI * 2);

        targetTime = duration * percent;

        requestSeek();
    }


    function requestSeek() {
        if (seekPending || targetTime === null) {
            return;
        }

        /*
         * Nie seekujemy, jeśli zmiana jest mniejsza
         * niż jedna "logiczna klatka".
         */
        if (lastRequestedTime !== null) {
            const minTimeDelta = 1 / effectiveFps;

            if (
                Math.abs(targetTime - lastRequestedTime) < minTimeDelta
            ) {
                return;
            }
        }

        const now = performance.now();
        const elapsed = now - lastSeekAt;

        if (elapsed < frameInterval) {
            if (seekTimer === null) {
                seekTimer = setTimeout(() => {
                    seekTimer = null;
                    requestSeek();
                }, frameInterval - elapsed);
            }

            return;
        }

        seekPending = true;

        const requestedTime = targetTime;
        const seekStartedAt = performance.now();

        lastRequestedTime = requestedTime;
        lastSeekAt = seekStartedAt;

        video.currentTime = requestedTime;

        if (typeof video.requestVideoFrameCallback === "function") {
            video.requestVideoFrameCallback(() => {
                const seekFinishedAt = performance.now();

                const renderTime =
                    seekFinishedAt - seekStartedAt;

                adaptFps(renderTime);

                seekPending = false;

                if (
                    targetTime !== null &&
                    Math.abs(targetTime - requestedTime) > 0.001
                ) {
                    requestSeek();
                }
            });
        } else {
            video.addEventListener(
                "seeked",
                () => {
                    const seekFinishedAt = performance.now();

                    const renderTime =
                        seekFinishedAt - seekStartedAt;

                    adaptFps(renderTime);

                    seekPending = false;

                    if (
                        targetTime !== null &&
                        Math.abs(targetTime - requestedTime) > 0.001
                    ) {
                        requestSeek();
                    }
                },
                { once: true }
            );
        }
    }


    function adaptFps(renderTimeMs) {
        if (!Number.isFinite(renderTimeMs) || renderTimeMs <= 0) {
            return;
        }

        /*
         * Ile FPS urządzenie realnie jest w stanie wyrenderować.
         */
        const measuredFps = 1000 / renderTimeMs;

        /*
         * Zostawiamy trochę zapasu, żeby urządzenie
         * nie pracowało cały czas na 100%.
         */
        const safeFps = measuredFps * 0.9;

        /*
         * Adaptive FPS:
         *
         * - nigdy więcej niż REQUESTED_FPS
         * - nigdy mniej niż MIN_FPS
         * - zmieniamy stopniowo, żeby FPS nie skakał
         */
        const targetFps = Math.max(
            MIN_FPS,
            Math.min(REQUESTED_FPS, safeFps)
        );

        effectiveFps =
            effectiveFps * 0.8 +
            targetFps * 0.2;

        frameInterval = 1000 / effectiveFps;
    }
})();