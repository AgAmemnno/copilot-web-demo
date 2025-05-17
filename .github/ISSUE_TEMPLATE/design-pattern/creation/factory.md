# ファクトリーパターン詳細定義

## パターン名
- ファクトリーパターン（Factory Method / Abstract Factory）
- Factory Pattern

## パターン概要
- オブジェクト生成の責任をクライアントから分離し、生成方法をサブクラスやファクトリーに委譲する。
- 具象クラスに依存せず、柔軟な拡張や切り替えが可能。
- JavaScriptでは、クラス・関数・ファクトリーオブジェクトなど多様な実装が可能。

## 構成要素
- Creator（生成責任を持つ基底クラスまたは関数）
- ConcreteCreator（具象生成クラス/関数）
- Product（生成されるオブジェクトの型）
- ConcreteProduct（具象オブジェクト）

## 主要メソッド・インターフェース
- createProduct(type: string): Product
  - typeに応じて適切な具象Productを返す
- Productの業務用メソッド（例: render, execute など）

## シーケンス図・フロー
- クライアントがCreatorのcreateProductを呼び出す
- typeや条件に応じてConcreteProductを生成・返却
- クライアントは返されたProductのメソッドを利用

## 実装上の考慮点
- 生成ロジックの分離により、拡張やテストが容易
- type判定の乱用やif/switchの肥大化に注意
- DI（依存性注入）やMap/Recordによる動的生成も有効

## 仮データ仕様
- サンプルデータ構造: { type: string, ...props }
- 入出力例: createProduct('button')でButtonProductインスタンスが返る

## ユースケース
- UI部品の動的生成
- データパーサーの切り替え
- サービス実装の差し替え

## 関連パターン・参考資料
- シングルトンパターン（生成インスタンスの一意性）
- 参考: GoFデザインパターン, MDN Factory Pattern

---

### JavaScriptによるファクトリーパターンのモダンなモック例

```js
// Productインターフェース
class UIComponent {
  render() { throw new Error('Not implemented'); }
}

// 具象Product
class Button extends UIComponent {
  render() { return '<button>Button</button>'; }
}
class TextBox extends UIComponent {
  render() { return '<input type="text">'; }
}

// Factory（ES2022: #private, static, Map活用）
class UIComponentFactory {
  static #registry = new Map([
    ['button', Button],
    ['textbox', TextBox],
  ]);
  static create(type) {
    const Comp = UIComponentFactory.#registry.get(type);
    if (!Comp) throw new Error(`Unknown type: ${type}`);
    return new Comp();
  }
}

// 利用例
const btn = UIComponentFactory.create('button');
const txt = UIComponentFactory.create('textbox');
console.log(btn.render()); // <button>Button</button>
console.log(txt.render()); // <input type="text">
```
