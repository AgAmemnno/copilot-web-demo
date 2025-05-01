
function cAdd(z1, z2) { return { x: z1.x + z2.x, y: z1.y + z2.y }; }
function cSub(z1, z2) { return { x: z1.x - z2.x, y: z1.y - z2.y }; }
function cMult(z1, z2) { return { x: z1.x * z2.x - z1.y * z2.y, y: z1.x * z2.y + z1.y * z2.x }; }
function cConj(z) { return { x: z.x, y: -z.y }; }
function cAbsSq(z) { return z.x * z.x + z.y * z.y; }
function cDiv(z1, z2) {
    const denom = cAbsSq(z2);
    if (denom < 1e-15) return { x: Infinity, y: Infinity };
    const num = cMult(z1, cConj(z2));
    return { x: num.x / denom, y: num.y / denom };
}


// --- デカルトの定理 (変更なし) ---
function calculateNewCurvature(k1, k2, k3) {
    if (isNaN(k1) || isNaN(k2) || isNaN(k3)) return NaN;
    const sum_k = k1 + k2 + k3;
    const term_under_sqrt = k1*k2 + k2*k3 + k3*k1;
    if (term_under_sqrt < -1e-9) return NaN;
    const safe_term_under_sqrt = Math.max(0, term_under_sqrt);
    const sqrt_term = 2 * Math.sqrt(safe_term_under_sqrt);
    const k_new = sum_k + sqrt_term;
    if (isNaN(k_new)) return NaN;
    return k_new;
}

// --- 中心座標計算 (変更なし) ---
function findTangentCircleCenter(c1, c2, c3, r_new, c0) {
    if (isNaN(r_new) || r_new <= 0) return null;

    const circles = [c1, c2, c3];
    const equations = circles.map(c => {
        if (!c || isNaN(c.x) || isNaN(c.y) || isNaN(c.r)) return null;
        const x_i = c.x; const y_i = c.y; const r_i = c.r;
        let d_sq; let isOuter = false;
        if (c0 && Math.abs(c.x - c0.x) < 1e-9 && Math.abs(c.y - c0.y) < 1e-9 && Math.abs(c.r - c0.r) < 1e-9) {
            isOuter = true;
            if (r_new > c0.r + 1e-9) return null;
            d_sq = Math.max(0, Math.pow(c0.r - r_new, 2));
        } else {
            d_sq = Math.pow(r_i + r_new, 2);
        }
        const const_term = x_i*x_i + y_i*y_i - d_sq;
        return { A: -2 * x_i, B: -2 * y_i, C: const_term, isOuter: isOuter };
    });

    if (equations.some(eq => eq === null)) return null;

    const A_12 = equations[0].A - equations[1].A; const B_12 = equations[0].B - equations[1].B; const C_12 = equations[1].C - equations[0].C;
    const A_13 = equations[0].A - equations[2].A; const B_13 = equations[0].B - equations[2].B; const C_13 = equations[2].C - equations[0].C;
    const determinant = A_12 * B_13 - A_13 * B_12;

    if (Math.abs(determinant) < 1e-9) { // 直線ケース
        const x_center = 0;
        // Use inner circle (c2) for calculation in this specific setup
        const y_sq = Math.pow(r_new + c2.r, 2) - Math.pow(x_center - c2.x, 2);
        if (y_sq < -1e-9) return null;
        const safe_y_sq = Math.max(0, y_sq);
        const y_sol = Math.sqrt(safe_y_sq);
        return [{ x: x_center, y: y_sol }, { x: x_center, y: -y_sol }];
    } else { // 通常ケース
        const x = (C_12 * B_13 - C_13 * B_12) / determinant;
        const y = (C_13 * A_12 - C_12 * A_13) / determinant;

        // 検算
        const verificationTolerance = 1e-4;
        const c_check = c1;
        const distSq_check = Math.pow(x - c_check.x, 2) + Math.pow(y - c_check.y, 2);
        let expectedDistSq;
        let c_check_isOuter = false;
         if (c0 && Math.abs(c_check.x - c0.x) < 1e-9 && Math.abs(c_check.y - c0.y) < 1e-9 && Math.abs(c_check.r - c0.r) < 1e-9) c_check_isOuter = true;
         if (c_check_isOuter) expectedDistSq = Math.pow(c_check.r - r_new, 2);
         else expectedDistSq = Math.pow(c_check.r + r_new, 2);
        const diff = Math.abs(distSq_check - expectedDistSq);
        if (diff > verificationTolerance * (expectedDistSq + 1)) {
            // console.warn(`Worker: Center verification failed for r=${r_new}. Diff: ${diff}`);
            return null;
        }
        if (isNaN(x) || isNaN(y)) return null;
        return { x, y };
    }
}

