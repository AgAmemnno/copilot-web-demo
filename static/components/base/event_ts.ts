// --- イベントデータのスキーマ ---
interface CustomEventDetail<T> {
    payload: T; // イベント固有のデータ
    sourceComponentId: string; // 発火元のID (デバッグや情報源特定に利用)
}

// --- イベント発火オプション ---
interface EventDispatchOptions {
    bubbles?: boolean; // DOMをバブルアップするか
    composed?: boolean; // Shadow DOM境界を越えるか
    target?: EventTarget; // 発火ターゲット (デフォルトはwindow)
}

// --- ベースクラス (修正版) ---
abstract class EventAwareBaseComponent extends HTMLElement {
    readonly componentId: string;
    protected isComponentReady: boolean = false; // 自身の初期化（依存関係解決含む）完了フラグ
    private readyPromise: Promise<void>;
    private resolveReady!: () => void;

    // 自身の準備完了前に発火されたイベントのキュー
    private outgoingEventQueue: { eventName: string, detail: any, options?: EventDispatchOptions }[] = [];

    constructor() {
        super();
        this.componentId = this._generateUniqueId(); // ID生成
        this.attachShadow({ mode: 'open' }); // Shadow DOM有効化
        this.readyPromise = new Promise(resolve => {
            this.resolveReady = resolve;
        });
    }

    // DOM接続時のライフサイクルコールバック
    connectedCallback() {
        // 非同期でコンポーネントの初期化（依存関係解決を含む）を実行
        this._initializeComponentInternal().then(() => {
            this.isComponentReady = true; // 準備完了フラグを立てる
            this.resolveReady(); // Promiseを解決
            console.log(`Component ${this.componentId} is ready.`);
            this._dispatchComponentReadyEvent(); // 準備完了イベントを発火
            this._processOutgoingEventQueue(); // キューに入れられたイベントを発火
            this.registerEventListeners(); // イベントリスナーを登録
        }).catch(error => {
            console.error(`Component ${this.componentId} initialization failed:`, error);
            // 必要に応じてエラー処理
        });
    }

    // DOM切断時のライフサイクルコールバック
    disconnectedCallback() {
        this.unregisterEventListeners(); // リスナーを解除
    }

    // --- 内部初期化処理 ---
    private async _initializeComponentInternal(): Promise<void> {
        // サブクラス固有の初期化処理を呼び出す
        await this.initializeComponent();
        // ここで、このコンポーネントが機能するために必須な内部要素が
        // 確実に存在するかなどの最終チェックを行うことも可能
        // 例: if (!this.shadowRoot?.querySelector('#crucial-element')) {
        //        throw new Error("Crucial element not found after initialization.");
        //     }
    }

    // --- サブクラスが実装するメソッド ---

    /**
     * コンポーネント固有の非同期初期化処理を実装します。
     * 必要なDOM要素の生成、データの取得などを行います。
     * このメソッドが正常に完了すると、コンポーネントは準備完了とみなされます。
     */
    protected abstract initializeComponent(): Promise<void>;

    /**
     * このコンポーネントが購読するイベントリスナーを登録します。
     * this.listenToCustomEvent を使用してください。
     * このメソッドはコンポーネントの準備完了後に呼び出されます。
     */
    protected abstract registerEventListeners(): void;

    /**
     * 登録したイベントリスナーを解除します (通常は自動で解除されます)。
     * 特殊なケースで手動解除が必要な場合に使用します。
     */
    protected abstract unregisterEventListeners(): void;


    // --- イベント発火メソッド ---
    /**
     * カスタムイベントを発火します。
     * コンポーネント自身の準備が完了していない場合、イベントはキューイングされ、
     * 準備完了後に発火されます。
     * @param eventName イベント名 (命名規則に従うこと)
     * @param detail イベントで渡すデータ (payload)
     * @param options 発火オプション (target, bubbles, composed)
     */
    protected dispatchCustomEvent<T>(eventName: string, detail: T, options?: EventDispatchOptions): void {
        // ★ Publisherの限定に関する規約チェック (任意)
        // if (!this._isEventAllowedToPublish(eventName)) {
        //     console.warn(`Component ${this.componentId} is trying to dispatch an event '${eventName}' it might not own.`);
        // }
        if (!this._isValidEventName(eventName)) {
             console.warn(`[${this.componentId}] Invalid event name format: ${eventName}`);
             // return or throw
        }

        const eventDetail: CustomEventDetail<T> = {
            payload: detail,
            sourceComponentId: this.componentId
        };

        if (!this.isComponentReady) {
            // 自身の準備ができていない場合、キューに入れる
            this.outgoingEventQueue.push({ eventName, detail: eventDetail, options });
            console.log(`[${this.componentId}] Queued event (not ready): ${eventName}`);
            return;
        }

        // 準備完了している場合は即座に発火
        this._dispatchInternal(eventName, eventDetail, options);
    }

