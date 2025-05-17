import {Octokit} from "https://esm.sh/octokit";
import  {logMessage,setButtonsDisabled} from './log.js';

    
const template = document.createElement('template');
template.innerHTML = `
        <div class="column">
            <div class="input-group">
                <label for="githubPat">GitHub PAT:</label>
                <input type="password" id="githubPat" value="gh＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊＊">
            </div>
        </div>
        <div class="column">
            <div class="input-group">
                <label for="owner">リポジトリ所有者 (Owner):</label>
                <input type="text" id="owner" value="AgAmemnno">
            </div>
            <div class="input-group">
                <label for="repo">リポジトリ名 (Repo):</label>
                <input type="text" id="repo" value="copilot-web-demo">
            </div>
        </div>
    </div>
    <div class="button-group">
        <button id="loadRepoInfoBtn" class="secondary-button">リポジトリ情報読み込み</button>
    </div>
    <h3>読み込み結果 / テスト結果:</h3>
    <div class="input-group">
        <label for="projectSelect">対象プロジェクト (Project V2):</label>
        <select id="projectSelect"></select>
    </div>
    <div class="input-group">
        <label>選択中プロジェクトNode ID:</label>
        <input type="text" id="selectedProjectNodeIdDisplay" readonly>
    </div>`;


                          

function extractKeyDeliverables(descriptionText) {
    // (変更なし)
    if (!descriptionText)
        return [];
    const deliverablesMatch = descriptionText.match(/\*\*主要成果物:\*\*\n((?:- .+\n?)+)/i);
    if (deliverablesMatch && deliverablesMatch[1]) {
        return deliverablesMatch[1].split('\n').map(line => line.replace(/^- /, '').trim()).filter(line => line);
    }
    return [];
}
class GithubApi extends HTMLElement {
    
    #repositoryNodeId;
    #owner = null;
    #repo  = null;
    #projectsV2Info = [];
    #existingRepoMilestones = [];
    get (){
        return this;
    }
    constructor() {
        super();
        this.attachShadow({mode: 'open'}).appendChild(template.content.cloneNode(true));
    }

    set repositoryNodeId(val){
        this.#repositoryNodeId= val;
    }
    get repositoryNodeId(){
        return this.#repositoryNodeId;
    }
    
    set owner(val){
        this.#owner = val;
    }
    get owner(){
        return this.#owner;
    }
    
