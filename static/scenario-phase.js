import {GoogleGenAI, HarmCategory, HarmBlockThreshold} from 'https://esm.sh/@google/genai';
import  {logMessage,setButtonsDisabled,showPhase} from './log.js';
import './github.js';
import  { conceptualDocument ,getScenarioGenerationPrompt} from './concept.js';
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
             <div id="scenario-phase">
                <h2>2. シナリオ生成と比較</h2>
                <h3>入力として使用される定義済みマイルストーン:</h3>
                <div id="milestonesForScenarioInputDisplay" class="info-display-area">ここに現在定義されているマイルストーンが表示されます...</div>
                <hr class="section-divider">
                <div class="input-group">
                    <label for="conceptualDocumentInputScenario">概念文書 (シナリオ生成用):</label>
                    <textarea id="conceptualDocumentInputScenario" placeholder="プロジェクトの背景、目的、主要機能などを記述..."></textarea>
                </div>
                <div class="button-group">
                    <button id="generateScenariosBtn">AIによるシナリオ案生成</button>
                </div>
                <h3>AIによるシナリオ提案:</h3>
                <div id="scenarioProposalsOutput" class="ai-output-area">ここにAIが生成したシナリオ案が表示されます...</div>
            </div>`;

export default class ScenarioPhase extends HTMLElement {
    #safetySettings;
    #generationConfig;
    #systemInstructionForScenario;
    constructor() {
        super();
        const shadow = this.attachShadow({mode: 'open'});
        shadow.appendChild(template.content.cloneNode(true));
        this.#safetySettings = [{
                    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold: HarmBlockThreshold.BLOCK_NONE
                }, {
                    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE
                }, {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_NONE
                }, {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.BLOCK_NONE
                }, ];
        this.#generationConfig = {
                    // temperature: 1.0, 
                    // topP: 0.8,
                    responseMimeType: 'application/json',
                    //safetySettings:safetySettings
                };
        this.#systemInstructionForScenario = {
                    parts: [{
                        text: "あなたはプロジェクト戦略の専門家として、JSON形式でシナリオ提案を出力します。"
                    }]
                };
    }
    connectedCallback() {};
    load(){
        let generatedScenarios = [];
        let selectedScenario = null;
        const github  = document.querySelector('config-phase').github();
        const genAI  = document.querySelector('config-phase').genAI();
        const self = this.shadowRoot;
        const generateScenariosBtn = self.getElementById('generateScenariosBtn');
        const scenarioProposalsOutput = self.getElementById('scenarioProposalsOutput');
        const conceptualDocumentInputScenario = self.getElementById('conceptualDocumentInputScenario');
        conceptualDocumentInputScenario.value = conceptualDocument;
            
        function renderGeneratedScenarios() {
       
                scenarioProposalsOutput.innerHTML = '';
                if (!generatedScenarios || generatedScenarios.length === 0) {
                    scenarioProposalsOutput.textContent = "シナリオ案はありません。";
                    return;
                }
                generatedScenarios.forEach(sc => {
                    const card = document.createElement('div');
                    card.className = 'scenario-card';
                    card.innerHTML = `
                    <h4>${sc.scenario_name} (ID: ${sc.scenario_id})</h4>
                    <p><strong>説明:</strong> ${sc.scenario_description}</p>
                    <p><strong>アプローチ要約:</strong> ${sc.approach_summary}</p>
                    <p><strong>注力マイルストーン (Number):</strong> ${Array.isArray(sc.focus_milestones) ? sc.focus_milestones.join(', ') : 'N/A'}</p>
                    <p><strong>考慮事項:</strong> ${sc.considerations}</p>
                    <button class="select-scenario-btn" data-scenario-id="${sc.scenario_id}">このシナリオを選択</button>
                `;
                    scenarioProposalsOutput.appendChild(card);
                }
                );
                function handleSelectScenario(event) {
                    const scenarioId = event.target.dataset.scenarioId;
                    selectedScenario = generatedScenarios.find(s => s.scenario_id === scenarioId);
                    if (selectedScenario) {
                        logMessage(`シナリオ「${selectedScenario.scenario_name}」が選択されました。`, "success");
                        alert(`シナリオ「${selectedScenario.scenario_name}」を選択しました。\n次はIssue発行フェーズでターゲットマイルストーンを選択し、クリティカルパスを生成します。`);
        
                        this.dispatchEvent( new CustomEvent('issue-mediator', {
                          bubbles: true,    
                          composed: true,  
                          detail: {
                                  selectedScenario: selectedScenario,
                                  conceptualDocument: conceptualDocumentInputScenario.value
                                }
                        }) );
                        showPhase('issue-phase');
                    }
                }
                self.querySelectorAll('.select-scenario-btn').forEach(button => {
                        if (typeof button.onclick === 'function') {
                            console.warn('legacyButton に onclick ハンドラは設定されていません。');
                        }
                        button.onclick = handleSelectScenario;
                });

               IDB.savedDom = scenarioProposalsOutput;
               IDB.loadedthen[scenarioProposalsOutput.id] =  async () => {
                        self.querySelectorAll('.select-scenario-btn').forEach(button => {
                            if (typeof button.onclick === 'function') {
                                console.warn('legacyButton に onclick ハンドラは設定されていません。');
                            }
                            button.onclick = handleSelectScenario;
                        });
                        generatedScenarios = await IDB.loadState("generatedScenarios");
               }
               IDB.savedthen[scenarioProposalsOutput.id] =  async () => {
                    try {
                        await IDB.saveState("generatedScenarios", generatedScenarios);
                    } catch (error) {
                        logMessage(`Error saving container state: ${error}`);
                    }
               }
            }       
        generateScenariosBtn.addEventListener('click', async () => {

                const conceptualDocument = conceptualDocumentInputScenario.value.trim();

                if (!conceptualDocument) {
                    logMessage("エラー: シナリオ生成には概念文書の入力が必要です。", "error");
                    return;
                }
                if (github.existingRepoMilestones.length === 0) {
                    logMessage("エラー: シナリオ生成には少なくとも1つの既存マイルストーンが必要です。", "error");
                    return;
                }
                if (!selectedGeminiModel) {
                    logMessage("エラー: 使用するGeminiモデルを選択してください。", "error");
                    return;
                }

                logMessage("AIによるシナリオ生成を開始します...", "info");
                scenarioProposalsOutput.textContent = "シナリオ生成中...";
                //setButtonsDisabled(true, [loadRepoInfoBtn.id, testGeminiApiBtn.id, listGeminiModelsBtn.id]);

                const milestonesForPrompt = github.existingRepoMilestones.map(ms => ({
                    id: ms.number,
                    title: ms.title,
                    description: ms.description,
                    dueOn: ms.dueOn
                }));

                const scenarioGenerationPrompt =  getScenarioGenerationPrompt(conceptualDocument,milestonesForPrompt);

                try {

                    const result = await genAI.models.generateContent({
                        model:  selectedGeminiModel,
                        contents: [{
                            role: "user",
                            parts: [{
                                text: scenarioGenerationPrompt
                            }]
                        }],
                        config: this.#generationConfig
                    });

                    const scenariosText = result.candidates[0].content.parts[0].text;

                    generatedScenarios = JSON.parse(scenariosText);

                    logMessage(`AIが ${generatedScenarios.length} 件のシナリオを生成しました。`, "success");
                    renderGeneratedScenarios();

                } catch (error) {
                    console.error("シナリオ生成AIエラー:", error);
                    logMessage(`シナリオ生成AIエラー: ${error.message || JSON.stringify(error)}`, "error");
                    scenarioProposalsOutput.textContent = `エラー: ${error.message || 'シナリオ生成に失敗しました。ログを確認してください。'}`;
                } finally {
                    //setButtonsDisabled(false, [loadRepoInfoBtn.id, testGeminiApiBtn.id, listGeminiModelsBtn.id]);
                }
            });
        
        function renderMilestonesForScenarioInput() {
                // (変更なし)
                const displayArea = self.getElementById('milestonesForScenarioInputDisplay');
                displayArea.innerHTML = '';
                if (github.existingRepoMilestones.length === 0) {
                    displayArea.textContent = "現在定義されているオープンなMilestoneはありません。シナリオ生成にはMilestoneが必要です。";
                    return;
                }
                const ul = document.createElement('ul');
                ul.style.paddingLeft = "20px";
                github.existingRepoMilestones.forEach(ms => {
                    const li = document.createElement('li');
                    li.textContent = `${ms.title} (#${ms.number})${ms.dueOn ? ' - 期日: ' + new Date(ms.dueOn).toLocaleDateString() : ''}`;
                    ul.appendChild(li);
                });
                displayArea.appendChild(ul);
        }
        
        const navScenarioBtn = document.getElementById('nav-scenario-phase');
        

        navScenarioBtn.addEventListener('click', () => {
            if (github.existingRepoMilestones.length === 0) {
                alert("先にMilestoneを定義・作成してください。");
                showPhase('milestone-phase');
                return;
            }
            renderMilestonesForScenarioInput();
            showPhase('scenario-phase');
        });
        
        IDB.savedDom = conceptualDocumentInputScenario;


    };
}

customElements.define('scenario-phase', ScenarioPhase);