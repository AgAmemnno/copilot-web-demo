// tiling.worker.js - Web Worker スクリプト

let ctx = null;
let canvasWidth = 0;
let canvasHeight = 0;

// --- 設定 (メインスレッドから移動) ---
const tileWidth = 100; // タイル（三角形）の基本幅
const tileHeight = tileWidth * Math.sqrt(3) / 2; // 正三角形の高さ
// const cornerRadius = 15; // 角の円の半径 (今回は未使用)
// const triangleColor = 'dodgerblue'; // 三角形の色 (今回は未使用)

// --- 三角形の角を描画する関数 (メインスレッドから移動、簡略版を使用) ---
// function drawTriangleCorners(x, y, width, height) { ... }
// (今回は drawTiling 内で直接描画するため、独立した関数は不要)


// --- タイリングを描画する関数 (メインスレッドから移動) ---
function drawTiling() {
    if (!ctx || canvasWidth === 0 || canvasHeight === 0) {
        // コンテキストやサイズが未設定なら描画しない
        return;
    }

    // キャンバスをクリア
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // タイルを敷き詰める
    const rowOffset = tileWidth / 2;
    const startX = (canvasWidth % tileWidth) / 2 - tileWidth / 2;
    const startY = (canvasHeight % tileHeight) / 2 - tileHeight / 2;

    for (let y = startY; y < canvasHeight; y += tileHeight) {
        const rowIndex = Math.floor((y - startY) / tileHeight);
        const isOddRow = rowIndex % 2 !== 0;

        for (let x = startX; x < canvasWidth; x += tileWidth) {
            let currentX = x;
            if (isOddRow) {
                currentX += rowOffset;
            }

            // 単純な三角形を描画 (簡略版)
            ctx.fillStyle = isOddRow ? 'lightskyblue' : 'dodgerblue'; // 行ごとに色を変える
            ctx.beginPath();
            ctx.moveTo(currentX + tileWidth / 2, y);
            ctx.lineTo(currentX, y + tileHeight);
            ctx.lineTo(currentX + tileWidth, y + tileHeight);
            ctx.closePath();
            ctx.fill();
        }
    }
    // console.log("Worker: Tiling drawn."); // デバッグ用
}

// --- メインスレッドからのメッセージを処理 ---
self.onmessage = (event) => {
    const data = event.data;

    if (data.canvas) {
        // OffscreenCanvas を受け取り、コンテキストを取得
        const canvas = data.canvas;
        ctx = canvas.getContext('2d');
        console.log("Worker: OffscreenCanvas received.");
        // 初期サイズが送られてくるのを待つか、ここで初期描画を試みる
        // (ただし、サイズが不明な場合がある)
    } else if (data.type === 'resize') {
        // リサイズメッセージを受け取り、サイズを更新して再描画
        canvasWidth = data.width;
        canvasHeight = data.height;
        // OffscreenCanvas のサイズも更新 (重要)
        if (ctx && ctx.canvas) {
             ctx.canvas.width = canvasWidth;
             ctx.canvas.height = canvasHeight;
        }
        console.log(`Worker: Resized to ${canvasWidth}x${canvasHeight}`);
        drawTiling(); // 新しいサイズで描画
    }
};
