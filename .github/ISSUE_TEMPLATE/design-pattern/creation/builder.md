# ビルダーパターン詳細定義

## パターン名
- ビルダーパターン
- Builder Pattern

## パターン概要
- 複雑なオブジェクトの生成プロセスを段階的（ステップごと）に分割し、同じ生成手順で異なる表現のオブジェクトを構築できるようにする。
- メソッドチェーンや分離されたDirector/Builder構造で柔軟な生成が可能。
- JavaScriptでは、クラスのメソッドチェーンや関数型ビルダーなど多様な実装が可能。

## 構成要素
- Builder（構築手順を定義するクラス/関数）
- Director（生成手順を指示する役割、任意）
- Product（構築されるオブジェクト）

## 主要メソッド・インターフェース
- setX(value): Builder
- setY(value): Builder
- build(): Product
  - 各種設定を段階的に指定し、最終的にProductを返す

## シーケンス図・フロー
- クライアントがBuilderの各種setメソッドをチェーンで呼び出す
- 最後にbuild()でProductを取得
- Directorを使う場合はDirectorが生成手順を制御

## 実装上の考慮点
- メソッドチェーンの戻り値はthisで統一
- 不変オブジェクトやバリデーションの実装も有効
- 必須項目の未設定や初期値に注意

## 仮データ仕様
- サンプルデータ構造: { x: number, y: number, label: string }
- 入出力例: builder.setX(1).setY(2).setLabel('foo').build()

## ユースケース
- 複雑なUI部品や設定オブジェクトの生成
- クエリビルダー、APIリクエスト生成
- ゲームキャラクターや構成要素の段階的生成

## 関連パターン・参考資料
- プロトタイプパターン（複製による生成）
- 参考: GoFデザインパターン, MDN Builder Pattern

---

### JavaScriptによるビルダーパターンのモダンなモック例

```js
class User {
  constructor({ name, age, email }) {
    this.name = name;
    this.age = age;
    this.email = email;
  }
}

class UserBuilder {
  #name = '';
  #age = 0;
  #email = '';
  setName(name) { this.#name = name; return this; }
  setAge(age) { this.#age = age; return this; }
  setEmail(email) { this.#email = email; return this; }
  build() {
    if (!this.#name) throw new Error('name is required');
    return new User({ name: this.#name, age: this.#age, email: this.#email });
  }
}

// 利用例
const user = new UserBuilder()
  .setName('Alice')
  .setAge(30)
  .setEmail('alice@example.com')
  .build();
console.log(user);
```
