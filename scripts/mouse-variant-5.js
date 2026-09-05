(() => {
    const sprite = document.getElementById("sprite");
    const textCoord = document.getElementById("text_coord");

    const params = new URLSearchParams(window.location.search);

    const COLS = SpriteConfig.cols;
    const ROWS = SpriteConfig.rows;
    const CAPACITY = SpriteConfig.capacity;

    const requestedFrameCount = Number(params.get("frames"));

    const FRAME_COUNT =
        Number.isInteger(requestedFrameCount) &&
        requestedFrameCount > 0 &&
        requestedFrameCount <= CAPACITY
            ? requestedFrameCount
            : CAPACITY;

    let pointerActive = false;

    let halfWidth = window.innerWidth / 2;
    let halfHeight = window.innerHeight / 2;

    let currentFrame = -1;


    /*
     * Cały spritesheet ma 8x10 klatek.
     *
     * Powiększamy background tak, żeby jedna komórka
     * miała dokładnie rozmiar elementu #sprite.
     */
    sprite.style.backgroundSize =
        `${COLS * 100}% ${ROWS * 100}%`;


    function updateViewportSize() {
        halfWidth = window.innerWidth / 2;
        halfHeight = window.innerHeight / 2;
    }


    window.addEventListener("resize", updateViewportSize);


    sprite.addEventListener("pointerdown", event => {
        pointerActive = true;

        sprite.setPointerCapture(event.pointerId);

        update(event);
    });


    sprite.addEventListener("pointermove", event => {
        /*
         * Mouse działa również bez wciśniętego przycisku.
         */
        if (event.pointerType !== "mouse" && !pointerActive) {
            return;
        }

        update(event);
    });


    sprite.addEventListener("pointerup", event => {
        update(event);

        pointerActive = false;
    });


    sprite.addEventListener("pointercancel", () => {
        pointerActive = false;
    });


    function update(event) {
        const x = event.clientX;
        const y = event.clientY;

        const dx = x - halfWidth;
        const dy = y - halfHeight;

        if (dx === 0 && dy === 0) {
            return;
        }

        const angle = Math.atan2(dy, dx);

        const percent =
            (angle + Math.PI) % (Math.PI * 2) / (Math.PI * 2);

        const frameIndex =
            getSpriteFrameIndex(percent, FRAME_COUNT);

        showFrame(frameIndex);

        if (textCoord) {
            textCoord.textContent =
                `sprite-v2; frame: ${frameIndex + 1}/${FRAME_COUNT}; ` +
                `x: ${x.toFixed(0)}, y: ${y.toFixed(0)}`;
        }
    }


    function showFrame(frameIndex) {
        /*
         * Jeżeli nadal jesteśmy na tej samej klatce,
         * nie dotykamy DOM.
         */
        if (frameIndex === currentFrame) {
            return;
        }

        currentFrame = frameIndex;

        const { col, row } =
            getSpritePosition(frameIndex);

        /*
         * Dla 8 kolumn:
         *
         * col 0 ->   0%
         * col 1 ->  14.2857%
         * ...
         * col 7 -> 100%
         *
         * background-position działa względem różnicy
         * między rozmiarem backgroundu i elementu,
         * dlatego nie używamy tutaj po prostu col * 100%.
         */
        const x =
            COLS > 1
                ? (col / (COLS - 1)) * 100
                : 0;

        const y =
            ROWS > 1
                ? (row / (ROWS - 1)) * 100
                : 0;

        sprite.style.backgroundPosition =
            `${x}% ${y}%`;
    }


    /*
     * Pokaż pierwszą klatkę od razu.
     */
    showFrame(0);
})();