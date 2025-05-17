import {GoogleGenAI, HarmCategory, HarmBlockThreshold} from 'https://esm.sh/@google/genai';
import  {logMessage,setButtonsDisabled,showPhase} from './log.js';
import './github.js';
import  IDB from './idb.js';

const template = document.createElement('template');
template.innerHTML = `
    <link rel="stylesheet" href="./static/styles.css">
    <style>
    :host {
        display: var(--name-display, none);
        padding: 15px;
        border: 2px solid var(--element-border-color, darkblue);
        background-color: var(--element-background, lightgray);
        color: var(--element-text-color, black);
        box-sizing: border-box;
    };
    </style>
    <h2>0. 基本設定とAPI接続テスト</h2>
    <div class="columns">
        <div class="column">
                        <div class="input-group">
                            <label for="geminiApiKey">Gemini API Key:</label>
                            <input type="password" id="geminiApiKey" value="AI＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊">
                        </div>
        </div>
    </div>
    <div class="button-group">
        <button id="listGeminiModelsBtn" class="secondary-button">利用可能Geminiモデル取得</button>
        <button id="testGeminiApiBtn" class="test-button">Gemini API接続テスト</button>
    </div>

    <div class="input-group">
        <label for="geminiModelSelect">使用するGeminiモデル:</label>
        <select id="geminiModelSelect"></select>
    </div>
    <div class="input-group">
        <label>Gemini APIテスト結果:</label>
        <div id="geminiTestOutput" class="test-output-area">ここにGemini APIのテスト結果が表示されます...</div>
    </div>
    <github-api></github-api>
`;