    // 内部的なイベント発火処理
    private _dispatchInternal<T>(eventName: string, eventDetail: CustomEventDetail<T>, options?: EventDispatchOptions): void {
        const event = new CustomEvent<CustomEventDetail<T>>(eventName, {
            detail: eventDetail,
            bubbles: options?.bubbles ?? false,
            composed: options?.composed ?? false
        });
        const target = options?.target ?? window; // デフォルトはグローバル
        target.dispatchEvent(event);
        console.log(`[${this.componentId}] Dispatched event: ${eventName} to ${target === window ? 'window' : 'specific target'}`);
    }

    // キュー内のイベントを処理
    private _processOutgoingEventQueue(): void {
        console.log(`[${this.componentId}] Processing outgoing event queue (${this.outgoingEventQueue.length} items)`);
        let queuedEvent;
        while (queuedEvent = this.outgoingEventQueue.shift()) {
            this._dispatchInternal(queuedEvent.eventName, queuedEvent.detail, queuedEvent.options);
        }
    }

    // --- イベントリスンメソッド ---
    private managedListeners: { target: EventTarget, type: string, listener: EventListenerOrEventListenerObject }[] = [];
    /**
     * カスタムイベントを購読します。
     * ハンドラは、リスナーコンポーネント自身の準備が完了してから実行されます。
     * ハンドラ内で、イベント処理に必要な他の依存関係（要素の存在など）を
     * 確認・待機する処理を実装する必要があります。
     * @param target イベントをリッスンするターゲット (window, document, elementなど)
     * @param eventName 購読するイベント名
     * @param handler イベントハンドラ関数。非同期関数も可能。
     */
    protected listenToCustomEvent<T>(
        target: EventTarget,
        eventName: string,
        handler: (payload: T, sourceComponentId: string) => void | Promise<void>
    ): void {
        if (!this._isValidEventName(eventName)) {
            console.warn(`[${this.componentId}] Listening to potentially invalid event name: ${eventName}`);
        }

        const asyncHandler = async (event: Event) => {
            // CustomEventであることを確認
            if (!(event instanceof CustomEvent && event.detail && typeof event.detail.sourceComponentId === 'string')) {
                return;
            }
            const customEvent = event as CustomEvent<CustomEventDetail<T>>;

            // 1. 自身の準備が完了するのを待つ
            await this.readyPromise;

            console.log(`[${this.componentId}] Received event: ${eventName} from ${customEvent.detail.sourceComponentId}`);

            // 2. ハンドラを実行 (ハンドラ内で依存関係チェックを行う)
            try {
                // handler内の 'this' がコンポーネントインスタンスを指すようにbind
                await handler.call(this, customEvent.detail.payload, customEvent.detail.sourceComponentId);
            } catch (error) {
                console.error(`[${this.componentId}] Error in event handler for "${eventName}":`, error);
            }
        };

        target.addEventListener(eventName, asyncHandler);
        this.managedListeners.push({ target, type: eventName, listener: asyncHandler });
    }

    // 登録したリスナーをすべて解除
    private _unregisterAllListeners(): void {
        this.managedListeners.forEach(({ target, type, listener }) => {
            target.removeEventListener(type, listener);
        });
        this.managedListeners = [];
    }

    // --- 依存関係（前提条件）ヘルパー ---

    /**
     * Shadow DOM内の指定された要素が存在するか確認します。
     * @param selector CSSセレクタ
     * @returns 要素が存在すればtrue
     */
    protected elementExistsInShadow(selector: string): boolean {
        return !!this.shadowRoot?.querySelector(selector);
    }

    /**
     * Shadow DOM内の指定された要素が出現するまで待機します。
     * @param selector CSSセレクタ
     * @param timeout タイムアウト時間 (ミリ秒)
     * @returns 見つかった要素、またはnull (タイムアウト時)
     */
    protected async waitForElementInShadow(selector: string, timeout: number = 3000): Promise<Element | null> {
        await this.readyPromise; // 自身の準備完了を待つ
        if (this.elementExistsInShadow(selector)) {
            return this.shadowRoot!.querySelector(selector);
        }
        return new Promise((resolve) => {
            const checkInterval = 50;
            let elapsedTime = 0;
            const intervalId = setInterval(() => {
                const element = this.shadowRoot?.querySelector(selector);
                if (element) {
                    clearInterval(intervalId);
                    resolve(element);
                } else {
                    elapsedTime += checkInterval;
                    if (elapsedTime >= timeout) {
                        clearInterval(intervalId);
                        console.warn(`[${this.componentId}] Element "${selector}" not found in shadow DOM within timeout.`);
                        resolve(null);
                    }
                }
            }, checkInterval);
        });
    }

