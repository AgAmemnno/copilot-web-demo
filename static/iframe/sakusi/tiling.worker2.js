// tiling.worker.js - Web Worker スクリプト

let ctx = null;
let canvasWidth = 0;
let canvasHeight = 0;
let currentCanvas = null; // OffscreenCanvasへの参照を保持

// --- 設定 (メインスレッドから移動) ---
const tileWidth = 100; // タイル（三角形）の基本幅
const tileHeight = tileWidth * Math.sqrt(3) / 2; // 正三角形の高さ

// --- タイリングを描画する関数 ---
function drawTiling() {
    if (!ctx || canvasWidth === 0 || canvasHeight === 0) {
        return;
    }
    // (描画処理は変更なし)
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
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
            ctx.fillStyle = isOddRow ? 'lightskyblue' : 'dodgerblue';
            ctx.beginPath();
            ctx.moveTo(currentX + tileWidth / 2, y);
            ctx.lineTo(currentX, y + tileHeight);
            ctx.lineTo(currentX + tileWidth, y + tileHeight);
            ctx.closePath();
            ctx.fill();
        }
    }
     console.log("Worker: Tiling drawn.");

     // 描画後にData URLを送信
     sendDataUrl();
}

// --- Data URLを生成してメインスレッドに送信する関数 ---
async function sendDataUrl() {
    if (!currentCanvas) {
        console.error("Worker: Canvas reference is not available to generate Data URL.");
        return;
    }
    try {
        // OffscreenCanvasからBlobを生成 (非同期)
        const blob = await currentCanvas.convertToBlob({ type: 'image/png' });

        // FileReaderを使ってBlobをData URLに変換
        const reader = new FileReader();
        reader.onload = () => {
            // 変換完了後、メインスレッドにメッセージを送信
            self.postMessage({
                type: 'dataUrl', // メッセージタイプ
                url: reader.result // Data URL本体
            });
            console.log("Worker: Data URL sent to main thread.");
        };
        reader.onerror = (error) => {
             console.error("Worker: Error reading Blob as Data URL:", error);
        };
        reader.readAsDataURL(blob);

    } catch (error) {
        console.error("Worker: Error converting canvas to Blob:", error);
    }
}


// --- メインスレッドからのメッセージを処理 ---
self.onmessage = (event) => {
    const data = event.data;

    if (data.canvas) {
        // OffscreenCanvas を受け取り、コンテキストと参照を取得
        currentCanvas = data.canvas; // Canvasへの参照を保持
        ctx = currentCanvas.getContext('2d');
        console.log("Worker: OffscreenCanvas received.");
        // 注意: この時点ではまだサイズが不明なため、
        // 最初の resize メッセージ受信後に描画とData URL送信が行われる
    } else if (data.type === 'resize') {
        // リサイズメッセージを受け取り、サイズを更新して再描画
        canvasWidth = data.width;
        canvasHeight = data.height;
        // OffscreenCanvas のサイズも更新 (重要)
        if (currentCanvas) { // currentCanvas の存在を確認
             currentCanvas.width = canvasWidth;
             currentCanvas.height = canvasHeight;
        } else {
             console.error("Worker: Cannot resize, OffscreenCanvas reference is missing.");
             return; // Canvasがなければ処理中断
        }
        console.log(`Worker: Resized to ${canvasWidth}x${canvasHeight}`);
        drawTiling(); // 新しいサイズで描画 (内部で sendDataUrl も呼ばれる)
    }
    // 必要であれば、メインスレッドから Data URL を要求するメッセージタイプを追加
    // else if (data.type === 'requestDataUrl') {
    //     sendDataUrl();
    // }
};
