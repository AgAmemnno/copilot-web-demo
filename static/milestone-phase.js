import {GoogleGenAI, HarmCategory, HarmBlockThreshold} from 'https://esm.sh/@google/genai';
import  {logMessage,setButtonsDisabled,showPhase} from './log.js';
import './github.js';
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
            <div id="milestone-phase">
                <h2>1. マイルストーン定義 (GitHub標準Milestone)</h2>
                <h3>JSONから一括作成:</h3>
                <div class="flex-row-small-gap">
                    <div class="input-group">
                        <label for="milestonePrefixJson">Prefix:</label>
                        <input type="text" id="milestonePrefixJson" placeholder="例: ProjectX-">
                    </div>
                    <div class="input-group">
                        <label for="milestoneSuffixJson">Suffix:</label>
                        <input type="text" id="milestoneSuffixJson" placeholder="例: -v1">
                    </div>
                </div>
                <div class="input-group">
                    <label for="milestonesJsonInput">マイルストーン定義JSON配列:</label>
                    <textarea id="milestonesJsonInput" placeholder='[{"name": "MS名1", "description": "詳細1", "estimated_duration": "2週間", "key_deliverables": ["成果物A"], "dependencies": ["先行MSのテキスト記述"]}, ...]'></textarea>
                </div>
                <div class="button-group">
                    <button id="createMilestonesFromJsonBtn">JSONからMilestone群を作成 (REST)</button>
                </div>
                <hr class="section-divider">
                <h3>個別作成:</h3>
                <div class="flex-row-small-gap">
                    <div class="input-group">
                        <label for="milestonePrefixSingle">Prefix:</label>
                        <input type="text" id="milestonePrefixSingle" placeholder="例: ProjectX-">
                    </div>
                    <div class="input-group">
                        <label for="milestoneSuffixSingle">Suffix:</label>
                        <input type="text" id="milestoneSuffixSingle" placeholder="例: -v1">
                    </div>
                </div>
                <div class="input-group">
                    <label for="milestoneTitle">Milestoneタイトル (Prefix/Suffix除く):</label>
                    <input type="text" id="milestoneTitle" placeholder="例: Sprint 1 目標達成">
                </div>
                <div class="input-group">
                    <label for="milestoneDescription">Milestone説明 (成果物、依存関係など):</label>
                    <textarea id="milestoneDescription" placeholder="AI生成または手入力された詳細..."></textarea>
                </div>
                <div class="input-group">
                    <label for="milestoneDueDate">Milestone期日:</label>
                    <input type="date" id="milestoneDueDate">
                </div>
                <div class="button-group">
                    <button id="createGhMilestoneBtn">単一GitHub Milestone作成 (REST)</button>
                </div>
                <hr class="section-divider">
                <h3>既存GitHub Milestones (REST):</h3>
                <div class="input-group">
                    <label for="deleteMilestonePrefixInput">削除対象Prefix:</label>
                    <input type="text" id="deleteMilestonePrefixInput" placeholder="削除したいMilestoneのPrefixを入力">
                </div>
                <div class="button-group">
                    <button id="deleteMilestonesByPrefixBtn" class="danger-button">指定PrefixのMilestoneを削除</button>
                </div>
                <div id="existingMilestonesArea" class="output-area"></div>
            </div>`;

export default class MileStonePhase extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({mode: 'open'});
        shadow.appendChild(template.content.cloneNode(true));
    }
    connectedCallback() {};
    load(){
            const github  = document.querySelector('config-phase').github();
            const self  = this.shadowRoot;
            const milestonePrefixJsonInput = self.getElementById('milestonePrefixJson');
            const milestoneSuffixJsonInput = self.getElementById('milestoneSuffixJson');
            const milestonesJsonInput = self.getElementById('milestonesJsonInput');
            const createMilestonesFromJsonBtn = self.getElementById('createMilestonesFromJsonBtn');
            
            const milestonePrefixSingleInput = self.getElementById('milestonePrefixSingle');
            const milestoneSuffixSingleInput = self.getElementById('milestoneSuffixSingle');
            const milestoneTitleInput = self.getElementById('milestoneTitle');
            const milestoneDescriptionInput = self.getElementById('milestoneDescription');
            const milestoneDueDateInput = self.getElementById('milestoneDueDate');
            const createGhMilestoneBtn = self.getElementById('createGhMilestoneBtn');
            
            const deleteMilestonePrefixInput = self.getElementById('deleteMilestonePrefixInput');
            const deleteMilestonesByPrefixBtn = self.getElementById('deleteMilestonesByPrefixBtn');
            const existingMilestonesArea = self.getElementById('existingMilestonesArea');
            function renderExistingMilestones() {
                existingMilestonesArea.innerHTML = '';
                if (github.existingRepoMilestones.length === 0) {
                    existingMilestonesArea.textContent = "オープンなMilestoneはありません。";
                    return;
                }
                const ul = document.createElement('ul');
                github.existingRepoMilestones.forEach(ms => {
                    const li = document.createElement('li');
                    li.innerHTML = `<strong>${ms.title} (#${ms.number})</strong> - 期日: ${ms.dueOn ? new Date(ms.dueOn).toLocaleDateString() : '未設定'} <a href="${ms.url}" target="_blank">表示</a><br><small>${ms.description ? ms.description.substring(0, 100) + '...' : '(説明なし)'}</small>`;
                    ul.appendChild(li);
                }
                );
                existingMilestonesArea.appendChild(ul);
            }

            const milestonesForScenarioInputDisplay = self.getElementById('milestonesForScenarioInputDisplay');

            createGhMilestoneBtn.addEventListener('click', async () => {
                // (変更なし)
                const prefix = milestonePrefixSingleInput.value.trim();
                const suffix = milestoneSuffixSingleInput.value.trim();
                const createdMilestone = await github.createSingleGithubMilestone(milestoneTitleInput.value.trim(), milestoneDescriptionInput.value.trim(), milestoneDueDateInput.value, prefix, suffix);

                if (createdMilestone) {
                    logMessage(`Milestone「${createdMilestone.title}」(#${createdMilestone.number}) を作成しました。`, "success");
                    milestoneTitleInput.value = '';
                    milestoneDescriptionInput.value = '';
                    milestoneDueDateInput.value = '';
                    milestonePrefixSingleInput.value = '';
                    milestoneSuffixSingleInput.value = '';
                    await github.loadAndRenderRepoMilestonesREST();
                }
            }
            );

            createMilestonesFromJsonBtn.addEventListener('click', async () => {
                // (変更なし)
                const jsonString = milestonesJsonInput.value.trim();
                const prefix = milestonePrefixJsonInput.value.trim();
                const suffix = milestoneSuffixJsonInput.value.trim();

                if (!jsonString) {
                    logMessage("エラー: JSON入力が空です。", "error");
                    return;
                }

                let milestonesToCreate;
                try {
                    milestonesToCreate = JSON.parse(jsonString);
                    if (!Array.isArray(milestonesToCreate)) {
                        throw new Error("入力はJSON配列である必要があります。");
                    }
                } catch (e) {
                    logMessage(`JSONパースエラー: ${e.message}`, "error");
                    return;
                }

                if (milestonesToCreate.length === 0) {
                    logMessage("作成するマイルストーンがありません。", "info");
                    return;
                }

                logMessage(`${milestonesToCreate.length}件のマイルストーンを一括作成します...`, "info");
                let successCount = 0;
                let errorCount = 0;

                for (const msData of milestonesToCreate) {
                    const baseTitle = msData.name;
                    let description = msData.description || "";

                    if (msData.key_deliverables && Array.isArray(msData.key_deliverables)) {
                        description += "\n\n**主要成果物:**\n" + msData.key_deliverables.map(d => `- ${d}`).join("\n");
                    }
                    if (msData.dependencies && Array.isArray(msData.dependencies)) {
                        description += "\n\n**依存関係（テキスト）:**\n" + msData.dependencies.map(d => `- ${d}`).join("\n");
                    }

                    let dueDate = null;
                    if (msData.estimated_duration) {
                        const durationStr = msData.estimated_duration;
                        const today = new Date();
                        const durationMatch = durationStr.match(/(\d+)\s*(時間|日間|週間|ヶ月)/);
                        if (durationMatch) {
                            const num = parseInt(durationMatch[1]);
                            const unit = durationMatch[2];
                            let targetDate = new Date(today);
                            if (unit === "日間")
                                targetDate.setDate(today.getDate() + num);
                            else if (unit === "週間")
                                targetDate.setDate(today.getDate() + num * 7);
                            else if (unit === "ヶ月")
                                targetDate.setMonth(today.getMonth() + num);
                            if (unit !== "時間") {
                                dueDate = targetDate.toISOString().split('T')[0];
                            }
                        }
                    }

                    const created = await github.createSingleGithubMilestone(baseTitle, description.trim(), dueDate, prefix, suffix);
                    if (created) {
                        successCount++;
                    } else {
                        errorCount++;
                        logMessage(`Milestone「${prefix}${baseTitle}${suffix}」の作成に失敗しました。`, "error");
                    }
                }

                logMessage(`マイルストーン一括作成完了。成功: ${successCount}件, 失敗: ${errorCount}件`, errorCount > 0 ? "warning" : "success");
                if (successCount > 0) {
                    milestonesJsonInput.value = '';
                    milestonePrefixJsonInput.value = '';
                    milestoneSuffixJsonInput.value = '';
                    await github.loadAndRenderRepoMilestonesREST();
                }
            }
            );

            deleteMilestonesByPrefixBtn.addEventListener('click', async () => {
                // (変更なし)
                const prefixToDelete = deleteMilestonePrefixInput.value.trim();
                if (!prefixToDelete) {
                    logMessage("エラー: 削除対象のPrefixを入力してください。", "error");
                    return;
                }
                await github.loadAndRenderRepoMilestonesREST();
                await github.deleteMilestonePrefix(prefixToDelete);
                await github.loadAndRenderRepoMilestonesREST();
            }
            );

            const navMilestoneBtn = document.getElementById('nav-milestone-phase');
            navMilestoneBtn.addEventListener('click', () => {
                /*
                if (!currentOwner || !currentRepo) {
                    alert("先に「0. 基本設定」でリポジトリ情報を読み込んでください。");
                    showPhase('config-phase');
                    return;
                }
                */
                showPhase('milestone-phase');
                github.loadAndRenderRepoMilestonesREST();
            });
            
    }
    renderExistingMilestones(github) {
            
                const self  = this.shadowRoot;
                const existingMilestonesArea = self.getElementById('existingMilestonesArea');
                existingMilestonesArea.innerHTML = '';
                if (github.existingRepoMilestones.length === 0) {
                    existingMilestonesArea.textContent = "オープンなMilestoneはありません。";
                    return;
                }
                const ul = document.createElement('ul');
                github.existingRepoMilestones.forEach(ms => {
                    const li = document.createElement('li');
                    li.innerHTML = `<strong>${ms.title} (#${ms.number})</strong> - 期日: ${ms.dueOn ? new Date(ms.dueOn).toLocaleDateString() : '未設定'} <a href="${ms.url}" target="_blank">表示</a><br><small>${ms.description ? ms.description.substring(0, 100) + '...' : '(説明なし)'}</small>`;
                    ul.appendChild(li);
                }
                );
                existingMilestonesArea.appendChild(ul);
            }
    
}

customElements.define('milestone-phase', MileStonePhase);