# プロトタイプパターン詳細定義

## パターン名
- プロトタイプパターン（Prototype Pattern）
- Prototype Pattern

## パターン概要
- 既存オブジェクトを雛形（プロトタイプ）として複製し、新たなインスタンスを生成する。
- newによる生成やファクトリーの代替として、動的なオブジェクト生成や設定の継承に有効。
- JavaScriptではObject.createやスプレッド演算子、クラスのcloneメソッド等で実現可能。

## 構成要素
- Prototype（複製元となるオブジェクト/クラス）
- ConcretePrototype（具体的な複製対象）
- Client（複製を要求する利用者）

## 主要メソッド・インターフェース
- clone(): Prototype
  - 自身の複製（ディープ/シャローコピー）を返す
- プロトタイプの業務用メソッド（例: render, execute など）

## シーケンス図・フロー
- ClientがPrototypeのclone()を呼び出す
- Prototypeが自身の複製を返却
- Clientは複製インスタンスを利用

## 実装上の考慮点
- 複製の深さ（シャロー/ディープコピー）に注意
- 参照型プロパティの共有・副作用に注意
- JavaScriptのObject.createやstructuredCloneの活用
- 複雑なオブジェクトはcloneメソッドの明示実装が推奨

## 仮データ仕様
- サンプルデータ構造: { type: string, props: object }
- 入出力例: prototype.clone()で同じ内容の新インスタンスが返る

## ユースケース
- 設定済みオブジェクトのテンプレート化
- 複雑な初期化コストの回避
- ゲームやUI部品の雛形複製

## 関連パターン・参考資料
- ファクトリーパターン（生成責任の分離）
- 参考: GoFデザインパターン, MDN Object.create, structuredClone

---

### JavaScriptによるプロトタイプパターンのモダンなモック例

```js
// Prototypeインターフェース
class Shape {
  constructor(type, props) {
    this.type = type;
    this.props = { ...props };
  }
  clone() {
    // ディープコピー（propsがネストしない前提）
    return new Shape(this.type, { ...this.props });
  }
  render() {
    return `<shape type="${this.type}" props="${JSON.stringify(this.props)}">`;
  }
}

// 具象Prototype
const circleProto = new Shape('circle', { radius: 10, color: 'red' });
const rectProto = new Shape('rect', { width: 20, height: 10, color: 'blue' });

// 利用例
const c1 = circleProto.clone();
c1.props.radius = 15;
const r1 = rectProto.clone();
r1.props.color = 'green';
console.log(c1.render()); // <shape type="circle" props="{\"radius\":15,\"color\":\"red\"}">
console.log(r1.render()); // <shape type="rect" props="{\"width\":20,\"height\":10,\"color\":\"green\"}">
```
