
// --- Cytoscape 初期化 ---
// スタイル定義関数 (style.js から読み込まれる想定)
const appStyleSheet = window.registerAppStyleSheet(); // style.js 内の関数名に合わせる
const cytoscape = window.cytoscape;
const _ = window._; // lodash

// 初期表示用デモデータ (新しいノードタイプに合わせる)
const demo = [
  {
    "data": {
      "id": "doc-0",
      "class": 'document',
      "role": 'start',
      "label": "start",
      "parent": "",
      "clonemarker": false,
      "stateVariables": [],
      "unitsOfInformation": [],
      "bbox": {
        "x": 0,
        "y": 0,
        "w": 20,
        "h": 20
      }
    },
    "position": {
      "x": 0,
      "y": 0
    },
    "group": "nodes",
    "removed": false,
    "selected": false,
    "selectable": true,
    "locked": false,
    "grabbable": true,
    "pannable": false,
    "classes": ""
  }
]
const demo_elements = [
    { data: { id: 'start_doc', class: 'document', label: 'Start Document', role: 'start' } },
    { data: { id: 'doc_a', class: 'document', label: 'Document A', role: 'element' } },
    { data: { id: 'doc_b', class: 'document', label: 'Document B', role: 'element', stateVariables: [{ state: { variable: 'recursive', value: 'true' } }] } },
    { data: { id: 'proc_1', class: 'Process', label: '', processType: 'general' } }, // processType追加
    { data: { id: 'agent_1', class: 'Agent', label: 'Transformer Agent', agentType: 'Transformer' } }, // agentType追加
    { data: { id: 'target_doc', class: 'document', label: 'Target Document', role: 'target' } },
    { data: { id: 'template_doc', class: 'document', label: 'Template', role: 'element', isTemplate: true } }, // テンプレート例
    { data: { id: 'cloned_doc', class: 'document', label: 'Cloned Doc', role: 'element', clonemarker: true } }, // クローン例

    // Edges
    { data: { id: 'e_start_a', source: 'start_doc', target: 'doc_a', class: 'production' } },
    { data: { id: 'e_a_p1', source: 'doc_a', target: 'proc_1', class: 'consumption' } },
    { data: { id: 'e_b_p1', source: 'doc_b', target: 'proc_1', class: 'consumption' } },
    { data: { id: 'e_agent1_p1', source: 'agent_1', target: 'proc_1', class: 'control', cardinality: 75 } }, // controlエッジ + cardinality
    { data: { id: 'e_p1_target', source: 'proc_1', target: 'target_doc', class: 'production' } },
    { data: { id: 'e_clone_rel', source: 'template_doc', target: 'cloned_doc', class: 'association' } }, // テンプレート関係 (カスタムクラス例)
];

const cy = window.cy = cytoscape({
  container: document.getElementById('cy'),
  elements: demo, // デモデータを使用
  layout: { name: 'preset' }, // 初期レイアウトはプリセット（データ内の位置）
  // style: fetch('style.json').then(res => res.json()) // JSONファイルの場合
  style: appStyleSheet(cytoscape), // style.js の関数を呼び出し
  wheelSensitivity: 0.2, // マウスホイール感度調整
});

// --- UI要素取得 ---
const addDocumentNodeButton = document.getElementById('addDocumentNodeButton'); // ID変更
const nodeLabelInput = document.getElementById('nodeLabelInput');
const documentOptionsDiv = document.getElementById('documentOptions');
const documentRoleSelect = document.getElementById('documentRoleSelect');

// エッジパネル用要素
const agentSelectForEdge = document.getElementById('agentSelectForEdge'); // 新設
const allNodesSelect = document.getElementById('allNodesSelect');
const addInputNodeButton = document.getElementById('addInputNodeButton');
const addOutputNodeButton = document.getElementById('addOutputNodeButton');
const inputNodeListDiv = document.getElementById('inputNodeList');
const outputNodeListDiv = document.getElementById('outputNodeList');
const processTypeSelectForEdge = document.getElementById('processTypeSelectForEdge'); // 新設
const edgeClassSelect = document.getElementById('edgeClassSelect');
const addEdgeButton = document.getElementById('addEdgeButton');



const deleteSelectedButton = document.getElementById('deleteSelected');
const layoutButton = document.getElementById('layoutButton');

