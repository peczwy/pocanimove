const FPS = 23;

const video = document.getElementById("video");
const textCoord = document.getElementById("text_coord");

const throttle = createThrottler(FPS);

let pointerActive = false;

let pointerX = 0;
let pointerY = 0;

let animationFrameRequested = false;

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
    requestUpdate();
});


video.addEventListener("pointermove", event => {
    // Mouse działa również bez wciśniętego przycisku.
    if (event.pointerType !== "mouse" && !pointerActive) {
        return;
    }

    updatePointer(event);
    requestUpdate();
});


video.addEventListener("pointerup", event => {
    updatePointer(event);

    pointerActive = false;

    requestUpdate();
});


video.addEventListener("pointercancel", () => {
    pointerActive = false;
});


function updatePointer(event) {
    pointerX = event.clientX;
    pointerY = event.clientY;

    if (textCoord) {
        textCoord.textContent =
            `x: ${pointerX.toFixed(0)}, y: ${pointerY.toFixed(0)}`;
    }
}


function requestUpdate() {
    if (animationFrameRequested) {
        return;
    }

    animationFrameRequested = true;

    requestAnimationFrame(update);
}


function update(timestamp) {
    animationFrameRequested = false;

    if (!throttle(timestamp)) {
        requestUpdate();
        return;
    }

    refresh(pointerX, pointerY);
}


function refresh(x, y) {
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

    const targetTime = duration * percent;

    seekVideo(targetTime);
}


function seekVideo(targetTime) {
    if (typeof video.fastSeek === "function") {
        video.fastSeek(targetTime);
    } else {
        video.currentTime = targetTime;
    }

    /*
     * Na części urządzeń mobilnych samo ustawienie currentTime
     * nie powoduje natychmiastowego odrysowania klatki.
     *
     * Krótkie play/pause może wymusić aktualizację obrazu.
     */
    const playPromise = video.play();

    if (playPromise !== undefined) {
        playPromise
            .then(() => {
                video.pause();
            })
            .catch(() => {
                // Jeśli play() zostanie zablokowane,
                // pozostajemy przy zwykłym seeku.
            });
    } else {
        video.pause();
    }
}