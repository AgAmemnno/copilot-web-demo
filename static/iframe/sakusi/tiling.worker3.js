let ctx = null;
let canvasWidth = 0;
let canvasHeight = 0;
let currentCanvas = null; // OffscreenCanvasへの参照
let currentColorSpace = 'srgb'; // 現在のカラースペース設定

// --- 設定 ---
const tileWidth = 100;
const tileHeight = tileWidth * Math.sqrt(3) / 2;

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
            //ctx.fillStyle = isOddRow ? 'lightskyblue' : 'dodgerblue';
            const p3Green = 'color(display-p3 0 1 0)'; // P3の緑 (sRGB外の可能性)
            const p3Red = 'color(display-p3 1 0 0)';   // P3の赤 (sRGB外の可能性)
            ctx.fillStyle = isOddRow ? p3Green : p3Red; // 行ごとに色を変える
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
    if (!currentCanvas || !ctx) {
        console.error("Worker: Canvas or context not available to generate Data URL.");
        postError("Canvas or context not available.");
        return;
    }
    console.log(`Worker: Generating Data URL with colorSpace: ${currentColorSpace}`);
    try {
        // 1. 指定されたカラースペースで ImageData を取得
        //    注意: このオプションのサポートはブラウザ依存
        let imageData;
        try {
             imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight, { colorSpace: currentColorSpace });
             console.log(`Worker: Got ImageData with colorSpace: ${currentColorSpace}`);
        } catch (imageDataError) {
             console.warn(`Worker: Failed to get ImageData with colorSpace '${currentColorSpace}'. Falling back to default.`, imageDataError);
             // フォールバックとしてデフォルト (srgb相当) で取得
             imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
             // エラーをメインスレッドに通知しても良い
             // postError(`Failed to use colorSpace '${currentColorSpace}'. Using default.`);
        }


        // 2. 一時的な OffscreenCanvas を作成
        const tempCanvas = new OffscreenCanvas(canvasWidth, canvasHeight);
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) {
             throw new Error("Could not get 2D context from temporary OffscreenCanvas.");
        }

        // 3. ImageData を一時的な Canvas に描画
        tempCtx.putImageData(imageData, 0, 0);
        console.log("Worker: ImageData drawn onto temporary canvas.");

        // 4. 一時的な Canvas から Blob を生成
        const blob = await tempCanvas.convertToBlob({ type: 'image/png' });
        console.log("Worker: Blob created from temporary canvas.");

        // 5. FileReader を使って Blob を Data URL に変換
        const reader = new FileReader();
        reader.onload = () => {
            // 変換完了後、メインスレッドにメッセージを送信
            self.postMessage({
                type: 'dataUrl',
                url: reader.result,
                colorSpaceUsed: currentColorSpace // 実際に使おうとしたカラースペースも送る
            });
            console.log(`Worker: Data URL (colorSpace: ${currentColorSpace}) sent to main thread.`);
        };
        reader.onerror = (error) => {
             console.error("Worker: Error reading Blob as Data URL:", error);
             postError("Error converting Blob to Data URL.");
        };
        reader.readAsDataURL(blob);

    } catch (error) {
        console.error("Worker: Error during Data URL generation process:", error);
        postError(`Error generating Data URL: ${error.message}`);
    }
}

// --- エラーメッセージをメインスレッドに送信するヘルパー関数 ---
function postError(message) {
    self.postMessage({ type: 'error', message: message });
}


// --- メインスレッドからのメッセージを処理 ---
self.onmessage = (event) => {
    const data = event.data;

    if (data.canvas) {
        // OffscreenCanvas を受け取り、コンテキストと参照を取得
        currentCanvas = data.canvas;
        try {
            ctx = currentCanvas.getContext('2d', {
               willReadFrequently: true 
            });
            if (!ctx) {
                 throw new Error("Failed to get 2D context.");
            }
             console.log("Worker: OffscreenCanvas received and context obtained.");
        } catch (e) {
             console.error("Worker: Error getting 2D context:", e);
             currentCanvas = null; // 失敗したら参照をクリア
             postError(`Failed to get 2D context: ${e.message}`);
        }
    } else if (data.type === 'resize') {
        // リサイズメッセージ
        canvasWidth = data.width;
        canvasHeight = data.height;
        if (currentCanvas) {
             currentCanvas.width = canvasWidth;
             currentCanvas.height = canvasHeight;
             console.log(`Worker: Resized to ${canvasWidth}x${canvasHeight}`);
             drawTiling(); // 再描画 & Data URL 送信
        } else {
             console.warn("Worker: Resize message received but canvas is not ready.");
        }
    } else if (data.type === 'setColorSpace') {
        // カラースペース変更メッセージ
        if (typeof data.colorSpace === 'string') {
            currentColorSpace = data.colorSpace;
            console.log(`Worker: Color space set to ${currentColorSpace}`);
            // 新しい設定で Data URL を再生成して送信
            if (currentCanvas && ctx) { // CanvasとContextが準備できていれば
                sendDataUrl();
            } else {
                 console.warn("Worker: Color space changed but canvas/context not ready yet.");
            }
        } else {
             console.warn("Worker: Invalid setColorSpace message received.", data);
        }
    }
};