    // 他コンポーネントの準備完了待機は前回同様 (waitForComponentReady)

    // --- 準備完了通知 ---
    private _dispatchComponentReadyEvent(): void {
        // グローバルに自身の準備完了を通知 (イベント名はIDを含む)
        this._dispatchInternal(`${this.componentId}:ready`, { componentId: this.componentId }, { target: window });
    }

    // --- ヘルパーメソッド ---
    private _generateUniqueId(): string {
        // プロジェクト固有の命名規則やUUID生成などを実装
        return 'comp-' + crypto.randomUUID().substring(0, 8);
    }

    private _isValidEventName(eventName: string): boolean {
        // イベント名の命名規則を定義 (例: 'namespace:action' or 'component-id:ready')
        return /^[a-z0-9-]+:[a-z0-9-]+$/i.test(eventName) || /^[a-z0-9-]+:ready$/i.test(eventName);
    }

    // (任意) Publisher限定のためのチェックロジック
    // private _isEventAllowedToPublish(eventName: string): boolean {
    //     // このコンポーネントタイプが発火を許可されているイベントかチェック
    //     const allowedEvents = ['my-component:data-updated', 'my-component:action-failed'];
    //     return allowedEvents.includes(eventName) || eventName.endsWith(':ready');
    // }
}

// --- 利用例 ---
class DataProvider extends EventAwareBaseComponent {
    protected async initializeComponent(): Promise<void> {
        console.log(`[${this.componentId}] Initializing DataProvider...`);
        // データ取得などの非同期処理
        await new Promise(resolve => setTimeout(resolve, 500)); // ダミー待機
        console.log(`[${this.componentId}] DataProvider initialized.`);
    }

    protected registerEventListeners(): void {
        // 他のコンポーネントからのデータ要求をリッスン (例)
        this.listenToCustomEvent(window, 'data-requester:request-data', async (payload, source) => {
            console.log(`[${this.componentId}] Received data request from ${source}`, payload);
            // データを準備して発火
            const data = { items: ['apple', 'banana', 'cherry'], timestamp: Date.now() };
            this.dispatchCustomEvent('data-provider:data-available', data);
        });
    }
    protected unregisterEventListeners(): void { this._unregisterAllListeners(); }
}

class DataDisplay extends EventAwareBaseComponent {
    private displayArea: HTMLElement | null = null;

    protected async initializeComponent(): Promise<void> {
        console.log(`[${this.componentId}] Initializing DataDisplay...`);
        this.shadowRoot!.innerHTML = `<div id="display-area">Waiting for data...</div>`;
        // 依存する要素（表示エリア）を待機・取得
        this.displayArea = await this.waitForElementInShadow('#display-area') as HTMLElement;
        if (!this.displayArea) {
            throw new Error("Display area element (#display-area) not found after creation!");
        }
        console.log(`[${this.componentId}] DataDisplay initialized.`);
    }

    protected registerEventListeners(): void {
        // データ供給元からのイベントをリッスン
        this.listenToCustomEvent(window, 'data-provider:data-available', this.handleDataAvailable);
    }

    // イベントハンドラ
    private async handleDataAvailable(payload: { items: string[], timestamp: number }, sourceComponentId: string): Promise<void> {
        // **依存関係（前提条件）のチェック:**
        // 表示エリア要素が確実に存在するか再確認 (initializeComponentで取得済みだが念のため)
        if (!this.displayArea) {
             console.error(`[${this.componentId}] Display area is not available. Cannot process event.`);
             // 必要であれば要素を待機し直す
             // this.displayArea = await this.waitForElementInShadow('#display-area') as HTMLElement;
             // if(!this.displayArea) return; // それでもなければ諦める
             return;
        }

        // 依存関係が満たされているので、処理を実行
        console.log(`[${this.componentId}] Data received from ${sourceComponentId}. Updating display.`);
        this.displayArea.textContent = `Data at ${payload.timestamp}: ${payload.items.join(', ')}`;

        // (例) 処理完了を通知する必要があればイベントを発火
        // this.dispatchCustomEvent('data-display:updated', { success: true });
    }
    protected unregisterEventListeners(): void { this._unregisterAllListeners(); }
}

// customElements.define('data-provider', DataProvider);
// customElements.define('data-display', DataDisplay);

// --- HTML ---
// <data-provider id="provider1"></data-provider>
// <data-display id="display1"></data-display>
// <button onclick="document.getElementById('provider1').dispatchCustomEvent('data-requester:request-data', { type: 'fruits' })">Request Data</button>