// --- 情報パネル用要素取得 ---
const infoPanelContainer = document.getElementById('infoPanelContainer'); // 情報パネル全体のコンテナ
const infoPanelContent = document.getElementById('infoPanelContent'); // 情報パネルの内容部分
const noSelectionMessage = document.getElementById('noSelectionMessage');
const selectedNodeInfoDiv = document.getElementById('selectedNodeInfo');
const basicInfoDisplay = document.getElementById('basicInfoDisplay');
const metadataDisplay = document.getElementById('metadataDisplay');
const metadataSection = document.getElementById('metadataSection');


/**
 * メタデータオブジェクトをHTML要素に変換して表示する関数 (変更なし)
 * @param {HTMLElement} displayElement 表示先のHTML要素
 * @param {object} metadata 表示するメタデータオブジェクト
 */
function displayMetadata(displayElement, metadata) {
  displayElement.innerHTML = ''; // 表示をクリア
  const dl = document.createElement('dl');

  for (const key in metadata) {
      if (Object.hasOwnProperty.call(metadata, key)) {
          const item = metadata[key];
          const label = item.label || key;
          const value = item.value;
          const type = item.type || 'string';

          const dt = document.createElement('dt');
          dt.textContent = label;
          dl.appendChild(dt);

          const dd = document.createElement('dd');
          switch (type) {
              case 'link':
                  const a = document.createElement('a');
                  a.href = value; a.textContent = value; a.target = '_blank'; a.rel = 'noopener noreferrer';
                  dd.appendChild(a); break;
              case 'datetime':
                  try { dd.textContent = new Date(value).toLocaleString('ja-JP'); } catch (e) { dd.textContent = value; }
                  break;
              case 'array':
                  if (Array.isArray(value)) {
                      value.forEach(tag => { const span = document.createElement('span'); span.className = 'tag'; span.textContent = tag; dd.appendChild(span); });
                  } else { dd.textContent = JSON.stringify(value); }
                  break;
              case 'object':
                  const pre = document.createElement('pre'); pre.textContent = JSON.stringify(value, null, 2); dd.appendChild(pre); break;
              case 'status':
                  dd.textContent = value; dd.className = 'status';
                  if (value === '成功') dd.classList.add('status-success');
                  if (value === '失敗') dd.classList.add('status-error');
                  if (value === '実行中') dd.classList.add('status-inprogress');
                  break;
                case 'error':
                  dd.textContent = value; dd.className = 'status status-error'; break;
              case 'string': default: dd.textContent = value; break;
          }
          dl.appendChild(dd);
      }
  }
  displayElement.appendChild(dl);
}

// --- イベントリスナー ---

let nodeCounter = 100; // 追加ノードID用カウンター
let edgeCounter = 100; // 追加エッジID用カウンター
let processCounter = 100;
let agentCounter = 100;
let sourceNodeForEdge = null; // エッジ追加時の接続元ノード
let selectedInputNodes = []; // 選択された入力ノードIDの配列
let selectedOutputNodes = []; // 選択された出力ノードIDの配列

// --- 関数定義 ---



/*
function populateAgentSelect() {
  agentSelectForEdge.innerHTML = '<option value="">Agentを選択...</option>'; // 初期化
  cy.nodes('[class="Agent"]').forEach(agentNode => { // Agentノードのみを対象
      const option = document.createElement('option');
      option.value = agentNode.id();
      option.textContent = agentNode.data('label') ? `${agentNode.data('label')} (${agentNode.id()})` : agentNode.id();
      agentSelectForEdge.appendChild(option);
  });
}
*/


// 入出力ノードリスト表示を更新する関数
function updateNodeListDisplay(listDiv, nodeIds) {
    listDiv.innerHTML = ''; // クリア
    nodeIds.forEach(nodeId => {
        const node = cy.getElementById(nodeId);
        const span = document.createElement('span');
        span.textContent = node.data('label') || nodeId; // ラベルがあればラベル表示
        // NOT IMPLEMENTED: リストから削除するボタンなど
        listDiv.appendChild(span);
    });
}


