# MatrixPathNavigator における操作パスの指定方法

`MatrixPathNavigator` クラスは、多面体の対称操作を連続して適用し、その結果としての姿勢（向き）を追跡するためのツールです。このクラスを使用する上で中心となるのが、「操作パス」の指定です。ここでは、プラトン立体とその対称性を背景に、パスの指定方法を説明します。

## 1. 背景: プラトン立体と回転対称性群

プラトン立体（プラトニックソリッド）は、全ての面が同一の正多角形であり、全ての頂点で同数の面が会する、非常に高い対称性を持つ凸多面体です。以下の5種類が存在します。

- **正四面体 (Tetrahedron)**
- **正六面体 (Cube / Hexahedron)**
- **正八面体 (Octahedron)**
- **正十二面体 (Dodecahedron)**
- **正二十面体 (Icosahedron)**

これらの多面体が持つ対称性（回転させたり、反転させたりしても見た目が変わらない性質）は、数学的には「群」という概念で記述されます。特に、回転操作だけを集めたものは回転対称性群と呼ばれます。プラトン立体の回転対称性群は以下の3種類に分類されます。

- **T (Tetrahedral Group)**: 正四面体の回転対称性群。恒等操作を含め12個の回転操作を持ちます。
- **O (Octahedral Group)**: 正六面体（立方体）およびその双対である正八面体の回転対称性群。恒等操作を含め24個の回転操作を持ちます。
- **I (Icosahedral Group)**: 正十二面体およびその双対である正二十面体の回転対称性群。恒等操作を含め60個の回転操作を持ちます。

## 2. 対称操作と変換行列

`MatrixPathNavigator` では、これらの回転対称操作を 4x4 の同次変換行列として扱います。これは、CSS の `transform: matrix3d(...)` プロパティと互換性があります。

事前に、対象とする多面体の各回転操作に対して、一意な **操作ID (Operation ID)**（文字列）と、それに対応する 4x4 変換行列が定義されている必要があります。この対応関係（例: `Map<OperationID, mat4>`）が、`MatrixPathNavigator` のコンストラクタに渡される `operationsMatrixMap` です。

> **補足**: 現状の実装では、`platonic-data.js` に操作IDと回転軸・角度のデータが定義されており、`main.js` で初期化時にこれらから行列を生成して `operationsMatrixMap` を作成しています。

## 3. 操作パスの定義

操作パスとは、連続して適用したい対称操作（回転）を、その **操作IDの順序付きリスト（配列）** として表現したものです。ナビゲーターはこのパスに従って、指定された操作IDに対応する変換行列を順番に現在の状態に掛け合わせていきます。

## 4. パスの指定方法

`MatrixPathNavigator` クラスのコンストラクタには、第二引数 `specifiedPathIDs` として、操作ID（文字列）の JavaScript 配列を渡します。

```javascript
// 例: 正四面体 (T) の操作データを持つ operationsMatrixMap があるとする

// パスを定義: T_C3_111_120 操作の後に T_C2_X_180 操作を適用する
const pathForT = ['T_C3_111_120', 'T_C2_X_180'];

// ナビゲーターを初期化
const navigatorT = new MatrixPathNavigator(operationMatrices['T'], pathForT);

// ---

// 例: 立方体/正八面体 (O) の操作データを持つ operationsMatrixMap があるとする

// パスを定義: Z軸90度回転 -> X軸90度回転 -> 対角線120度回転
const pathForO = ['O_C4_Z_90', 'O_C4_X_90', 'O_C3_111_120'];

// ナビゲーターを初期化
const navigatorO = new MatrixPathNavigator(operationMatrices['O'], pathForO);

// ---

// 例: 正二十面体 (I) の操作データを持つ operationsMatrixMap があるとする
// (注意: 現在のデータセットでは I グループの操作IDは不完全です)

// パスを定義: あるC5軸72度回転 -> あるC2軸180度回転
const pathForI = ['I_C5_A1_72', 'I_C2_C1_180']; // 仮のID

// ナビゲーターを初期化
const navigatorI = new MatrixPathNavigator(operationMatrices['I'], pathForI);
```

## 5. パス指定後の動作

ナビゲーターがパスで初期化されると、`currentIndex` は `-1`（初期状態）に設定されます。

- `navigator.stepForward()` (turn): `currentIndex` が進み、`path[currentIndex]` に対応する操作行列が現在の累積行列に左から乗算され、新しい姿勢が計算されます。
- `navigator.stepBackward()` (return): `currentIndex` が戻り、履歴に保存されている前の状態の行列が現在の状態となります（乗算の逆演算は不要です）。

これにより、指定したパスに沿って多面体の姿勢をインタラクティブに変化させることができます。

## 6. 利用可能な操作IDについて

パスを指定する際には、初期化時に `MatrixPathNavigator` に渡した `operationsMatrixMap` にキーとして存在する操作IDのみを使用する必要があります。どのIDが利用可能かは、その `operationsMatrixMap` の元となったデータ定義（例: `platonic-data.js` およびそれから行列を生成するロジック）を参照してください。

> **注意**: 特に、I グループのデータは現在不完全なため、定義されていないIDを使用すると警告が表示され、そのステップはスキップされることに注意してください。
