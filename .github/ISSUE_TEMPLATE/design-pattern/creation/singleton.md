# シングルトンパターン詳細定義

## パターン名
- シングルトンパターン
- Singleton Pattern

## パターン概要
- あるクラスのインスタンスがプログラム全体で絶対に1つしか存在しないことを保証し、そのインスタンスへのグローバルなアクセスポイントを提供する。
- 主に設定管理やリソース共有など、全体で一貫性が必要な場面で利用される。
- JavaScriptでは、ES6クラスの静的プロパティやIIFE（即時関数）などで実現可能。

## 構成要素
- Singletonクラス（唯一のインスタンスを管理）
- getInstanceメソッド（インスタンス取得用の静的メソッド）

## 主要メソッド・インターフェース
- static getInstance(): Singleton
  - 唯一のインスタンスを返す。未生成なら生成する。
- 任意の業務用メソッド（例: getValue, setValue など）

## シーケンス図・フロー
- クライアントがSingleton.getInstance()を呼び出す
- インスタンスが未生成なら生成し、以降は同じインスタンスを返す
- クライアントは取得したインスタンスのメソッドを利用

## 実装上の考慮点
- マルチスレッド環境では排他制御が必要だが、JavaScript（シングルスレッド）では基本的に不要
- テスト時にインスタンスのリセットが必要な場合がある
- グローバル変数の乱用や副作用に注意

## 仮データ仕様
- サンプルデータ構造: { value: any }
- 入出力例: getInstance()で同じインスタンスが返ること

## ユースケース
- 設定情報管理クラス
- ログ出力クラス
- データベース接続プール

## 関連パターン・参考資料
- Factoryパターン（インスタンス生成の責任分離）
- 参考: GoFデザインパターン, MDN Singleton Pattern

---

### JavaScriptによるシングルトンパターンのモック例

```js
class Singleton {
  static #instance;
  constructor() {
    if (Singleton.#instance) {
      return Singleton.#instance;
    }
    this.value = Math.random(); // デモ用
    Singleton.#instance = this;
  }
  static getInstance() {
    if (!Singleton.#instance) {
      Singleton.#instance = new Singleton();
    }
    return Singleton.#instance;
  }
  getValue() {
    return this.value;
  }
}

// 利用例
const a = Singleton.getInstance();
const b = Singleton.getInstance();
console.log(a === b); // true
console.log(a.getValue()); // 例: 0.123...
console.log(b.getValue()); // aと同じ値
```
