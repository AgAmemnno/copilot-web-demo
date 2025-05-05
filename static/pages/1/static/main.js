// main.js
import { rotationParams } from '/static/platonic-data.js'; // 軸/角度データをインポート
import { generateMatrixFromAxisAngle } from '/static/matrix-utils.js'; // 行列生成関数をインポート
import { MatrixPathNavigator } from '/static/MatrixPathNavigator.js'; // 新しいクラスをインポート

import * as glMatrix  from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/+esm'
// Requires gl-matrix library (loaded via CDN in html)

const mat4 = glMatrix.mat4; // 4x4 matrix functions

// --- データ準備: 軸/角度データから行列データを作成 ---
function createOperationMatrixMap(params) {
    const matrixMap = new Map();
    for (const opId in params) {
        const param = params[opId];
        const matrix = generateMatrixFromAxisAngle(param.axis, param.angle);
        matrixMap.set(opId, matrix);
    }
    return matrixMap;
}

// T, O, I グループの行列マップを作成 (Iは不完全なデータに基づく)
const operationMatrices = {
    T: createOperationMatrixMap(rotationParams.T),
    O: createOperationMatrixMap(rotationParams.O),
    I: createOperationMatrixMap(rotationParams.I)
};

// --- ナビゲーターのセットアップとUI連携 ---
document.addEventListener('DOMContentLoaded', () => {
    const resultsContainer = document.getElementById('test-results'); // Test results are now separate
    const polyhedronElement = document.getElementById('my-polyhedron'); // Target element for rotation
    const forwardButton = document.getElementById('forward-button');
    const backwardButton = document.getElementById('backward-button');
    const currentOpDisplay = document.getElementById('current-op');
    const currentIndexDisplay = document.getElementById('current-index');
    const pathSelector = document.getElementById('path-selector'); // Added for path selection

    if (!polyhedronElement || !forwardButton || !backwardButton || !currentOpDisplay || !currentIndexDisplay || !pathSelector) {
        console.error("必要なHTML要素が見つかりません。");
        if(resultsContainer) resultsContainer.innerHTML = "<p class='fail'>UI要素が見つかりませんでした。</p>";
        return;
    }

    let navigator = null; // ナビゲーターインスタンス用

    // --- パス選択とナビゲーター初期化 ---
    function setupNavigator() {
        const selectedGroup = pathSelector.value; // 'T', 'O', or 'I'
        if (!operationMatrices[selectedGroup]) {
            alert("選択されたグループの操作データがありません。");
            return;
        }

        // --- ★ユーザーが辿るパスを定義 ---
        // 例: Tグループのパス
        let userPath = [];
        if (selectedGroup === 'T') {
             userPath = ['T_C3_111_120', 'T_C2_X_180', 'T_C3_111_240', 'T_C2_X_180'];
        } else if (selectedGroup === 'O') {
            // 例: Oグループのパス (軸周りの90度回転など)
             userPath = ['O_C4_Z_90', 'O_C4_X_90', 'O_C3_111_120', 'O_C4_X_270', 'O_C4_Z_270'];
        } else { // Iグループ (データ不完全なので注意)
             userPath = ['I_C5_A1_72', 'I_C2_C1_180', 'I_C5_A1_144']; // 例
        }

        console.log(`Setting up navigator for Group: ${selectedGroup}, Path:`, userPath);

        // ナビゲーターを初期化
        navigator = new MatrixPathNavigator(operationMatrices[selectedGroup], userPath);

        // 初期状態を適用しUI更新
        navigator.applyToElement(polyhedronElement);
        updateUI();
    }

    // --- UI更新関数 ---
    function updateUI() {
        if (!navigator) return;
        currentOpDisplay.textContent = `操作: ${navigator.currentOperationId || '初期状態'}`;
        currentIndexDisplay.textContent = `ステップ: ${navigator.currentIndex + 1} / ${navigator.path.length}`;
        // ボタンの有効/無効状態
        forwardButton.disabled = navigator.isAtEnd();
        backwardButton.disabled = navigator.isAtStart();
    }

    // --- イベントリスナー ---
    forwardButton.addEventListener('click', () => {
        if (!navigator) return;
        const result = navigator.stepForward(); // "turn"
        if (result.success) {
            // console.log(`進む: ${result.operationId} 適用 => ${navigator.currentTransformCSS}`);
            navigator.applyToElement(polyhedronElement);
            updateUI();
        }
    });

    backwardButton.addEventListener('click', () => {
        if (!navigator) return;
        const result = navigator.stepBackward(); // "return"
        if (result.success) {
            // console.log(`戻る: ${result.undoneOperationId} 解除 => ${navigator.currentTransformCSS}`);
            navigator.applyToElement(polyhedronElement);
            updateUI();
        }
    });

    // パス選択が変更されたらナビゲーターを再セットアップ
    pathSelector.addEventListener('change', setupNavigator);

    // --- 初期化 ---
    // ページ読み込み時にデフォルト（例: Tグループ）でセットアップ
    pathSelector.value = 'T'; // デフォルト選択
    setupNavigator();

});