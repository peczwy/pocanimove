(() => {
    const video = document.getElementById("video");
    const textCoord = document.getElementById("text_coord");

    const params = new URLSearchParams(window.location.search);

    const FPS = Number(params.get("fps")) || 23;
    const FRAME_INTERVAL = 1000 / FPS;

    let pointerActive = false;

    let pointerX = 0;
    let pointerY = 0;

    let targetTime = null;
    let seekPending = false;

    let lastSeekAt = -Infinity;
    let seekTimer = null;

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

        if (textCoord) {
            textCoord.textContent =
                `v6; ${FPS} FPS; x: ${pointerX.toFixed(0)}, y: ${pointerY.toFixed(0)}`;
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

        const now = performance.now();
        const elapsed = now - lastSeekAt;

        if (elapsed < FRAME_INTERVAL) {
            if (seekTimer === null) {
                seekTimer = setTimeout(() => {
                    seekTimer = null;
                    requestSeek();
                }, FRAME_INTERVAL - elapsed);
            }

            return;
        }

        seekPending = true;
        lastSeekAt = now;

        const requestedTime = targetTime;

        video.currentTime = requestedTime;

        if (typeof video.requestVideoFrameCallback === "function") {
            video.requestVideoFrameCallback(() => {
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
})();