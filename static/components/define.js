/**
 * window オブジェクトへのアクセス時に発生する可能性のあるタイムアウトエラー
 */
class TimeoutError extends Error {
    constructor(message) {
      super(message);
      this.name = "TimeoutError";
    }
  }
  
/**
* window オブジェクトの特定のプロパティが定義される（または条件を満たす）のを待つ Promise を返します。
* customElements.whenDefined() に似た動作を提供します。
*
* @template T - 期待されるプロパティの型
* @param {string} propertyName - 監視する window オブジェクトのプロパティ名 (ドット区切りも可、例: 'myApp.config.user')
* @param {object} [options] - オプション設定
* @param {number} [options.timeout=10000] - タイムアウト時間 (ミリ秒単位)。0 または負の値でタイムアウト無制限。
* @param {number} [options.interval=100] - プロパティをチェックする間隔 (ミリ秒単位)。
* @param {(value: T | undefined | null) => boolean} [options.predicate=(value) => value != null] - プロパティの値が満たすべき条件を判定する関数。デフォルトは undefined または null でないこと。
* @returns {Promise<T>} 条件を満たしたプロパティの値で解決される Promise。タイムアウトまたはアクセスエラーの場合はリジェクトされます。
*/
function whenWindowPropertyReady(
propertyName,
options = {}
) {
const {
  timeout = 10000, // デフォルトタイムアウト: 10秒
  interval = 100,  // デフォルトチェック間隔: 100ミリ秒
  predicate = (value) => value != null // デフォルト条件: null または undefined でない
} = options;

// ドット区切りのプロパティ名を解決する内部関数
const resolveProperty = (obj, path) => {
    try {
      return path.split('.').reduce((current, key) => {
          // null または undefined のオブジェクトのプロパティにアクセスしようとしたら undefined を返す
          return current == null ? undefined : current[key];
      }, obj);
    } catch (e) {
        // プロパティアクセス中にエラーが発生した場合 (通常は起こりにくい)
        return undefined;
    }
};


return new Promise((resolve, reject) => {
  let timeoutTimerId = null;
  let intervalTimerId = null;

  // タイマーをすべてクリアする関数
  const clearTimers = () => {
    if (timeoutTimerId) clearTimeout(timeoutTimerId);
    if (intervalTimerId) clearTimeout(intervalTimerId);
  };

  // プロパティをチェックする関数
  const checkProperty = () => {
    const value = resolveProperty(window, propertyName);

    if (predicate(value)) {
      // 条件を満たしたらタイマーをクリアして Promise を解決
      clearTimers();
      resolve(value);
    } else {
      // 条件を満たさない場合、次のチェックをスケジュール
      // (setTimeout を使うことで、チェック処理自体の時間の影響を受けにくい)
      intervalTimerId = setTimeout(checkProperty, interval);
    }
  };

  // タイムアウト処理の設定 (timeout > 0 の場合のみ)
  if (timeout > 0) {
    timeoutTimerId = setTimeout(() => {
      clearTimers(); // チェック用のタイマーもクリア
      reject(new TimeoutError(`Waiting for window property "${propertyName}" timed out after ${timeout}ms`));
    }, timeout);
  }

  // 最初のチェックを開始
  checkProperty();
});
}

window.staging = 0
 whenWindowPropertyReady('VirtualTextareaComponent')
    .then(data => {
        customElements.define('base-html-component', BaseHTMLComponent);
        customElements.define('base-html-component-with-event', BaseHTMLComponentWithEvent);
        customElements.define('animation-component', AnimationComponent);
        customElements.define('button-comp', ButtonComponent);
        customElements.define('form-component', FormComponent);
        customElements.define('input-comp', InputComponent);
        customElements.define('modal-component', ModalComponent);
        customElements.define('collapsible-panel', CollapsiblePanel);
        customElements.define('prompt-component', PromptComponent);
        customElements.define('selector-component', SelectorComponent);
        customElements.define('virtual-textarea-component', VirtualTextareaComponent);
        console.log('Success! customElements is ready');
        window.staging = 1
    })
    .catch(error => {
      console.error('Error waiting for myGlobalData:', error.message);
    });


document.addEventListener('DOMContentLoaded', () => {
   
    /*

    */
});