    set repo(val){
        this.#repo = val;
    }
    get repo(){
        return this.#repo;
    }
    connectedCallback() {}
    load(){
        const self = this.shadowRoot;

        self.getElementById('loadRepoInfoBtn').addEventListener('click', async () => {
                this.repoInfo();
            });
       
        self.getElementById('owner').addEventListener('input', function(event) {
            self.owner = event.target.value;
        });
        self.getElementById('repo').addEventListener('input', function(event) {
            self.repo = event.target.value;
        });
        this.octkit = new Octokit({
                auth: self.getElementById('githubPat').defaultValue
        });
        const projectSelect =  self.getElementById('projectSelect');
        const selectedProjectNodeIdDisplay = self.getElementById('selectedProjectNodeIdDisplay');
        projectSelect.addEventListener('change', () => {
                const selectedProjectId = projectSelect.value;
                selectedProjectNodeIdDisplay.value = selectedProjectId;
                this.dispatchEvent( new CustomEvent('issue-config-mediator', {
                          bubbles: true,    
                          composed: true,  
                          detail: {
                                  projectSelect: projectSelect,
                                }
                        }));
        });
       
        this.repoInfo();
    }
    #check(){
        if(!this.octkit) {
            return false;
        }
        if (!this.owner){
            this.owner = this.shadowRoot.getElementById('owner').defaultValue;
        }
        if (!this.repo){
            this.repo = this.shadowRoot.getElementById('repo').defaultValue;
        }
        return true;
    }
    async repoInfo() {
        if(!this.#check()) return;
        const self = this.shadowRoot;
        const repoProjectsQuery = `
        query GetRepositoryProjects($owner: String!, $name: String!) {
        repository(owner: $owner, name: $name) {
            id
            projectsV2(first: 20, orderBy: {field: TITLE, direction: ASC}) {
            nodes {
                id
                title
                number
                fields(first: 30) {
                nodes {
                    ... on ProjectV2FieldCommon { id name dataType }
                    ... on ProjectV2SingleSelectField { options { id name } }
                }
                }
            }
            }
        }
        }`;

        const response = await this.executeGraphQL(repoProjectsQuery, {
            owner: this.owner,
            name: this.repo
        }, "リポジトリ情報とProjectV2一覧取得");

        if (response && response.repository) {
            const  projectSelect   =   self.getElementById('projectSelect');
            this.repositoryNodeId = response.repository.id;
            
            logMessage(`リポジトリNode ID: ${this.repositoryNodeId} を取得しました。`, "success");

            const projectsV2Info = response.repository.projectsV2.nodes.map(p => ({
                id: p.id,
                title: p.title,
                number: p.number,
                fields: p.fields.nodes.filter(f => f)
            }));

            projectSelect.innerHTML = '<option value="">-- プロジェクトを選択 --</option>';
            projectsV2Info.forEach(p => {
                const option = document.createElement('option');
                option.value = p.id;
                option.textContent = `${p.title} (#${p.number})`;
                projectSelect.appendChild(option);
            }
            );
            if (projectsV2Info.length > 0) {
                projectSelect.selectedIndex = 1;
                projectSelect.dispatchEvent(new Event('change'));
            } else {
                logMessage("このリポジトリに紐づくProject V2は見つかりませんでした。", "warning");
            }

            await this.loadAndRenderRepoMilestonesREST();

        } else {
            logMessage("リポジトリ情報またはProjectV2の取得に失敗しました。", "error");
        }
    }

    async executeGraphQL(query, variables, operationName) {
        // (変更なし)d
        if (!this.octkit) {
            logMessage("エラー: Octokitが初期化されていません。PATを確認してください。", "error");
            return null;
        }
        logMessage(`${operationName} を実行中...`, "info");
        //setButtonsDisabled(true, [testGeminiApiBtn.id, generateScenariosBtn.id, createMilestonesFromJsonBtn.id, createGhMilestoneBtn.id, deleteMilestonesByPrefixBtn.id, generateCriticalPathBtn.id, listGeminiModelsBtn.id]);
        try {
            const response = await this.octkit.graphql(query, variables);
            logMessage(`${operationName} 成功。詳細はコンソール確認。`, "success");
            console.log(`${operationName} Response:`, response);
            return response;
        } catch (error) {
            console.error(`${operationName} エラー詳細:`, error);
            let errorMessageText = `${operationName} エラー: ${error.message || '不明なエラー'}`;
            if (error.data && error.data.errors)
                errorMessageText += `\nGraphQL Errors: ${JSON.stringify(error.data.errors, null, 2)}`;
            logMessage(errorMessageText, "error");
            return null;
        } finally {
            //setButtonsDisabled(false, [testGeminiApiBtn.id, generateScenariosBtn.id, createMilestonesFromJsonBtn.id, createGhMilestoneBtn.id, deleteMilestonesByPrefixBtn.id, generateCriticalPathBtn.id, listGeminiModelsBtn.id]);
        }
    }

    async executeRestApi(method, endpoint, bodyParams, operationName) {
        // (変更なし)
        if (!this.octkit) {
            logMessage("エラー: Octokitが初期化されていません。PATを確認してください。", "error");
            return null;
        }
        logMessage(`${operationName} を実行中 (REST)...`, "info");
        //setButtonsDisabled(true, [testGeminiApiBtn.id, generateScenariosBtn.id, createMilestonesFromJsonBtn.id, createGhMilestoneBtn.id, deleteMilestonesByPrefixBtn.id, generateCriticalPathBtn.id, listGeminiModelsBtn.id]);
        try {
            const response = await this.octkit.request(`${method.toUpperCase()} ${endpoint}`, bodyParams);
            logMessage(`${operationName} 成功。詳細はコンソール確認。`, "success");
            console.log(`${operationName} Response:`, response.data);
            return response.data;
        } catch (error) {
            console.error(`${operationName} エラー詳細:`, error);
            let errorMessageText = `${operationName} エラー: ${error.message || '不明なエラー'}`;
            if (error.response && error.response.data) {
                errorMessageText += `\nAPI Response: ${JSON.stringify(error.response.data, null, 2)}`;
            }
            logMessage(errorMessageText, "error");
            return null;
        } finally {
            //setButtonsDisabled(false, [testGeminiApiBtn.id, generateScenariosBtn.id, createMilestonesFromJsonBtn.id, createGhMilestoneBtn.id, deleteMilestonesByPrefixBtn.id, generateCriticalPathBtn.id, listGeminiModelsBtn.id]);
        }
    }

    async loadAndRenderRepoMilestonesREST() {
        // (変更なし)
        if (!this.#check()) return;
        const ms  = document.querySelector('milestone-phase');
        const milestones = await this.executeRestApi('GET', `/repos/${this.owner}/${this.repo}/milestones`, {
            state: 'open',
            sort: 'due_on',
            direction: 'asc',
            per_page: 50
        }, "既存GitHub Milestones取得 (REST)");

        if (milestones) {
            this.existingRepoMilestones = milestones.map(ms => ({
                id: ms.node_id,
                number: ms.number,
                title: ms.title,
                description: ms.description,
                dueOn: ms.due_on,
                url: ms.html_url,
                key_deliverables: extractKeyDeliverables(ms.description)
            }));
            ms.renderExistingMilestones(this);
        }

    }
    async createSingleGithubMilestone(baseTitle, description, dueDate, prefix="", suffix="") {
        // (変更なし)
         if (!this.#check()) return;

        if (!baseTitle) {
            logMessage("エラー: Milestoneタイトル(ベース)は必須です。", "error");
            return null;
        }

        const fullTitle = `${prefix}${baseTitle}${suffix}`;

        const requestBody = {
            title: fullTitle
        };
        if (description)
            requestBody.description = description;
        if (dueDate)
            requestBody.due_on = new Date(dueDate).toISOString();

        return await this.executeRestApi('POST', `/repos/${this.owner}/${this.repo}/milestones`, requestBody, `GitHub Milestone作成: ${fullTitle}`);
    }

    async deleteMilestonePrefix(prefixToDelete) {
        if (!this.existingRepoMilestones) {
            logMessage("リポジトリ情報が未ロードかOctokit未初期化です。Milestoneを読み込めません。", "warning");
            return;
        }
        const milestonesToDelete = this.existingRepoMilestones.filter(ms => ms.title.startsWith(prefixToDelete));

        if (milestonesToDelete.length === 0) {
            logMessage(`Prefix「${prefixToDelete}」で始まるオープンなMilestoneは見つかりませんでした。`, "info");
            return;
        }

        if (!confirm(`Prefix「${prefixToDelete}」で始まる以下の ${milestonesToDelete.length} 件のMilestoneを削除しますか？\n${milestonesToDelete.map(ms => `- ${ms.title} (#${ms.number})`).join('\n')}\nこの操作は元に戻せません。`)) {
            logMessage("Milestone削除処理をキャンセルしました。", "info");
            return;
        }

        logMessage(`${milestonesToDelete.length}件のMilestoneを削除します...`, "info");
        let successCount = 0;
        let errorCount = 0;

        for (const ms of milestonesToDelete) {
            const deleted = await this.executeRestApi('DELETE', `/repos/${this.owner}/${this.repo}/milestones/${ms.number}`, {}, `Milestone削除: ${ms.title}`);
            if (deleted !== null) {
                successCount++;
            } else {
                errorCount++;
            }
        }
        logMessage(`指定PrefixのMilestone削除完了。成功: ${successCount}件, 失敗: ${errorCount}件`, errorCount > 0 ? "warning" : "success");
        deleteMilestonePrefixInput.value = '';
    }

    async createIssue(title,body,labelsStr = null,projectNodeId=null, milestoneNodeId=null) {
                if (!this.#check())return;
                const owner = this.owner;
                const repo = this.repo;
                const createIssueMutation = `
                    mutation CreateIssueForProject(
                        $repoId: ID!, $title: String!, $body: String, 
                        $labelIds: [ID!], $assigneeIds: [ID!], $milestoneId: ID
                    ) {
                        createIssue(input: {
                            repositoryId: $repoId, title: $title, body: $body, 
                            labelIds: $labelIds, assigneeIds: $assigneeIds, milestoneId: $milestoneId
                        }) {
                            issue { id, number, title, url }
                        }
                    }`;
            
                const issueInput = { repoId: this.repositoryNodeId , title, body };
                if (milestoneNodeId) issueInput.milestoneId = milestoneNodeId;
            
                const createdIssueResponse = await this.executeGraphQL(createIssueMutation, issueInput, "GraphQLでIssue作成");
                if (!createdIssueResponse || !createdIssueResponse.createIssue || !createdIssueResponse.createIssue.issue) {
                    logMessage("Issueの作成に失敗しました。", "error"); return;
                }
                const issueNodeId = createdIssueResponse.createIssue.issue.id;
                const issueNumber = createdIssueResponse.createIssue.issue.number;
                this.currentIssueNumber = issueNumber;
                logMessage(`Issue #${issueNumber} (Node ID: ${issueNodeId}) を作成しました。`, "success");

               
                const addItemMutation = `
                    mutation AddItemToProject($projectId: ID!, $contentId: ID!) {
                        addProjectV2ItemById(input: {projectId: $projectId, contentId: $contentId}) {
                            item { id }
                        }
                    }`;
                const addItemResponse = await this.executeGraphQL(addItemMutation, { projectId: projectNodeId, contentId: issueNodeId }, "プロジェクトへIssue追加");
                if (!addItemResponse || !addItemResponse.addProjectV2ItemById || !addItemResponse.addProjectV2ItemById.item) {
                    logMessage("プロジェクトへのアイテム追加に失敗しました。", "error"); return;
                }
                const itemNodeId = addItemResponse.addProjectV2ItemById.item.id;
                logMessage(`アイテム (Node ID: ${itemNodeId}) をプロジェクトに追加しました。初期ステータスを確認してください (通常はNo Statusまたはデフォルト)。`, "success");
                
                if (labelsStr) {
                    const labels = labelsStr.split(',').map(l => l.trim()).filter(l => l);
                    if (labels.length > 0) {
                        await executeRestApi('POST', `/repos/{owner}/{repo}/issues/{issue_number}/labels`, { owner, repo, issue_number: issueNumber, labels }, `ラベル追加 (${labels.join(',')})`);
                    }
                }

                if (owner) {
                    const assignees = owner;
                    if (assignees.length > 0) {
                        await this.executeRestApi('POST', `/repos/{owner}/{repo}/issues/{issue_number}/assignees`, { owner, repo, issue_number: issueNumber, assignees }, `担当者割り当て (${assignees})`);
                    }
                }

            };

    tweak(){
        this.shadowRoot.getElementById('projectSelect').click();
    }
}


customElements.define('github-api', GithubApi);
