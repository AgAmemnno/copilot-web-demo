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


 whenWindowPropertyReady('VirtualTextareaComponent')
    .then(data => {
      console.log('Success! window.myGlobalData is ready:', data);
      customElements.define('virtual-textarea-component', VirtualTextareaComponent);
    })
    .catch(error => {
      console.error('Error waiting for myGlobalData:', error.message);
    });

if (false){
  // --- 使用例 ---
  
  // 例 1: グローバル変数がセットされるのを待つ
  console.log('Waiting for window.myGlobalData...');
  whenWindowPropertyReady('myGlobalData')
    .then(data => {
      console.log('Success! window.myGlobalData is ready:', data);
      // data を使った処理...
    })
    .catch(error => {
      console.error('Error waiting for myGlobalData:', error.message);
    });
  
  // 2秒後にグローバル変数を定義するシミュレーション
  setTimeout(() => {
    console.log('Setting window.myGlobalData = { id: 1, value: "Test" }');
    window.myGlobalData = { id: 1, value: "Test" };
  }, 2000);
  
  
  // 例 2: 特定の条件を満たすプロパティを待つ（タイムアウト付き）
  console.log('Waiting for window.appStatus with status "initialized"...');
  whenWindowPropertyReady('appStatus', {
    predicate: (value) => value != null && value.status === 'initialized',
    timeout: 5000 // 5秒でタイムアウト
  })
    .then(statusObj => {
      console.log('Success! window.appStatus is initialized:', statusObj);
    })
    .catch(error => {
      console.error('Error waiting for appStatus:', error.message); // タイムアウトするはず
    });
  
  // 6秒後に条件を満たすように設定（タイムアウト後なので、上のPromiseは失敗する）
  setTimeout(() => {
    console.log('Setting window.appStatus = { status: "loading" }');
    window.appStatus = { status: "loading" };
  }, 1000);
  setTimeout(() => {
    console.log('Setting window.appStatus = { status: "initialized" } (too late)');
    window.appStatus = { status: "initialized" };
  }, 6000);
  
  
  // 例 3: ドット区切りの深いプロパティを待つ (タイムアウトなし)
  console.log('Waiting for window.config.api.url (no timeout)...');
  whenWindowPropertyReady('config.api.url', { timeout: 0 }) // タイムアウトなし
    .then(apiUrl => {
      console.log('Success! API URL is available:', apiUrl);
    })
    .catch(error => {
      // タイムアウト以外のエラーが発生した場合
       console.error('Unexpected error waiting for config.api.url:', error);
    });
  
  // 段階的にオブジェクトを定義
  setTimeout(() => {
    console.log('Setting window.config = {}');
    window.config = {};
  }, 3000);
  setTimeout(() => {
    console.log('Setting window.config.api = {}');
    window.config.api = {};
  }, 4000);
  setTimeout(() => {
    console.log('Setting window.config.api.url = "https://example.com/api"');
    window.config.api.url = "https://example.com/api";
  }, 5000);

}