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

    let frameWidth = 0;
    let frameHeight = 0;

    let scale = 1;


    function updateViewportSize() {
        halfWidth = window.innerWidth / 2;
        halfHeight = window.innerHeight / 2;

        updateSpriteScale();
    }


    window.addEventListener("resize", updateViewportSize);


    function initializeSprite() {
        const backgroundImage =
            getComputedStyle(sprite).backgroundImage;

        const match =
            backgroundImage.match(/url\(["']?(.*?)["']?\)/);

        if (!match) {
            return;
        }

        const image = new Image();

        image.onload = () => {
            frameWidth = image.naturalWidth / COLS;
            frameHeight = image.naturalHeight / ROWS;

            updateSpriteScale();

            showFrame(0);
        };

        image.src = match[1];
    }


    function updateSpriteScale() {
        if (frameWidth <= 0 || frameHeight <= 0) {
            return;
        }

        const viewportWidth = sprite.clientWidth;
        const viewportHeight = sprite.clientHeight;

        /*
         * "contain":
         * cała klatka mieści się w viewport.
         */
        scale = Math.min(
            viewportWidth / frameWidth,
            viewportHeight / frameHeight
        );

        const scaledFrameWidth =
            frameWidth * scale;

        const scaledFrameHeight =
            frameHeight * scale;

        const sheetWidth =
            scaledFrameWidth * COLS;

        const sheetHeight =
            scaledFrameHeight * ROWS;

        sprite.style.backgroundSize =
            `${sheetWidth}px ${sheetHeight}px`;
    }


    sprite.addEventListener("pointerdown", event => {
        pointerActive = true;

        sprite.setPointerCapture(event.pointerId);

        update(event);
    });


    sprite.addEventListener("pointermove", event => {
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
            (angle + Math.PI) % (Math.PI * 2) /
            (Math.PI * 2);

        const frameIndex =
            getSpriteFrameIndex(
                percent,
                FRAME_COUNT
            );

        showFrame(frameIndex);

        if (textCoord) {
            textCoord.textContent =
                `sprite-v3; frame: ${frameIndex + 1}/${FRAME_COUNT}; ` +
                `x: ${x.toFixed(0)}, y: ${y.toFixed(0)}`;
        }
    }


    function showFrame(frameIndex) {
        if (
            frameIndex === currentFrame ||
            frameWidth <= 0 ||
            frameHeight <= 0
        ) {
            return;
        }

        currentFrame = frameIndex;

        const { col, row } =
            getSpritePosition(frameIndex);

        const scaledFrameWidth =
            frameWidth * scale;

        const scaledFrameHeight =
            frameHeight * scale;

        const offsetX =
            -(col * scaledFrameWidth);

        const offsetY =
            -(row * scaledFrameHeight);

        sprite.style.backgroundPosition =
            `${offsetX}px ${offsetY}px`;
    }


    initializeSprite();
})();