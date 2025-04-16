window.onload = function () {
  
const rightPanelContainer = document.getElementById('rightPanelContainer-wrapper1');
    
// Predefined panels configuration
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
              <button id="addDocumentNodeButton">Documentノード追加</button>
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
                <div>
                    <button id="addInputNodeButton" class="small-button">入力に追加</button>
                    <button id="addOutputNodeButton" class="small-button">出力に追加</button>
                </div>
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
                <button id="addEdgeButton">関連付け実行 (仮)</button>
            </div>
        `
    },
    { 
      id: "googleDrivePanel",
      headerText: 'Google Drive連携 (未実装)',
      content: `
          <div class="control-group">
              <button id="uploadButton">グラフをJSONで保存</button>
              <label for="files_download">保存済みグラフ読込:</label>
              <select id="files_download"></select>
              <label for="jsonkeyInput">Key:</label>
              <input type="text" id="jsonkeyInput" placeholder="apikey">
              <button id="loadDataButton">読込実行</button>
              <button id="getButton">Get</button>
              <button id="postButton">Post</button>
              <div id="status">ステータス: アイドル</div>
              <div id="error"></div>
          </div>`
  },
  {
      id: 'otherControlsPanel',
      headerText: 'その他の操作',
      content: `
          <div class="control-group">
              <button id="deleteSelected">選択要素削除</button>
              <button id="layoutButton">レイアウト実行 (Preset)</button>
          </div>
      `
  }
];

// Dynamically create and append panels
panels.forEach(panelConfig => {
    const panel = document.createElement('collapsible-panel');
    panel.setAttribute('id', panelConfig.id);
    panel.innerHTML = panelConfig.content;
    panel.setHeaderText(panelConfig.headerText);
    rightPanelContainer.appendChild(panel);
});

const uploadButton = document.getElementById('uploadButton');
uploadButton.addEventListener('click', () => {
  statusDiv.textContent = 'ステータス: アップロード中...';
  errorDiv.textContent = '';
  const graphJson = cy.json(); // 現在のグラフデータをJSONで取得
  console.log('Uploading JSON:', JSON.stringify(graphJson, null, 2));
  // NOT IMPLEMENTED: google.script.run でサーバーサイド関数 (uploadJsonToDrive) を呼び出す
  // google.script.run.withSuccessHandler(onUploadSuccess).withFailureHandler(onApiError).uploadJsonToDrive(graphJson, 'graph_export.json');
  setTimeout(() => { // ダミーの遅延
       onUploadSuccess({ id: 'dummy_id', name: 'graph_export.json' }); // ダミー成功
       // onApiError({ message: 'Dummy upload error' }); // ダミー失敗
  }, 1000);
});
  
const loadDataButton = document.getElementById('loadDataButton');
loadDataButton.addEventListener('click',async () => {

  if(!(gapiInited && gisInited)){
    
    try {
      await gisLoaded(); // gisLoaded() の処理が終了するまで待機
      console.log('gisLoaded() has completed successfully.');
    } catch (error) {
        console.error('Error during gisLoaded execution:', error);
    }

    ((interval = 100, timeout = 10000)=> {
      const startTime = Date.now();

      function checkInitialized() {
          if (gapiInited && gisInited) {
              console.log('gisLoaded() has completed successfully.');
              access_cert(); // 完了時にコールバックを実行
          } else if (Date.now() - startTime > timeout) {
              console.error('Timeout waiting for gisLoaded() to complete.');
          } else {
              setTimeout(checkInitialized, interval); // 再試行
          }
      }

      checkInitialized();
    })();
  }else{
      access_cert();
  }
  


});

loadDataButton.addEventListener('change', () => {
  const selectedFileId = filesDownloadSelect.value;
  if (!selectedFileId) {
      alert('読み込むファイルを選択してください。');
      return;
  }
  statusDiv.textContent = 'ステータス: 読み込み中...';
  errorDiv.textContent = '';
  console.log('Loading file ID:', selectedFileId);
  // NOT IMPLEMENTED: google.script.run でサーバーサイド関数 (loadJsonFromDrive) を呼び出す
  // google.script.run.withSuccessHandler(onLoadSuccess).withFailureHandler(onApiError).loadJsonFromDrive(selectedFileId);
   setTimeout(() => { // ダミーの遅延
       onLoadSuccess({ elements: demo_elements }); // ダミー成功 (デモデータ読み込み)
       // onApiError({ message: 'Dummy load error' }); // ダミー失敗
  }, 1000);
});

for(let i=1;i<3;i++){

    const rightPanelContainer = document.getElementById(`rightPanelContainer${i}`);
    const PanelsContainer = document.getElementById(`infoPanelsContainer${i}`);
    
    rightPanelContainer.addEventListener('click', (event) => {
        if (!event.detail.collapsed) {
            if (rightPanelContainer.classList.contains('collapsed')) {

                rightPanelContainer.classList.remove('collapsed');
            }
        }
    });
    PanelsContainer.addEventListener('click', (event) => {
        const customEvent = new CustomEvent('click', {
                detail: { collapsed: false },
                bubbles: true, // イベントを親要素に伝搬させる
                cancelable: true // 必要に応じてキャンセル可能にする 
        });
        if (!rightPanelContainer.classList.contains('collapsed')) {
            rightPanelContainer.classList.add('collapsed');
            customEvent.detail.collapsed = true;
            PanelsContainer.dispatchEvent(customEvent);
            event.stopPropagation();

          
        }
    });
}



const filesDownloadSelect = document.getElementById('files_download');
const nodeDocument = document.getElementById('nodeDocument');
const statusDiv = document.getElementById('status');
const errorDiv = document.getElementById('error');
const allNodesSelect = document.getElementById('allNodesSelect');
const addInputNodeButton = document.getElementById('addInputNodeButton');
const addOutputNodeButton = document.getElementById('addOutputNodeButton');

const addDocumentNodeButton = document.getElementById('addDocumentNodeButton'); // ID変更
const nodeLabelInput = document.getElementById('nodeLabelInput');
const documentOptionsDiv = document.getElementById('documentOptions');
const documentRoleSelect = document.getElementById('documentRoleSelect');

const inputNodeListDiv = document.getElementById('inputNodeList');
const outputNodeListDiv = document.getElementById('outputNodeList');
const processTypeSelectForEdge = document.getElementById('processTypeSelectForEdge');
const edgeClassSelect = document.getElementById('edgeClassSelect')
const addEdgeButton = document.getElementById('addEdgeButton');
    // エッジパネル用要素
const agentSelectForEdge = document.getElementById('agentSelectForEdge'); 

// --- イベントリスナー ---
// 全ノードドロップダウン変更時 -> Cytoscape上でノードを選択
allNodesSelect.addEventListener('change', () => {
  const selectedNodeId = allNodesSelect.value;
  if (selectedNodeId) {
      const node = cy.getElementById(selectedNodeId);
      if (node.length > 0) { // ノードが存在するか確認
          cy.elements().unselect(); // 他の選択を解除
          node.select(); // ノードを選択
          // cy.center(node); // 選択したノードに視点を移動 (任意)
      }
  }
});


    // 「入力に追加」ボタン
addInputNodeButton.addEventListener('click', () => {
  const selectedNodeId = allNodesSelect.value;
  if (selectedNodeId && !selectedInputNodes.includes(selectedNodeId)) {
      // NOT IMPLEMENTED: ノードタイプによる入力制限チェック (例: Agentは入力になれないなど)
      selectedInputNodes.push(selectedNodeId);
      updateNodeListDisplay(inputNodeListDiv, selectedInputNodes);
  }
});

// 「出力に追加」ボタン
addOutputNodeButton.addEventListener('click', () => {
  const selectedNodeId = allNodesSelect.value;
  if (selectedNodeId && !selectedOutputNodes.includes(selectedNodeId)) {
      // NOT IMPLEMENTED: ノードタイプによる出力制限チェック
      selectedOutputNodes.push(selectedNodeId);
      updateNodeListDisplay(outputNodeListDiv, selectedOutputNodes);
  }
});



// ノード追加ボタン
addDocumentNodeButton.addEventListener('click', () => {
    const nodeClass = 'document'; // 固定
    const label = nodeLabelInput.value || `${nodeClass} ${nodeCounter}`;
    const id = `doc_${nodeCounter}`; // IDプレフィックス変更
    nodeCounter++;

    const newNodeData = {
        group: 'nodes',
        data: {
            id: id,
            class: nodeClass,
            label: label,
            // デフォルト値や選択値に基づいて属性を設定
            role: nodeClass === 'document' ? documentRoleSelect.value : undefined,
            stateVariables: [],
            unitsOfInformation: [],
            clonemarker: false,
            // isTemplate: false, // テンプレート機能用
            // logicType: undefined, // 論理修飾用
        },
        // 画面中央あたりにランダムで配置
        position: {
            x: cy.width() / 2 + (Math.random() - 0.5) * 100,
            y: cy.height() / 2 + (Math.random() - 0.5) * 100
        }
    };

    // Documentの場合、役割に応じて初期状態を設定するなど (任意)
    // if (nodeClass === 'document' && newNodeData.data.role === 'start') { ... }
    const doc = JSON.parse(nodeDocument.value);
    if(doc.id != ""){ 
      newNodeData.data.label  = doc.label;
      newNodeData.data.href   = doc.href;
    }
    cy.add(newNodeData);
    console.log('Added node:', newNodeData);

    // NOT IMPLEMENTED: Processノード追加時に自動でCompartment生成するロジック
    // if (nodeClass === 'Process') {
    //    createFunctionCompartmentAround(newNodeData.data.id);
    // }

    nodeLabelInput.value = ''; // ラベル入力欄をクリア
});

addEdgeButton.addEventListener('click', () => {
    const processType = processTypeSelectForEdge.value; // 選択されたプロセスタイプを取得
    const edgeClass = edgeClassSelect.value;
    const selectedAgent = agentSelectForEdge.value;

    console.log('--- Add Edge/Process Request ---');
    console.log('Input Nodes:', selectedInputNodes);
    console.log('Output Nodes:', selectedOutputNodes);
    console.log('Process Type:', processType);
    console.log('Edge Class (Doc<->Proc):', edgeClass);
    
    if (selectedInputNodes.length === 0 || selectedOutputNodes.length === 0) {
        alert('入力ノードと出力ノードをそれぞれ1つ以上選択してください。');
        return;
    }

    const agentId = `agent_${agentCounter++}`;
    const agentlabel  = `Agent ${agentCounter}`;
    const agentNode = {
      group: 'nodes',
      data: { 
        id: agentId , 
        class: 'Agent', 
        agentType: selectedAgent, 
        label: agentlabel },
      position: { // 入力と出力の中間あたりに仮配置
          x: 0,
          y: 0,
      }
    };
    cy.add(agentNode);
    const processId = `proc_${processCounter++}`;

    const tempProcessNode = {
        group: 'nodes',
        data: { id: processId, class: 'Process', processType: processType, label: processType },
        position: { // 入力と出力の中間あたりに仮配置
            x: 0,
            y: 0
        }
    };

    cy.add(tempProcessNode);


    const controlEdgeId = `e_${edgeCounter++}`;
    cy.add(
      { group: 'edges', 
        data: { 
          id: controlEdgeId, 
          source: agentId, 
          target: processId, 
          class: 'control', 
          cardinality: 50 
        } 
      }); // cardinalityは仮



    let ipos = {x:0,y:0};
    let n    = 0;
    selectedInputNodes.forEach(inputId => {
        const edgeIdIn = `e_${edgeCounter++}`;
        edgeCounter++;
        let p = cy.getElementById(inputId)[0]._private.position;
        ipos.x += p.x;
        ipos.y += p.y;
        n++;
        cy.add({
            group: 'edges',
            data: {
                id: edgeIdIn,
                source: inputId,
                target: processId, // 最初の出力ノードに接続
                class:  edgeClass,
                cardinality: 1, // デフォルト値 (必要に応じて変更)
            }
        });
    });
    ipos = {x:ipos.x/n ,y:ipos.y/n};
    let opos = {x:0,y:0};
    n    = 0;
         // 仮に出力へプロセスからのエッジを生成 (クラスは選択されたもの、方向は仮)
    selectedOutputNodes.forEach(outputId => {
      const edgeIdOut = `e_${edgeCounter++}`;
      let p = cy.getElementById(outputId)[0]._private.position;
      opos.x += p.x;
      opos.y += p.y;
      n++;
      cy.add({ group: 'edges', data: { id: edgeIdOut, source: processId, target: outputId, class: edgeClass } });
     });
    opos = {x:opos.x/n ,y:opos.y/n};
    let ppos = cy.getElementById(processId)[0]._private.position;
    let apos = cy.getElementById(agentId)[0]._private.position;
    apos.x = ppos.x =  (ipos.x + opos.x)/2.;
    ppos.y  =  (ipos.y + opos.y)/2.;
    apos.y  =  ppos.y + 50;

    
    alert(`エッジ生成実行 (仮):\nInputs: ${selectedInputNodes.join(', ')}\nOutputs: ${selectedOutputNodes.join(', ')}\nClass: ${edgeClass}`);
    
    // 実行後はリストをクリア
    selectedInputNodes = [];
    selectedOutputNodes = [];
    updateNodeListDisplay(inputNodeListDiv, selectedInputNodes);
    updateNodeListDisplay(outputNodeListDiv, selectedOutputNodes);
    allNodesSelect.value = "";
    processTypeSelectForEdge.value = "general"; // デフォルトに戻す
    edgeClassSelect.value = "production"; // デフォルトに戻す
  });

function populateAllNodesSelect() {
allNodesSelect.innerHTML = '<option value="">グラフ上のノードを選択...</option>'; // 初期化
cy.nodes().forEach(node => {
    const id = node.id();
    if(!id.startsWith("doc")){
        return;
    }
    const option = document.createElement('option');

    option.value = node.id();
    // ラベルがあればラベルを、なければIDを表示
    option.textContent = node.data('label') ? `${node.data('label')} (${node.id()})` : node.id();
    allNodesSelect.appendChild(option);
});
}

// --- 折りたたみ機能 ---
document.querySelectorAll('.panel-header').forEach(header => {
  header.addEventListener('click', () => {
      const panel = header.closest('.collapsible-panel');
      panel.classList.toggle('collapsed');
  });
  // 初期状態で特定のパネル以外を閉じる (任意)
  const panel = header.closest('.collapsible-panel');
  if (panel.id !== 'infoPanelContainer') { // 情報パネル以外は初期状態で閉じる例
        panel.classList.add('collapsed');
  }
});


populateAllNodesSelect();

// ノード追加・削除時にドロップダウンを更新
cy.on('add', 'node', populateAllNodesSelect);
cy.on('remove', 'node', populateAllNodesSelect);
  
const deleteSelectedButton = document.getElementById('deleteSelected');
const layoutButton = document.getElementById('layoutButton');
  // 選択要素削除ボタン
deleteSelectedButton.addEventListener('click', () => {
    const selectedElements = cy.$(':selected');
    if (!selectedElements.empty()) {
        cy.remove(selectedElements);
    } else {
        alert('削除する要素を選択してください。');
    }
});

// レイアウト実行ボタン
layoutButton.addEventListener('click', () => {
    // NOT IMPLEMENTED: より適切なレイアウトを選択・実行する
    // 例: cose, cola, dagre など
    // const layout = cy.layout({ name: 'cose', animate: true });
    const layout = cy.layout({ name: 'preset' }); // とりあえず preset
    layout.run();
});

document.getElementById('getButton').addEventListener('click', sendGetRequest);
document.getElementById('postButton').addEventListener('click', sendPostRequest);






let CLIENT_ID;
let API_KEY;

const folderId ='1dppnTOWb7mAc35dQYvkOlXU-GnmzL4ha'; // Replace with the actual folder ID
const schedule_folderId = '1zdPsgrZ70N1rb1G8R8akWYusp4ErBB3F';


// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.


let tokenClient;
let gapiInited = false;
let gisInited = false;
//uploadButton.style.visibility = 'hidden';
//loadDataButton.style.visibility = 'hidden';
// --- Google Drive 連携 (ダミー / 要実装) ---


const files_walk = (q,cb)=>{
    
  return  async function() {
   
    const searchResponse = await gapi.client.drive.files.list({
      q: q,
      fields: 'files(id, name)',
    })
      .then(cb);
  }

}

const create_options = (fileSelector,files,label ="名前：") =>{
  if (files && files.length > 0) {
      files.forEach((file) => {
        const option = document.createElement('option');
        option.value = file.id;
        option.textContent = `${label} ${file.name}`;
        fileSelector.appendChild(option);
      });
    console.log('Files loaded into selector.');
  } else {
    console.error('No files found in the specified folder.');
    throw new Error('No files found');
  }

}

const downloadable_files = async () => {
  const create_selctor = (response)=> {
         const fileSelector = document.getElementById('files_download');
         fileSelector.innerHTML = ''; // Clear existing options
         create_options(fileSelector,response.result.files,"ジェイソン：");
   };

  const get_gdoc_link = (response) => {
         const files = response.result.files;
         if (files && files.length > 0) {
             const fileSelector = nodeDocument;
             fileSelector.innerHTML = ''; // Clear existing options
             
             const option = document.createElement('option');
             option.value = JSON.stringify({ id:"",label:"",href :""}); 
             option.textContent = `Not File.`;
             fileSelector.appendChild(option);

             files.forEach(function(file) {
                 gapi.client.drive.permissions.create({
                     'fileId': file.id,
                     'resource': {
                         'role': 'reader',
                         'type': 'anyone',
                         'allowFileDiscovery': false
                     }
                 }).then(function(response) {
                     gapi.client.drive.files.get({
                         'fileId': file.id,
                         'fields': 'webViewLink'
                     }).then(function(response) {
                       
                       const option = document.createElement('option');
                       option.value =JSON.stringify({ id:file.id,label:file.name,href :response.result.webViewLink }); 
                       option.textContent = `GDOC: ${file.name}`;
                       fileSelector.appendChild(option);
                       console.log(file.name + ' の共有リンク: ' + response.result.webViewLink);
                       
                     });
                 });
             });
         } else {
             console.log('No files found.');
         }
   };
 

  const query = `'${folderId}' in parents and trashed = false`; 
  await files_walk( query,create_selctor)();
  
  const query2 = `'${schedule_folderId}' in parents and mimeType='application/vnd.google-apps.document'`;
  await files_walk(query2,get_gdoc_link)();
/*
   'pageSize': 100,
   'q': "'" + schedule_folderId + "' in parents and mimeType='application/vnd.google-apps.document'",
   'fields': "nextPageToken, files(id, name)"
*/

};

function access_cert(){
  if (!gapi || !gapi.client) {
    localStorage.removeItem('api_key');
    localStorage.removeItem('client_id');
    console.error('gapi or gapi.client is not loaded.');
    throw new Error('gapi or gapi.client is not available.');
  }



  tokenClient.callback = async (resp) => {
    if (resp.error !== undefined) {
      throw (resp);
    }
  
    // トークンをローカルストレージに保存
    localStorage.setItem('access_token', resp.access_token);
    localStorage.setItem('token_type', resp.token_type);
    localStorage.setItem('expires_in', resp.expires_in);
    localStorage.setItem('scope', resp.scope);
  
    loadDataButton.innerText = 'リフレッシュ';
    downloadable_files();
  };
  const refresh = loadDataButton.innerText== 'リフレッシュ';
  // ローカルストレージからトークンを読み込む

  const expiresIn = localStorage.getItem('expires_in');
  const tokenType = localStorage.getItem('token_type');
  const scopes = localStorage.getItem('scopes');
  const accessToken = (refresh) ? "":localStorage.getItem('access_token');
  if (accessToken) {
    // トークンが存在する場合、gapi.client.setToken()で設定する。
      gapi.client.setToken({
        access_token: accessToken,
        token_type: tokenType,
        expires_in: expiresIn,
        scope: scopes 
      });
      downloadable_files();
    // 必要に応じて、トークンの有効期限を確認し、リフレッシュ処理を行う

     loadDataButton.innerText =  'リフレッシュ';
  } else {
    if (gapi.client.getToken() === null) {
      // トークンが存在しない場合、認証フローを開始
       tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
       tokenClient.requestAccessToken({prompt: ''});
    }
  }

}

function populateFileList() {
    statusDiv.textContent = 'ステータス: ファイルリスト取得中...';
    errorDiv.textContent = '';
    console.log('Fetching file list...');
    // NOT IMPLEMENTED: google.script.run でサーバーサイド関数 (getDownloadableFilesInfo) を呼び出す
    // google.script.run.withSuccessHandler(onFileListSuccess).withFailureHandler(onApiError).getDownloadableFilesInfo();
    setTimeout(() => { // ダミーの遅延
        const dummyFiles = [
            { id: 'file1', name: 'graph_save_1.json'},
            { id: 'file2', name: 'another_graph.json'}
        ];
        onFileListSuccess(dummyFiles); // ダミー成功
        // onApiError({ message: 'Dummy file list error' }); // ダミー失敗
    }, 500);
}

function onFileListSuccess(files) {
    statusDiv.textContent = 'ステータス: アイドル';
    filesDownloadSelect.innerHTML = '<option value="">選択してください</option>'; // クリア
    if (files && files.length > 0) {
        files.forEach(file => {
            const option = document.createElement('option');
            option.value = file.id;
            option.textContent = file.name;
            filesDownloadSelect.appendChild(option);
        });
    } else {
         statusDiv.textContent = 'ステータス: 保存済みファイルが見つかりません。';
    }
    console.log('File list loaded:', files);
}

 function onUploadSuccess(fileInfo) {
     statusDiv.textContent = `ステータス: アップロード成功 (${fileInfo.name})`;
     console.log('Upload successful:', fileInfo);
     populateFileList(); // アップロード後にリストを更新
 }

 function onLoadSuccess(graphData) {
     statusDiv.textContent = 'ステータス: 読み込み成功';
     if (graphData && graphData.elements) {
         cy.elements().remove(); // 既存の要素を削除
         cy.add(graphData.elements); // 新しい要素を追加
         // NOT IMPLEMENTED: 適切なレイアウトを実行
         cy.layout({ name: 'preset' }).run(); // とりあえずpreset
         console.log('Graph loaded successfully.');
     } else {
         console.error('Loaded data is invalid:', graphData);
         errorDiv.textContent = 'エラー: 読み込んだデータが無効です。';
     }
 }

 function onApiError(error) {
     statusDiv.textContent = 'ステータス: エラー';
     errorDiv.textContent = `エラー: ${error.message || JSON.stringify(error)}`;
     console.error('API Error:', error);
 }

async function gisLoaded() { 
  const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
  const SCOPES = 'https://www.googleapis.com/auth/drive';
  
  let client_id = localStorage.getItem('client_id');
  let api_key = localStorage.getItem('api_key');
  if (!(client_id && api_key )){
    const jsonkeyInput = document.getElementById('jsonkeyInput');
    const d  = JSON.parse(jsonkeyInput.value); 
    client_id =  d.client_id;
    api_key   =  d.api_key;
    localStorage.setItem('api_key',d.api_key);
    localStorage.setItem('client_id',d.client_id);
    jsonkeyInput.value = "";
  }

  await gapi.load('client', async ()=>{
      
      await gapi.client.init({
        apiKey: api_key,
        discoveryDocs: [DISCOVERY_DOC],
      });
      gapiInited = true;
  });
    
  tokenClient = await google.accounts.oauth2.initTokenClient({
    client_id: client_id,
    scope: SCOPES,
    callback: '', // defined later
  });
  gisInited = true;
}

};