// ノードクリック時の処理 (エッジ追加用)
cy.on('tap', 'node', (event) => {
  const tappedNode = event.target;
  const href = tappedNode[0]._private.data.href;
  if(href)
  {
    const keyListener = (event) => {
      const pressedKey = event.key;
      if (pressedKey === 'a') {
          window.open(href, '_blank');
          // リスナーを一度実行したら削除
          document.removeEventListener('keydown', keyListener);
          console.log(`Opened document: ${href}`);
      } else if (pressedKey === 'Escape') { // Escキーでキャンセル
           document.removeEventListener('keydown', keyListener);
           console.log('Document open cancelled.');
      }
    };
    console.log(`Node tapped: ${tappedNode.id()}. Press 'a' to open link, 'Esc' to cancel.`);
    // 既存のリスナーがあれば削除してから追加（念のため）
    // document.removeEventListener('keydown', keyListener); // これはグローバルなので注意が必要
    document.addEventListener('keydown', keyListener, { once: false }); // once:false で複数回押せるようにするか検討

    // 一定時間後にリスナーを削除するタイムアウトも検討
    setTimeout(() => {
        document.removeEventListener('keydown', keyListener);
    }, 5000); // 5秒後に自動解除
  }
  targetNode = this; // 選択されたノードをtargetNodeに格納
  targetNode.add_select = true;

});

// 背景クリックでエッジ追加モード解除
cy.on('tap', (event) => {
  if (event.target === cy) {
    noSelectionMessage.style.display = 'block';
    selectedNodeInfoDiv.style.display = 'none';
    basicInfoDisplay.innerHTML = '';
    metadataDisplay.innerHTML = '';
     // 情報パネルを閉じる (任意)
     // infoPanelContainer.classList.add('collapsed');
  }
    if (event.target === cy && sourceNodeForEdge) {
        sourceNodeForEdge.removeClass('highlighted');
        sourceNodeForEdge = null;
        console.log('Edge creation cancelled.');
    }
});



        // ノード選択時のイベントリスナー
cy.on('select', 'node', (event) => {
  const selectedNode = event.target;
  const nodeData = selectedNode.data();

  noSelectionMessage.style.display = 'none';
  selectedNodeInfoDiv.style.display = 'block';

  // 基本情報を表示
  basicInfoDisplay.innerHTML = `
      <div><strong>ID:</strong> ${nodeData.id}</div>
      <div><strong>Label:</strong> ${nodeData.label || '(No Label)'}</div>
      <div><strong>Class:</strong> ${nodeData.class || 'N/A'}</div>
      ${nodeData.role ? `<div><strong>Role:</strong> ${nodeData.role}</div>` : ''}
      ${nodeData.processType ? `<div><strong>Process Type:</strong> ${nodeData.processType}</div>` : ''}
      ${nodeData.agentType ? `<div><strong>Agent Type:</strong> ${nodeData.agentType}</div>` : ''}
  `;

  // メタデータを表示
  if (nodeData.metadata && Object.keys(nodeData.metadata).length > 0) {
      metadataSection.style.display = 'block';
      displayMetadata(metadataDisplay, nodeData.metadata);
  } else {
      metadataSection.style.display = 'none';
      metadataDisplay.innerHTML = '';
  }

  // 情報パネルを開く (もし閉じていたら)
  if (infoPanelContainer.classList.contains('collapsed')) {
        infoPanelContainer.classList.remove('collapsed');
  }
});

// ノード選択解除時 (または背景クリック時) のイベントリスナー
cy.on('unselect tapunselect', 'node', (event) => {
  if (cy.$('node:selected').length === 0) {
      noSelectionMessage.style.display = 'block';
      selectedNodeInfoDiv.style.display = 'none';
      basicInfoDisplay.innerHTML = '';
      metadataDisplay.innerHTML = '';
        // 情報パネルを閉じる (任意)
        // infoPanelContainer.classList.add('collapsed');
  }
});





// --- 初期化処理 ---
// ページ読み込み時にファイルリストを取得（ダミー）
// populateFileList();



// 初期レイアウト実行 (デモデータ用)
// NOT IMPLEMENTED: デモデータに適したレイアウト
// cy.layout({ name: 'cose' }).run();


// --- Google API 関連 (ダミー / 要実装) ---
// function handleAuthClick() { console.warn('handleAuthClick NOT IMPLEMENTED'); /* TODO: Call gapi.js function */ }
// function handleSignoutClick() { console.warn('handleSignoutClick NOT IMPLEMENTED'); /* TODO: Call gapi.js function */ }
// function updateSigninStatus(isSignedIn) { console.warn('updateSigninStatus NOT IMPLEMENTED', isSignedIn); /* TODO: Update UI based on sign-in status */ }

console.log('Cytoscape test application initialized.');

