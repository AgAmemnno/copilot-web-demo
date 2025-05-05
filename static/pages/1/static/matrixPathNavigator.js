// MatrixPathNavigator.js
// Requires gl-matrix library

// gl-matrixの関数を変数として取得 (可読性のため)
// HTMLでCDN経由で読み込まれている場合、グローバルスコープに glMatrix がある想定
import * as glMatrix  from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/+esm'
const { mat4, vec3 } = glMatrix; // vec3 は直接使わないかもしれないが念のため

/**
 * 事前に計算された操作行列のシーケンス（パス）を辿り、
 * 累積的な4x4変換行列と対応するCSS matrix3d文字列を管理するクラス。
 */
export class MatrixPathNavigator {
    /**
     * ナビゲーターを初期化します。
     *
     * @param {Map<string, mat4>} operationsMatrixMap - 操作IDをキー、4x4行列(mat4)を値とするMap。
     * @param {string[]} specifiedPathIDs - 辿るべき操作IDの配列。
     */
    constructor(operationsMatrixMap, specifiedPathIDs) {
        if (!(operationsMatrixMap instanceof Map)) {
            throw new Error("operationsMatrixMap は Map でなければなりません。");
        }
        if (!Array.isArray(specifiedPathIDs)) {
            throw new Error("specifiedPathIDs は操作IDの配列でなければなりません。");
        }

        this.operationsMap = operationsMatrixMap;
        this.path = specifiedPathIDs;

        // パス中のIDがMapに存在するか簡易チェック
        this.path.forEach(id => {
            if (!this.operationsMap.has(id)) {
                console.warn(`パス中の操作ID "${id}" が operationsMatrixMap に見つかりません。`);
            }
        });

        // 現在のパス上の位置 (-1は初期状態、0は最初の操作適用後)
        this.currentIndex = -1;
        // 初期状態の変換行列 (単位行列)
        this.initialTransform = mat4.create(); // glMatrix.mat4.create()
        // 各ステップ適用後の累積変換行列(mat4)の履歴
        // history[0] = 初期状態 (単位行列)
        // history[i] = path[i-1] 適用後の累積行列
        this.transformHistory = [this.initialTransform];
    }

    /**
     * 現在の累積された4x4変換行列(mat4)を取得します。
     * @returns {mat4} 現在の変換行列。
     */
    get currentTransformMatrix() {
        // historyは常にcurrentIndexより1つ多い要素を持つ
        // currentIndexが-1ならhistory[0] (初期状態) を返す
        return this.transformHistory[this.currentIndex + 1];
    }

    /**
     * 現在の累積された変換行列に対応するCSS matrix3d文字列を取得します。
     * @returns {string} CSS matrix3d(...) 文字列。
     */
    get currentTransformCSS() {
        const m = this.currentTransformMatrix;
        // gl-matrix の mat4 は Column-Major なので、そのままCSSの順序でOK
        // matrix3d(m0, m1, m2, m3, m4, m5, m6, m7, m8, m9, m10, m11, m12, m13, m14, m15)
        //           m[0]-m[3]      m[4]-m[7]      m[8]-m[11]     m[12]-m[15]
        // prettier-ignore
        return `matrix3d(${m[0]}, ${m[1]}, ${m[2]}, ${m[3]}, ${m[4]}, ${m[5]}, ${m[6]}, ${m[7]}, ${m[8]}, ${m[9]}, ${m[10]}, ${m[11]}, ${m[12]}, ${m[13]}, ${m[14]}, ${m[15]})`;
    }

    /**
     * 現在適用されている（または最後に適用された）操作のIDを取得します。
     * @returns {string | null} 操作ID、または初期状態ならnull。
     */
    get currentOperationId() {
        if (this.currentIndex >= 0 && this.currentIndex < this.path.length) {
            return this.path[this.currentIndex];
        }
        return null;
    }

    /** パスの開始地点（初期状態）にいるかどうか。 */
    isAtStart() {
        return this.currentIndex === -1;
    }

    /** パスの終端に到達しているかどうか。 */
    isAtEnd() {
        return this.currentIndex === this.path.length - 1;
    }

    /**
     * パスを1ステップ進めます ("turn")。
     * @returns {{success: boolean, transform?: string, operationId?: string}}
     */
    stepForward() {
        if (this.isAtEnd()) {
            console.log("パスの終端です。");
            return { success: false };
        }

        this.currentIndex++;
        const operationID = this.path[this.currentIndex];
        const operationMatrix = this.operationsMap.get(operationID);

        if (!operationMatrix) {
            console.warn(`操作 "${operationID}" の行列が見つかりません。ステップをスキップします。`);
            // 直前の状態を複製して履歴に追加し、履歴の長さを保つ
            const previousMatrix = this.transformHistory[this.transformHistory.length - 1];
            this.transformHistory.push(mat4.clone(previousMatrix));
            return { success: false, transform: this.currentTransformCSS, operationId: operationID };
        }

        // 前の状態の行列を取得
        const previousMatrix = this.transformHistory[this.currentIndex]; // history[currentIndex] が前の状態
        const newMatrix = mat4.create(); // 新しい状態の行列用

        // 新しい操作を行列に適用: M_new = M_step * M_previous
        // glMatrix.mat4.multiply(out, matrixA, matrixB) calculates A * B
        // 操作を「後から」適用するので、操作行列を左側(matrixA)にする
        mat4.multiply(newMatrix, operationMatrix, previousMatrix);

        // 履歴を現在の位置までで切り捨ててから新しい状態を追加
        this.transformHistory = this.transformHistory.slice(0, this.currentIndex + 1);
        this.transformHistory.push(newMatrix);

        return { success: true, transform: this.currentTransformCSS, operationId: operationID };
    }

    /**
     * パスを1ステップ戻します ("return")。
     * @returns {{success: boolean, transform?: string, undoneOperationId?: string}}
     */
    stepBackward() {
        if (this.isAtStart()) {
            console.log("パスの開始地点です。");
            return { success: false };
        }

        const undoneOperationID = this.path[this.currentIndex];
        this.currentIndex--;

        // 履歴は変更せず、currentIndexを戻すだけで状態が戻る

        return { success: true, transform: this.currentTransformCSS, undoneOperationId: undoneOperationID };
    }

    /**
     * 現在のtransformを指定されたDOM要素に適用します。
     * @param {HTMLElement} element
     */
    applyToElement(element) {
        if (element && element.style) {
            element.style.transform = this.currentTransformCSS;
        } else {
            console.error("有効なDOM要素が applyToElement に渡されませんでした。");
        }
    }
}