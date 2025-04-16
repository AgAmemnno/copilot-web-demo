const panels = [
    {
        id: 'addDocumentPanel',
        headerText: 'Documentノード追加',
        content: `
            <div class="control-group">
                <label for="nodeLabelInput">ラベル:</label>
                <input type="text" id="nodeLabelInput" placeholder="ドキュメント名">
                <label for="nodeDocument">Node - documents:</label>
                <select id="nodeDocument"></select>
                <div id="documentOptions">
                    <label for="documentRoleSelect">役割 (Role):</label>
                    <select id="documentRoleSelect">
                        <option value="element">element</option>
                        <option value="start">start</option>
                        <option value="target">target</option>
                    </select>
                </div>
            </div>
        `
    },
    {
        id: 'defineEdgePanel',
        headerText: 'エッジ / プロセス定義',
        content: `
            <div class="control-group">
                <label for="allNodesSelect">接続元/先ノード選択:</label>
                <select id="allNodesSelect">
                    <option value="">グラフ上のノードを選択...</option>
                </select>

                <button id="addInputNodeButton" class="small-button">入力に追加</button>
                <button id="addOutputNodeButton" class="small-button">出力に追加</button>

                <label>入力ノードリスト:</label>
                <div id="inputNodeList" class="node-list-display"></div>
                <label>出力ノードリスト:</label>
                <div id="outputNodeList" class="node-list-display"></div>
                <label for="processTypeSelectForEdge">プロセスタイプ:</label>
                <select id="processTypeSelectForEdge">
                    <option value="general">general</option>
                    <option value="association">association</option>
                    <option value="dissociation">dissociation</option>
                </select>
                <label for="agentSelectForEdge">関連付けるAgent:</label>
                <select id="agentSelectForEdge">
                    <option value="Executor">Executor</option>
                    <option value="Transformer">Transformer</option>
                    <option value="Accelerator">Accelerator</option>
                    <option value="Scheduler">Scheduler</option>
                    <option value="Monitor">Monitor</option>
                </select>
                <label for="edgeClassSelect">エッジクラス (Doc<->Proc):</label>
                <select id="edgeClassSelect">
                    <option value="production">production</option>
                    <option value="consumption">consumption</option>
                    <option value="stimulation">stimulation</option>
                </select>
            </div>
        `
    },
    { 
        id: "googleDrivePanel",
        headerText: 'Google Drive連携 (未実装)',
        content: `
            <div class="control-group">
                <label for="files_download">保存済みグラフ読込:</label>
                <select id="files_download"></select>
                <label for="jsonkeyInput">Key:</label>
                <input type="text" id="jsonkeyInput" placeholder="apikey">
                <div id="status">ステータス: アイドル</div>
                <div id="error"></div>
            </div>`
    },
    {
        id: 'otherControlsPanel',
        headerText: 'その他の操作',
        content: `
            <div class="control-group" >
            <span id="others-controls"></span>
            </div>
        `
    }
];


