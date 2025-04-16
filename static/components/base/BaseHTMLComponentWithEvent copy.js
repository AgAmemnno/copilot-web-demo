//import BaseHTMLComponent from './BaseHTMLComponent.js';
// 機能を提供する Mixin オブジェクト
const EventComponentMixin = {
  // Mixin の初期化（コンストラクタ内や接続時に呼び出す）
  initializeEventHandling() {
    // 各インスタンスに一意のIDを付与
    if (!this.id) { // 既にIDがあればそれを使う、なければ生成
      this.id = this._generateComponentId();
    }
    this._registerComponentId();
    console.log(`[${this.id}] Event handling initialized.`);

    // 接続時に依存関係をチェックする準備
    this._checkDependenciesOnConnect = () => {
        queueMicrotask(() => { // 少し遅延させて実行
             console.log(`[${this.id}] Checking dependencies on connect...`);
             this.resolveComponentDependencies();
        });
    };
    // connectedCallback でこの関数を呼び出すようにする
  },

  _generateComponentId() {
    // ES推奨の substring を使用
    return 'component-' + Math.random().toString(36).substring(2, 9);
  },

  _registerComponentId() {
    // sessionStorage アクセスは try...catch で囲む
    try {
      const initialData = JSON.stringify({ events: [], dependencies: [] });
      sessionStorage.setItem(this.id, initialData);
    } catch (e) {
      console.error(`[${this.id}] Failed to register ID in sessionStorage:`, e);
    }
  },

  retrieveComponentEventInfo() {
    if (!this.id) return { events: [], dependencies: [] };
    try {
      const eventInfo = sessionStorage.getItem(this.id);
      return eventInfo ? JSON.parse(eventInfo) : { events: [], dependencies: [] };
    } catch (e) {
      console.error(`[${this.id}] Failed to retrieve event info from sessionStorage:`, e);
      return { events: [], dependencies: [] };
    }
  },

  registerComponentEvent(eventName, dependencies = []) {
    if (!this.id) {
      console.error("Component ID is not set. Cannot register event.");
      return;
    }
    const eventInfo = this.retrieveComponentEventInfo();

    // イベント名の重複を避ける（必要に応じて）
    if (!eventInfo.events.includes(eventName)) {
      eventInfo.events.push(eventName);
    }
    // 依存関係リストを更新 (重複を避ける)
    const currentDeps = new Set(eventInfo.dependencies || []);
    dependencies.forEach(dep => currentDeps.add(dep));
    eventInfo.dependencies = Array.from(currentDeps);

    try {
      sessionStorage.setItem(this.id, JSON.stringify(eventInfo));
    } catch (e) {
      console.error(`[${this.id}] Failed to save event info to sessionStorage:`, e);
    }
  },

  // 依存関係が解決されたかチェックし、イベントを発火する
  resolveComponentDependencies() {
    if (!this.id) return false;
    const eventInfo = this.retrieveComponentEventInfo();
    if (!eventInfo || !Array.isArray(eventInfo.dependencies) || eventInfo.dependencies.length === 0) {
      // 依存関係がない場合は解決済みとみなすこともできる
      // console.log(`[${this.id}] No dependencies to resolve.`);
      // this.dispatchComponentCustomEvent(`${this.id}:dependencies-resolved`, { componentId: this.id });
      return true; // 依存がないので解決済み
    }

    try {
      // sessionStorage にキーが存在するかどうかで判定
      const allDependenciesResolved = eventInfo.dependencies.every(dep => sessionStorage.getItem(dep) !== null);

      if (allDependenciesResolved) {
        console.log(`[${this.id}] All dependencies resolved:`, eventInfo.dependencies);
        // 依存関係解決を示すイベントを発火 (コンポーネント自身から)
        this.dispatchComponentCustomEvent(`dependencies-resolved`, { componentId: this.id, resolvedDependencies: eventInfo.dependencies });
        return true;
      } else {
        // console.log(`[${this.id}] Dependencies not yet resolved.`);
        return false;
      }
    } catch (e) {
      console.error(`[${this.id}] Error resolving dependencies:`, e);
      return false;
    }
  },

  // カスタムイベントを発火する (自身の要素から発火させる)
  dispatchComponentCustomEvent(eventName, detail = {}, options = {}) {
    const eventOptions = {
      detail: {
        ...detail,
        // 自動で発火元IDを追加
        sourceComponentId: this.id
      },
      bubbles: options.bubbles ?? true, // デフォルトでバブルアップ有効
      composed: options.composed ?? true, // デフォルトでShadowDOMを越える
      cancelable: options.cancelable ?? true,
    };
    const event = new CustomEvent(eventName, eventOptions);
    this.dispatchEvent(event); // 自分自身の要素から発火
    console.log(`[${this.id}] Dispatched event: ${eventName}`);
  }
};

function extends_EventComponentMixin(targetClass) {
    // Mixinオブジェクトの各プロパティ（メソッド）を...
    Object.getOwnPropertyNames(EventComponentMixin).forEach(name => {
        // ターゲットクラスのプロトタイプにコピーする
        // これにより、ターゲットクラスの全インスタンスがこのメソッドを利用できる
        Object.defineProperty(
            targetClass.prototype,
            name,
            Object.getOwnPropertyDescriptor(EventComponentMixin, name)
        );
    });
    console.log(`Mixin applied to ${targetClass.name}`);
}

