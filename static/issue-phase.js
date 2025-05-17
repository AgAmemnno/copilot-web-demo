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
            <div id="issue-phase" >
                <h2>3. Issue発行</h2>
                <h3>現在のコンテキスト:</h3>
                <div id="issuePhaseContextDisplay" class="info-display-area">選択されたシナリオとターゲットマイルストーン情報が表示されます...
            </div>
                <hr class="section-divider">
                <div class="input-group">
                    <label for="targetMilestoneForCpSelect">ターゲットマイルストーン (クリティカルパス生成用):</label>
                    <select id="targetMilestoneForCpSelect"></select>
                </div>
                <div class="button-group">
                    <button id="generateCriticalPathBtn">AIによるクリティカルパス生成 (Issue骨子)</button>
                </div>
                <h3>AIによるクリティカルパス提案 (Issue骨子):</h3>
                <div id="criticalPathOutput" class="ai-output-area">ここにAIが生成したIssue骨子が表示されます...</div>
                <hr class="section-divider">
                <h3>Issue詳細入力と発行:</h3>
                <p>（上記のクリティカルパスからIssueを選択し、詳細を記述して発行します）</p>
                <div class="input-group">
                    <label for="issueTitleToCreate">Issueタイトル:</label>
                    <input type="text" id="issueTitleToCreate" placeholder="ユーザーが持ち込んだIssueタイトル">
                </div>
                <div class="input-group">
                    <label for="issueBodyToCreate">Issue本文 (Markdown):</label>
                    <textarea id="issueBodyToCreate" placeholder="ユーザーが持ち込んだIssue本文..."></textarea>
                </div>
                <div class="input-group">
                    <label for="linkToMilestoneSelect">紐付けるMilestone:</label>
                    <select id="linkToMilestoneSelect">
                        <option value="">-- Milestoneなし --</option>
                    </select>
                </div>
                <div class="button-group">
                    <button id="publishGithubIssueBtn">GitHub Issue発行</button>
                </div>
            </div>`;

export default class IssuePhase extends HTMLElement {
    #selectedScenario;
    #conceptualDocument;
    #generationConfig;
    #projectSelect;
    constructor() {
        super();
        const shadow = this.attachShadow({mode: 'open'});
        shadow.appendChild(template.content.cloneNode(true));
    }
    connectedCallback() {
        const safetySettings = [{
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
            temperature: 1.0,
            topP: 0.8,
            responseMimeType: 'application/json',
            safetySettings: safetySettings,
            systemInstruction: [
                        {
                          text: "あなたはプロジェクト計画の専門家として、JSON形式でクリティカルパス（タスクリストとAI Studio利用のヒントを含む）を提案します。",
                        }
                    ],
        };
    };
    
    set selectedScenario(val){
        this.#selectedScenario = val;
    }
    get selectedScenario(){
        return this.#selectedScenario;
    }

    set conceptualDocument(val){
        this.#conceptualDocument = val;
    }
    get conceptualDocument(){
        return this.#conceptualDocument;
    }
    
    set projectSelect(val){
        this.#projectSelect = val;
    }
    get projectSelect(){
        return this.#projectSelect;
    }
    
    load(){
        let generatedCriticalPath = [];
        const github  = document.querySelector('config-phase').github();
        const genAI  = document.querySelector('config-phase').genAI();
        const self = this.shadowRoot;
        const host = this;

        const generateCriticalPathBtn = self.getElementById('generateCriticalPathBtn');
        const criticalPathOutput = self.getElementById('criticalPathOutput');
        const issueTitleToCreateInput = self.getElementById('issueTitleToCreate');
        const issueBodyToCreateInput = self.getElementById('issueBodyToCreate');
        
        const publishGithubIssueBtn = self.getElementById('publishGithubIssueBtn');

        generateCriticalPathBtn.addEventListener('click', async () => {

            const conceptualDocument    = host.conceptualDocument.trim();
            const targetMilestoneNumber = targetMilestoneForCpSelect.value;

            if (!conceptualDocument) {
                logMessage("エラー: 概念文書が必要です。", "error");
                return;
            }
            if (!this.selectedScenario) {
                logMessage("エラー: 先にシナリオを選択してください。", "error");
                return;
            }
            if (!targetMilestoneNumber) {
                logMessage("エラー: ターゲットマイルストーンを選択してください。", "error");
                return;
            }
            if (!selectedGeminiModel) {
                logMessage("エラー: 使用するGeminiモデルを選択してください。", "error");
                return;
            }

            const selectedOption = targetMilestoneForCpSelect.options[targetMilestoneForCpSelect.selectedIndex];
            const targetMilestoneJson = selectedOption.dataset.milestoneJson;
            if (!targetMilestoneJson) {
                logMessage("エラー: 選択されたターゲットマイルストーン情報(JSON)が見つかりません。", "error");
                return;
            }
            const targetMilestone = JSON.parse(targetMilestoneJson);

            logMessage("AIによるクリティカルパス生成を開始します...", "info");
            criticalPathOutput.textContent = "クリティカルパス生成中...";
            //setButtonsDisabled(true, [loadRepoInfoBtn.id, testGeminiApiBtn.id, generateScenariosBtn.id, listGeminiModelsBtn.id]);

            const criticalPathPrompt = `
