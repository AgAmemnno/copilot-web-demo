import  {logMessage,setButtonsDisabled,showPhase} from './log.js';
class IDB {
    /* ... (前回のコードをここに貼り付け) ... */
    static #savedDom = [];
    static set savedDom(val){
        IDB.#savedDom.push(val);
    }
    static get savedDom(){
        return IDB.#savedDom;
    }

    static loadedthen = {};
    static savedthen = {};
    static init(dbName='AppProjectDB', dbVersion=1) {
        IDB.dbName = dbName;
        IDB.dbVersion = dbVersion;
        IDB.db = null;
        IDB.objectStoreName = 'IDB';
        IDB.savedDom = {};
        IDB.loadedDom = {};
    }

    static async openDB() {
        return new Promise( (resolve, reject) => {
            if (IDB.db) {
                resolve(IDB.db);
                return;
            }
            const request = indexedDB.open(IDB.dbName, IDB.dbVersion);
            request.onerror = (event) => {
                console.error('IndexedDB error:', event.target.error);
                reject('IndexedDB error: ' + event.target.error);
            };
            request.onsuccess = (event) => {
                IDB.db = event.target.result;
                console.log('IndexedDB opened.');
                resolve(IDB.db);
            };
            request.onupgradeneeded = (event) => {
                console.log('IndexedDB upgrade needed.');
                const db = event.target.result;
                // オブジェクトストア名が異なれば、新たに追加
                if (!db.objectStoreNames.contains(IDB.objectStoreName)) {
                    // innerHTMLを保存するオブジェクトストア。キーは固定でも良いし、指定可能でも良い。
                    db.createObjectStore(IDB.objectStoreName);
                    //, { keyPath: 'key' });
                    console.log(`Object store "${IDB.objectStoreName}" created.`);
                }
                /*
             // もしinnerHTML専用のストアを作るなら:
            const innerHTMLStoreName = 'innerHTMLStates';
            if (!db.objectStoreNames.contains(innerHTMLStoreName)) {
                db.createObjectStore(innerHTMLStoreName, { keyPath: 'containerId' }); // キーをコンテナIDとする
                console.log(`Object store "${innerHTMLStoreName}" created.`);
            }
            */
            };
        });
    }

    static async _getStore(storeName, mode) {
        if (!IDB.db)
            await IDB.openDB();
        return IDB.db.transaction(storeName, mode).objectStore(storeName);
    }

    // 汎用的な saveState (前回同様)
    static async saveState(key, value, storeName=IDB.objectStoreName) {
        return new Promise(async (resolve, reject) => {
            try {
                const store = await IDB._getStore(storeName, 'readwrite');
                const request = store.put(value, key);
                request.onsuccess = () => resolve();
                request.onerror = (event) => reject(event.target.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    // 汎用的な loadState (前回同様)
    static async loadState(key, storeName=IDB.objectStoreName) {
        return new Promise(async (resolve, reject) => {
            try {
                const store = await IDB._getStore(storeName, 'readonly');
                const request = store.get(key);
                request.onsuccess = () => {
                    const data = request.result;
                    resolve(data);
                }
                ;
                request.onerror = (event) => reject(event.target.error);
            } catch (error) {
                reject(error);
            }
        }
        );
    }

    // innerHTML専用の保存 (オプション)
    static async saveInnerHTMLState(containerId, innerHTML) {
        const storeName = 'innerHTMLStates';
        return new Promise(async (resolve, reject) => {
            try {
                const store = await IDB._getStore(storeName, 'readwrite');
                const request = store.put({
                    containerId: containerId,
                    html: innerHTML
                });
                request.onsuccess = () => resolve();
                request.onerror = (event) => reject(event.target.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    // innerHTML専用の読み込み (オプション)
    static async loadInnerHTMLState(containerId) {
        const storeName = 'innerHTMLStates';
        return new Promise(async (resolve, reject) => {
            try {
                const store = await IDB._getStore(storeName, 'readonly');
                const request = store.get(containerId);
                request.onsuccess = () => {
                    const data = request.result ? request.result.html : null;
                    resolve(data);
                }
                ;
                request.onerror = (event) => reject(event.target.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    static textareaSave(textAreaElement) {
        if (!textAreaElement) {
            console.error("Textarea with id 'myTextArea' not found.");
            return;
        }
        return {
            currentValue: textAreaElement.value,
            initialContentHTML: textAreaElement.innerHTML,
            initialContentDefault: textAreaElement.defaultValue,
        };
    }

    static textareaLoad(textAreaElement, value) {
        if (!textAreaElement) {
            console.error("Textarea with id 'myTextArea' not found.");
            return;
        }
        textAreaElement.value = value.currentValue;
        textAreaElement.innerHTML = value.initialContentHTML;
        textAreaElement.defaultValue = value.initialContentDefault;
    }

    static onload()
    {
        // --- ここまで AppStateDB クラス定義 ---
        IDB.init();
        async function initializeApp() {
        await IDB.openDB();
        }
        initializeApp().catch(err => logMessage(`Initial App setup failed: ${err}`));
        document.getElementById('nav-save').addEventListener('click', async () => {
        IDB.savedDom.forEach(async (appContainer) => {
        const currentInnerHTML = appContainer.innerHTML;
        try {
            // 汎用saveStateを使う場合
            const dbKey = appContainer.id;
            const tagName = appContainer.tagName.toLowerCase();
            // 大文字で返されます (例: "DIV")
            let value = "";
            switch (tagName) {
            case 'textarea':
                await IDB.saveState(dbKey, IDB.textareaSave(appContainer));
                break;
            default:
                await IDB.saveState(dbKey, {
                    "innerHTML": appContainer.innerHTML
                });
            }
            if (dbKey in IDB.savedthen) {
                IDB.savedthen[dbKey]();
            }
            logMessage(`Container state saved with key: ${dbKey} (innerHTML snapshot).`);
        } catch (error) {
            logMessage(`Error saving container state: ${error}`);
        }
        });
        });
        
        document.getElementById('nav-load').addEventListener('click', async () => {
        IDB.savedDom.forEach(async (appContainer) => {
        const dbKey = appContainer.id;
        if (!dbKey) {
            logMessage('Error: DB Key for container is required to load.');
            return;
        }
        try {
            // 汎用loadStateを使う場合
            let loadedHTML = await IDB.loadState(dbKey);
            // innerHTML専用メソッドを使う場合
            // const loadedHTML = await dbInstance.loadInnerHTMLState('appContainer');
        
            if (loadedHTML !== null) {
                const tagName = appContainer.tagName.toLowerCase();
                switch (tagName) {
                case 'textarea':
                    IDB.textareaLoad(appContainer, loadedHTML);
                    break;
                default:
                    appContainer.innerHTML = loadedHTML.innerHTML;
                }
        
            } else {
                logMessage(`No container state found for key "${dbKey}".`);
            }
        
            if (dbKey in IDB.loadedthen) {
                IDB.loadedthen[dbKey]();
            }
        } catch (error) {
            logMessage(`Error loading container state: ${error}`);
        }
        });
        });
    }
}

export default IDB;