// ベースとなるカスタム要素クラス
class MyCustomElement extends HTMLElement {
  constructor() {
    // HTMLElementのコンストラクタを呼び出す
    super();

    // Shadow DOM の設定など、要素固有の初期化
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; border: 1px solid #ccc; padding: 10px; margin: 5px; }
        p { margin: 0; }
        button { margin-top: 5px; }
      </style>
      <p>My Custom Element</p>
      <p>ID: <span class="component-id"></span></p>
      <p>Dependencies Resolved: <span class="deps-status">No</span></p>
      <button id="action-button">Do Action</button>
    `;

    // ★ Mixin の初期化メソッドを呼び出す
    // これにより ID 生成と sessionStorage への登録が行われる
    //

    console.log(`[${this.id}] MyCustomElement constructor finished.`);
  }
  init(){
    this.initializeEventHandling();
  }
  // ライフサイクルコールバック: 要素がDOMに追加されたとき
  connectedCallback() {
    console.log(`[${this.id}] connected to DOM.`);
    // ID を表示
    this.shadowRoot.querySelector('.component-id').textContent = this.id;

    // ボタンにイベントリスナーを設定
    this._actionButton = this.shadowRoot.querySelector('#action-button');
    this._actionButton.addEventListener('click', this._handleActionClick);

    // ★ Mixin で用意された接続時の依存関係チェックを実行
    if (typeof this._checkDependenciesOnConnect === 'function') {
        this._checkDependenciesOnConnect();
    }

    // ★ Mixin で追加された依存関係解決イベントをリッスン
    this.addEventListener('dependencies-resolved', this._handleDependenciesResolved);
  }

  // ライフサイクルコールバック: 要素がDOMから削除されたとき
  disconnectedCallback() {
    console.log(`[${this.id}] disconnected from DOM.`);
    // イベントリスナーを削除 (メモリリーク防止)
    this._actionButton.removeEventListener('click', this._handleActionClick);
    this.removeEventListener('dependencies-resolved', this._handleDependenciesResolved);
    // 必要であれば sessionStorage から自身の情報を削除する処理も追加できる
    // try { sessionStorage.removeItem(this.id); } catch(e) {}
  }

  // --- 要素固有のメソッド ---
  _handleActionClick = () => { // アロー関数で this を束縛
    console.log(`[${this.id}] Action button clicked.`);
    // ★ Mixin で追加されたイベント発行メソッドを使用
    this.dispatchComponentCustomEvent('element-action', { data: Math.random() });
  }

  _handleDependenciesResolved = (event) => { // アロー関数で this を束縛
     console.log(`[${this.id}] Handling 'dependencies-resolved' event internally.`);
     this.shadowRoot.querySelector('.deps-status').textContent = 'Yes';
     this.shadowRoot.querySelector('.deps-status').style.color = 'green';
     // イベントの詳細情報を使用する例
     console.log('Resolved dependencies list:', event.detail.resolvedDependencies);
  }

  // 外部から依存関係の再チェックを促すメソッド (例)
  triggerDependencyCheck() {
    console.log(`[${this.id}] Manually triggering dependency check.`);
    this.resolveComponentDependencies();
  }

  // この要素が依存するものを登録する例
  setupDependencies(dependencyIds = []) {
      this.registerComponentEvent('setup', dependencyIds); // イベント名は任意
      console.log(`[${this.id}] Registered dependencies:`, dependencyIds);
      // 登録後にチェックを実行
      this.resolveComponentDependencies();
  }

}

// ★ 作成したクラスのプロトタイプに Mixin のメソッド群を適用
extends_EventComponentMixin(MyCustomElement);

// ★ カスタム要素としてブラウザに登録
customElements.define('my-custom-element', MyCustomElement);


// --- 動作確認 ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded. Creating elements...");

    const element1 = document.createElement('my-custom-element');
    element1.init();
    element1.setupDependencies(['dep-A', 'dep-B']); // 依存関係を設定
    document.body.appendChild(element1);

    const element2 = document.createElement('my-custom-element');
    element2.setupDependencies(['dep-A']); // 依存関係を設定
    document.body.appendChild(element2);

    const element3 = document.createElement('my-custom-element');
    // 依存関係なし
    document.body.appendChild(element3);


    // グローバルなイベントリスナー (バブルアップしてきたイベントを捕捉)
    document.body.addEventListener('element-action', (event) => {
        console.log("Event 'element-action' caught on body:", event.detail);
    });

    // 依存関係をシミュレート (別のコンポーネントが準備完了したとする)
    console.log("Simulating dependency registration...");
    setTimeout(() => {
        try { sessionStorage.setItem('dep-A', 'ready'); } catch(e){}
        console.log(">>> Dependency 'dep-A' is now ready.");
        // 依存関係が更新された可能性があるので、各要素に再チェックを促す
        document.querySelectorAll('my-custom-element').forEach(el => el.triggerDependencyCheck());
    }, 2000);

    setTimeout(() => {
        try { sessionStorage.setItem('dep-B', 'ready'); } catch(e){}
        console.log(">>> Dependency 'dep-B' is now ready.");
        document.querySelectorAll('my-custom-element').forEach(el => el.triggerDependencyCheck());
    }, 4000);

});

// sessionStorageをクリアするボタン (テスト用)
const clearButton = document.createElement('button');
clearButton.textContent = 'Clear Session Storage & Reload';
clearButton.style.marginTop = '20px';
clearButton.onclick = () => {
    try { sessionStorage.clear(); } catch(e){}
    location.reload();
};
document.body.appendChild(clearButton);