あなたは熟練のプロジェクトプランナーです。提供された「概念文書」、「選択されたシナリオ」、そして「ターゲットマイルストーン」の情報を分析し、そのターゲットマイルストーンの主要成果物を達成するための、論理的で実行可能なタスク（Issueの骨子）から成るクリティカルパスを提案してください。
各タスクは、ターゲットマイルストーンの成果物を具体的に実現するためのステップであり、厳格な因果律に基づいて順序付けられるべきです。創造的なタスク発見ではなく、与えられた情報から論理的に分解・整理してください。
複数のクリティカルパスが考えられる場合は、最も合理的で効率的と思われるものを一つ提案してください。

## 入力情報:
1.  概念文書:
${conceptualDocument}

2.  選択されたシナリオ (JSON形式):
${JSON.stringify(this.selectedScenario, null, 2)}

3.  ターゲットマイルストーン (JSON形式、特にdescription内のkey_deliverablesに注目):
${JSON.stringify(targetMilestone, null, 2)} 

## 指示:
1.  上記の入力情報を基に、ターゲットマイルストーンの「description」内に記述されている「主要成果物」 (key_deliverables) を達成するための具体的なタスク群を特定し、クリティカルパスとして提案してください。
2.  各タスク（Issueの骨子）には、以下の情報を含めてください。
* \`task_id\`: タスクを一意に識別するID（例: "TASK-${targetMilestone.number}-01"のようにターゲットマイルストーン番号をプレフィックスに含むと良い）。
* \`task_title_suggestion\`: Issueのタイトルとして適切で、タスク内容を簡潔に示す提案。
* \`related_deliverable\`: このタスクが直接的に貢献するターゲットマイルストーンの「key_deliverables」の具体的な項目名。ターゲットマイルストーンのdescription内から抽出してください。
* \`dependencies\`: このタスクを実行する前に完了している必要がある他のタスクの\`task_id\`のリスト。クリティカルパスの最初のタスクは空リスト \`[]\`。
* \`brief_description\`: タスクの目的や主要な作業内容の短い説明（1-2文程度）。
* \`ai_studio_hints\`: このタスクの性質（例：アイデア出し、正確なコード分析、複数案比較、長文解釈など）を考慮し、AI StudioでCopilotへの指示プロンプトを作成する際に推奨されるTemperature(高め/低め/中程度と具体的な範囲例)、TopP(高め/低めと具体的な範囲例)、Output Length(長め/短め/適切に調整)、推奨モデルファミリー(Gemini Flash/Proなど)、その他特記事項（例：「このタスクは自由な発想を重視します。Temperatureを高め(0.8以上推奨)...」）を具体的に記述してください。
3.  タスクは、ターゲットマイルストーンの各主要成果物を網羅するように、適切な粒度で分割してください。
4.  タスクの順序は、論理的な前後関係と依存関係を厳密に考慮し、クリティカルパスとして最も効率的な順序で並べてください。
5.  出力は、必ず以下のJSON形式の配列としてください。

## 出力形式 (JSON):
[
{
"task_id": "string",
"task_title_suggestion": "string",
"related_deliverable": "string",
"dependencies": ["string", ...],
"brief_description": "string",
"ai_studio_hints": "string" 
}
]
`;



            try {
                const modelNameForRequest = selectedGeminiModel.startsWith("models/") ? selectedGeminiModel : `models/${selectedGeminiModel}`;

                const result = await genAI.models.generateContent({
                    model: modelNameForRequest,
                    contents: [{
                        role: "user",
                        parts: [{
                            text: criticalPathPrompt
                        }]
                    }],
                    config: this.#generationConfig
                });

                const cpText = result.candidates[0].content.parts[0].text;

                generatedCriticalPath = JSON.parse(cpText);
                logMessage(`AIが ${generatedCriticalPath.length} 件のIssue骨子（クリティカルパス）を生成しました。`, "success");
                renderGeneratedCriticalPath();

            } catch (error) {
                console.error("クリティカルパス生成AIエラー:", error);
                logMessage(`クリティカルパス生成AIエラー: ${error.message || JSON.stringify(error)}`, "error");
                criticalPathOutput.textContent = `エラー: ${error.message || 'クリティカルパス生成に失敗しました。'}`;
            } finally {
               // setButtonsDisabled(false, [loadRepoInfoBtn.id, testGeminiApiBtn.id, generateScenariosBtn.id, listGeminiModelsBtn.id]);
            }
        }
        );

        function renderGeneratedCriticalPath() {
            // (変更なし)
            criticalPathOutput.innerHTML = '';
            if (!generatedCriticalPath || generatedCriticalPath.length === 0) {
                criticalPathOutput.textContent = "Issue骨子案はありません。";
                return;
            }
            generatedCriticalPath.forEach(task => {
                const card = self.createElement('div');
                card.className = 'task-card';
                card.innerHTML = `
                <h4>${task.task_title_suggestion} (ID: ${task.task_id})</h4>
                <p><strong>関連成果物:</strong> ${task.related_deliverable}</p>
                <p><strong>概要:</strong> ${task.brief_description}</p>
                <p><strong>依存タスクID:</strong> ${Array.isArray(task.dependencies) ? task.dependencies.join(', ') : 'なし'}</p>
                <div class="ai-studio-hints"><strong>AI Studioヒント:</strong> ${task.ai_studio_hints || 'N/A'}</div>
                <button class="select-task-for-issue-btn" data-task-id="${task.task_id}">この内容でIssue作成準備</button>
            `;
                criticalPathOutput.appendChild(card);
            }
            );

            self.querySelectorAll('.select-task-for-issue-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const taskId = event.target.dataset.taskId;
                    const selectedTask = generatedCriticalPath.find(t => t.task_id === taskId);
                    if (selectedTask) {
                        logMessage(`Issue作成準備: 「${selectedTask.task_title_suggestion}」`, "info");
                        issueTitleToCreateInput.value = selectedTask.task_title_suggestion;
                        issueBodyToCreateInput.value = `## 概要\n${selectedTask.brief_description}\n\n## 関連成果物\n${selectedTask.related_deliverable}\n\n## 依存関係\n${Array.isArray(selectedTask.dependencies) ? selectedTask.dependencies.join(', ') : 'なし'}\n\n## AI Studioプロンプトエンジニアリングのヒント\n${selectedTask.ai_studio_hints || '特になし'}\n\n---\n(ここに詳細を記述・ペーストしてください)`;

                        const targetMsNumberForLink = targetMilestoneForCpSelect.value;
                        if (targetMsNumberForLink) {
                            linkToMilestoneSelect.value = targetMsNumberForLink;
                        }
                        alert(`「${selectedTask.task_title_suggestion}」のIssue作成準備ができました。\n詳細を記述し、発行してください。`);
                    }
                }
                );
            }
            );
        }

        publishGithubIssueBtn.addEventListener('click', async () => {
            // (変更なし)
            const title = issueTitleToCreateInput.value.trim();
            const body = issueBodyToCreateInput.value.trim();
            const selectedMilestoneNumberForLink = linkToMilestoneSelect.value;
            const selectedProjectNodeId = host.projectSelect.value;
            let milestoneNodeId = null;
            if (selectedMilestoneNumberForLink) {
                const milestoneToLink = github.existingRepoMilestones.find(ms => ms.number.toString() === selectedMilestoneNumberForLink);
                if (milestoneToLink && milestoneToLink.id) {
                    milestoneNodeId = milestoneToLink.id;
                } else {
                    logMessage(`警告: 選択されたMilestone (#${selectedMilestoneNumberForLink}) のNode IDが見つかりません。MilestoneなしでIssueを作成します。`, "warning");
                }
            }

            github.createIssue(title, body, "" , selectedProjectNodeId, milestoneNodeId);

        });



        const issuePhaseContextDisplay = self.getElementById('issuePhaseContextDisplay');
        const targetMilestoneForCpSelect = self.getElementById('targetMilestoneForCpSelect');
        
        
        function updateIssuePhaseContextDisplay() {
            // (変更なし)
            let html = "";
            if (host.selectedScenario) {
                html += `<p><strong>選択中シナリオ:</strong> ${host.selectedScenario.scenario_name}</p>`;
                const targetMsNumber = targetMilestoneForCpSelect.value;
                if (targetMsNumber) {
                    const targetMs = github.existingRepoMilestones.find(ms => ms.number.toString() === targetMsNumber);
                    if (targetMs) {
                        html += `<p><strong>ターゲットMilestone:</strong> ${targetMs.title} (#${targetMs.number})</p>`;
                    } else {
                        html += `<p><strong>ターゲットMilestone:</strong> (選択されていません)</p>`;
                    }
                } else {
                    html += `<p><strong>ターゲットMilestone:</strong> (選択されていません)</p>`;
                }
            } else {
                html = "<p>シナリオが選択されていません。</p>";
            }
            issuePhaseContextDisplay.innerHTML = html;
        }
        targetMilestoneForCpSelect.addEventListener('change', updateIssuePhaseContextDisplay);

        const linkToMilestoneSelect = self.getElementById('linkToMilestoneSelect');
        function populateTargetMilestoneForCpSelect() {
                targetMilestoneForCpSelect.innerHTML = '<option value="">-- ターゲットMilestone選択 --</option>';
                linkToMilestoneSelect.innerHTML = '<option value="">-- Milestoneなし --</option>';

                if (github.existingRepoMilestones.length === 0) {
                    logMessage("クリティカルパス生成のためのMilestoneがありません。", "warning");
                    return;
                }
                github.existingRepoMilestones.forEach(ms => {
                    const optionCp = document.createElement('option');
                    optionCp.value = ms.number;
                    optionCp.textContent = `${ms.title} (#${ms.number})`;
                    optionCp.dataset.milestoneJson = JSON.stringify(ms);
                    targetMilestoneForCpSelect.appendChild(optionCp);

                    const optionLink = document.createElement('option');
                    optionLink.value = ms.number;
                    optionLink.textContent = `${ms.title} (#${ms.number})`;
                    linkToMilestoneSelect.appendChild(optionLink);
                }
                );
            }


        
        const navIssueBtn = document.getElementById('nav-issue-phase');
        navIssueBtn.addEventListener('click', () => {
            if (!this.selectedScenario) {
                alert("先にシナリオを選択してください。");
                showPhase('scenario-phase');
                return;
            }
            populateTargetMilestoneForCpSelect();
            updateIssuePhaseContextDisplay();
            showPhase('issue-phase');
        }
        );


        const mediator = document.querySelector('.container');
        
        mediator.addEventListener('issue-mediator', (event) => {
            host.selectedScenario = event.detail.selectedScenario;
            host.conceptualDocument = event.detail.conceptualDocument;
            populateTargetMilestoneForCpSelect();
            updateIssuePhaseContextDisplay();
        });

        
        mediator.addEventListener('issue-config-mediator', (event) => {
            host.projectSelect = event.detail.projectSelect;
        });


        
           IDB.savedDom = criticalPathOutput;
           IDB.savedthen[criticalPathOutput.id] =  async () => {
                    try {
                        await IDB.saveState("generatedCriticalPath",generatedCriticalPath);
                    } catch (error) {
                        logMessage(`Error saving container state: ${error}`);
                    }
                    renderGeneratedCriticalPath();
            };
            IDB.loadedthen[criticalPathOutput.id] = async () => {
                    generatedCriticalPath = await IDB.loadState("generatedCriticalPath");
                    renderGeneratedCriticalPath();
            }
    }
    
}

customElements.define('issue-phase', IssuePhase);