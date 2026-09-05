(() => {
    const SPRITE_COLS = 8;
    const SPRITE_ROWS = 10;

    const DEFAULT_FPS = 23;

    window.SpriteConfig = {
        cols: SPRITE_COLS,
        rows: SPRITE_ROWS,
        capacity: SPRITE_COLS * SPRITE_ROWS,
        fps: DEFAULT_FPS
    };


    window.getSpriteFrameIndex = function(percent, frameCount) {
        const normalized =
            Math.max(0, Math.min(0.999999, percent));

        return Math.floor(normalized * frameCount);
    };


    window.getSpritePosition = function(frameIndex) {
        const col = frameIndex % SPRITE_COLS;
        const row = Math.floor(frameIndex / SPRITE_COLS);

        return {
            col,
            row
        };
    };
})();