export default class ConfigPhase extends HTMLElement {
    #genAI;
    constructor() {
        super();
        const shadow = this.attachShadow({mode: 'open'});
        shadow.appendChild(template.content.cloneNode(true));
        this.#genAI = null;
    }
    connectedCallback() {}
    load(){
        
        const self  = this.shadowRoot;
        self.querySelector('github-api').load();
        this.attrs  = {
            geminiApiKeyInput : self.getElementById('geminiApiKey'),
            listGeminiModelsBtn : self.getElementById('listGeminiModelsBtn'),
            testGeminiApiBtn : self.getElementById('testGeminiApiBtn'),
            geminiModelSelect : self.getElementById('geminiModelSelect'),
            geminiTestOutput : self.getElementById('geminiTestOutput')
        }
        
        IDB.savedDom = this.attrs.geminiModelSelect;
        IDB.loadedthen[this.attrs.geminiModelSelect.id] = () => { 
            window.selectedGeminiModel = this.attrs.geminiModelSelect.value = "models/gemini-2.5-pro-preview-05-06";
        }
        
        this.attrs.listGeminiModelsBtn.addEventListener('click', async () => {
            if (!await this.initializeGenAI())
                return;

            logMessage("利用可能なGeminiモデルを取得中...", "info");
            //setButtonsDisabled(true, [this.attrs.loadRepoInfoBtn.id, this.attrs.testGeminiApiBtn.id]);
            try {
                // モデルリスト取得方法を修正
                const modelsResult = await this.genAI().models.list();
                let availableGeminiModels = [];
                this.attrs.geminiModelSelect.innerHTML = '<option value="">-- モデルを選択 --</option>';
                let count = 0;

                let modelsArray = [];
                // SDKの `list()` メソッドは通常、非同期イテラブルまたはモデルの配列を直接返す
                // ユーザー提供のログでは `pageInternal` に配列があったが、より一般的な処理を試みる
                if (modelsResult && typeof modelsResult[Symbol.asyncIterator] === 'function') {
                    for await(const m of modelsResult) {
                        modelsArray.push(m);
                    }
                } else if (modelsResult && Array.isArray(modelsResult.pageInternal)) {
                    // ユーザーログの形式
                    modelsArray = modelsResult.pageInternal;
                } else if (Array.isArray(modelsResult)) {
                    // SDKが直接配列を返す場合
                    modelsArray = modelsResult;
                } else {
                    logMessage("モデルリストの取得形式が予期したものではありません。", "warning");
                }

                for (const m of modelsArray) {
                    // フィルタリング条件を削除し、nameとdisplayNameを持つものをリストアップ
                    if (m && m.name && m.displayName) {
                        availableGeminiModels.push({
                            name: m.name,
                            displayName: m.displayName
                        });
                        const option = document.createElement('option');
                        option.value = m.name;
                        option.textContent = `${m.displayName} (${m.name})`;
                        this.attrs.geminiModelSelect.appendChild(option);
                        count++;
                    }
                }
                logMessage(`${count} 件の利用可能なGeminiモデルを取得しました。`, "success");
                if (availableGeminiModels.length > 0) {
                    const defaultModelName = "models/gemini-1.5-flash-latest";
                    const foundDefault = availableGeminiModels.find(m => m.name === defaultModelName);
                    if (foundDefault) {
                        this.attrs.geminiModelSelect.value = foundDefault.name;
                    } else if (this.attrs.geminiModelSelect.options.length > 1) {
                        this.attrs.geminiModelSelect.selectedIndex = 1;
                    }
                    window.selectedGeminiModel = this.attrs.geminiModelSelect.value;
                    if (selectedGeminiModel) {
                        logMessage(`デフォルトモデルとして「${window.selectedGeminiModel}」を選択しました。`, "info");
                    } else {
                        logMessage("適切なデフォルトモデルが見つかりませんでした。手動で選択してください。", "warning");
                    }
                } else {
                    logMessage("利用可能なモデルが見つかりませんでした。", "warning");
                }
            } catch (error) {
                console.error("Geminiモデルリスト取得エラー:", error);
                logMessage(`Geminiモデルリスト取得エラー: ${error.message || JSON.stringify(error)}`, "error");
            } finally {
                //setButtonsDisabled(false, [this.attrs.loadRepoInfoBtn.id, this.attrs.testGeminiApiBtn.id]);
            }
        });

        this.attrs.geminiModelSelect.addEventListener('change', (event) => {
            window.selectedGeminiModel = event.target.value;
            logMessage(`Geminiモデルを「${window.selectedGeminiModel}」に変更しました。`, "info");
        });
        this.attrs.testGeminiApiBtn.addEventListener('click', async () => {
            if (!await this.initializeGenAI())
                return;
            
            if (!window.selectedGeminiModel) {
                logMessage("エラー: 使用するGeminiモデルを選択してください。「利用可能Geminiモデル取得」を実行してください。", "error");
                this.attrs.geminiTestOutput.textContent = "エラー: 使用するGeminiモデルが選択されていません。";
                this.attrs.geminiTestOutput.style.color = "red";
                return;
            }

            logMessage(`Gemini API (${window.selectedGeminiModel}) にテストリクエスト送信中...`, "info");
            this.attrs.geminiTestOutput.textContent = "テスト実行中...";
            this.attrs.geminiTestOutput.style.color = "blue";
            //setButtonsDisabled(true, [this.attrs.loadRepoInfoBtn.id, this.attrs.listGeminiModelsBtn.id]);
            const geminiTestOutput  = this.attrs.geminiTestOutput ;
            try {
                // getGenerativeModelではなく、genAI.models.generateContentを使用
                const modelNameForRequest = window.selectedGeminiModel.startsWith("models/") ? selectedGeminiModel : `models/${selectedGeminiModel}`;

                const result = await this.#genAI.models.generateContent({
                    model: modelNameForRequest,
                    // モデル名を直接指定
                    contents: [{
                        role: "user",
                        parts: [{
                            text: "Hello Gemini, this is a test. Respond with 'Test OK' if you are working."
                        }]
                    }]
                });

                const text = result.candidates[0].content.parts[0].text;

                logMessage(`Gemini APIテスト応答: ${text}`, "success");
                geminiTestOutput.textContent = `成功: ${text}`;
                geminiTestOutput.style.color = "green";

            } catch (error) {
                console.error("Gemini APIテストエラー詳細:", error);
                logMessage(`Gemini APIテストエラー: ${error.message || JSON.stringify(error)}`, "error");
                geminiTestOutput.textContent = `エラー: ${error.message || '不明なエラー'}`;
                geminiTestOutput.style.color = "red";
            } finally {
                //setButtonsDisabled(false, [this.attrs.loadRepoInfoBtn.id, this.attrs.listGeminiModelsBtn.id]);
            }
        });
        const navConfigBtn = document.getElementById('nav-config-phase');
        navConfigBtn.addEventListener('click', () => showPhase('config-phase'));
        this.attrs.listGeminiModelsBtn.click();
    }
    tweak(){
        this.shadowRoot.querySelector("github-api").tweak();
    }
    genAI(){
        return this.#genAI;
    }
    github(){
        return this.shadowRoot.querySelector('github-api');
    }
    async initializeGenAI() {
        if (this.#genAI)
            return true;
        const apiKey = this.attrs.geminiApiKeyInput.value.trim();
        if (!apiKey) {
            logMessage("エラー: Gemini APIキーが入力されていません。", "error");
            return false;
        }
        try {
            // GoogleGenAIのインスタンス化を修正
            this.#genAI = new GoogleGenAI({
                apiKey: apiKey
            });
            logMessage("Gemini SDK初期化完了。", "info");
            return true;
        } catch (e) {
            logMessage(`Gemini SDKの初期化エラー: ${e.message}`, "error");
            return false;
        }
    }
}

customElements.define('config-phase', ConfigPhase);