// --- 円のキー生成関数 ---
function getCircleKey(circle) {
    if (!circle || isNaN(circle.x) || isNaN(circle.y) || isNaN(circle.r)) return null;
    // 精度を少し落として比較の安定性を上げる (toFixed(5))
    return `${circle.x.toFixed(5)},${circle.y.toFixed(5)},${circle.r.toFixed(5)}`;
}

// --- Gapキー生成関数 ---
function getGapKey(c1, c2, c3) {
    const key1 = getCircleKey(c1);
    const key2 = getCircleKey(c2);
    const key3 = getCircleKey(c3);
    if (!key1 || !key2 || !key3) return null;
    // キーをソートして結合し、順序に依存しないキーを作成
    return [key1, key2, key3].sort().join('|');
}


// --- 再帰的生成関数 (Worker内) ---
let recursionCounter = 0;
const MAX_RECURSION = 50000; // 安全装置
let initialDepthWorker = 7; // Worker内で使うため
let processedGaps = new Set(); // ★処理済みGapを記録するSet

function generateRecursiveWorker(c1, c2, c3, c0, depth, generatedCircles) {
    recursionCounter++;
    // ★終了条件チェックを先頭に移動
    if (depth <= 0 || recursionCounter > MAX_RECURSION) return;
    if (!c1 || !c2 || !c3) return;

    // ★処理済みGapチェック
    const gapKey = getGapKey(c1, c2, c3);
    if (!gapKey || processedGaps.has(gapKey)) {
        return; // 既に処理済みなら終了
    }
    processedGaps.add(gapKey); // 処理済みとして記録

    // console.log(`Recursion depth ${depth}, counter ${recursionCounter}, gap: ${gapKey}`); // デバッグ用

    const k1 = (c0 && c1 === c0) ? (c1.r > 0 ? -1 / c1.r : NaN) : (c1.r > 0 ? 1 / c1.r : NaN);
    const k2 = (c0 && c2 === c0) ? (c2.r > 0 ? -1 / c2.r : NaN) : (c2.r > 0 ? 1 / c2.r : NaN);
    const k3 = (c0 && c3 === c0) ? (c3.r > 0 ? -1 / c3.r : NaN) : (c3.r > 0 ? 1 / c3.r : NaN);
    if (isNaN(k1) || isNaN(k2) || isNaN(k3)) return;

    const k_new = calculateNewCurvature(k1, k2, k3);
    if (isNaN(k_new) || k_new <= 1e-9) return;
    const r_new = 1 / k_new;

    // 最小半径チェック
    if (r_new < 0.001) return;

    const center_result = findTangentCircleCenter(c1, c2, c3, r_new, c0);
    if (!center_result) return;

    const centers = Array.isArray(center_result) ? center_result : [center_result];

    centers.forEach(center => {
        if (!center || isNaN(center.x) || isNaN(center.y)) return;
        const newCircle = { ...center, r: r_new, depth: initialDepthWorker - depth + 1 };

        // ★生成された円自体も記録 (これは描画用)
        const circleKey = getCircleKey(newCircle);
        if (!circleKey || generatedCircles.has(circleKey)) return; // 重複チェック
        generatedCircles.set(circleKey, newCircle); // Mapに追加

        // 再帰呼び出し
        generateRecursiveWorker(c1, c2, newCircle, c0, depth - 1, generatedCircles);
        generateRecursiveWorker(c1, c3, newCircle, c0, depth - 1, generatedCircles);
        generateRecursiveWorker(c2, c3, newCircle, c0, depth - 1, generatedCircles);
    });
}

// --- Worker メッセージハンドラ ---
self.onmessage = function(event) {
    const { type, payload } = event.data;

    if (type === 'start') {
        try {
            console.log("Worker received start message:", payload);
            const { baseCircles, c0, depth } = payload;
            const generatedCirclesMap = new Map();
            recursionCounter = 0;
            processedGaps = new Set(); // ★Setを初期化
            initialDepthWorker = depth;

            // 初期円をMapに追加
            baseCircles.forEach(c => {
                if (c && !isNaN(c.x) && !isNaN(c.y) && !isNaN(c.r)) {
                   const key = getCircleKey(c); // Use helper function
                   if (key) generatedCirclesMap.set(key, c);
                }
            });

            // 再帰計算開始
            generateRecursiveWorker(baseCircles[0], baseCircles[1], baseCircles[2], c0, depth, generatedCirclesMap);

            // 結果を配列にしてメインスレッドに送信
            const results = Array.from(generatedCirclesMap.values());
            console.log(`Worker finished calculation. Circles: ${results.length}, Recursions: ${recursionCounter}`);
            self.postMessage({ type: 'calculated', data: results });

        } catch (error) {
            console.error("Error in worker:", error);
            self.postMessage({ type: 'error', error: error.message });
        }
    }
};
