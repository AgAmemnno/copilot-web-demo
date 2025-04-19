import BaseHTMLComponentWithEvent from './base/BaseHTMLComponentWithEvent.js';

class CollapsiblePanel extends  BaseHTMLComponentWithEvent {
  _selector = ".collapsible-panel";
  
  constructor() {
    super();

  }

  ishadow(){
      this.registerId();
      this.eventInfo = this.retrieveEventInfo();

      const template = document.createElement('template');
      template.innerHTML = `
          <link rel="stylesheet" href="css/collapsible-panel.css">
          <div class="collapsible-panel">
              <div class="panel-header">
                  <h4></h4>
                  <span class="panel-toggle-icon">▼</span>
              </div>
              <div class="panel-content">
                  <slot></slot>
              </div>
          </div>
      `;

      // Append the template content to the shadow DOM
      this.shadowRoot.appendChild(template.content.cloneNode(true));

      // Add event listener for toggling the panel
      const panel = this.shadowRoot.querySelector('.collapsible-panel');
      const header = this.shadowRoot.querySelector('.panel-header');
      header.addEventListener('click', () => {
          panel.classList.toggle('collapsed');
      });
  }

  // Method to set the header text dynamically
  setHeaderText(headerText) {

      this.shadowRoot.querySelector('h4').textContent = headerText;
  }

  static panelize(panels,panelName){
    const rightPanelContainer = document.getElementById(panelName);//'rightPanelContainer-wrapper1');
    panels.forEach(panelConfig => {
        const panel = document.createElement('collapsible-panel');
        panel.ishadow();
        panel.setAttribute('id', panelConfig.id);
        panel.innerHTML = panelConfig.content;
        panel.setHeaderText(panelConfig.headerText);
        rightPanelContainer.appendChild(panel);
    });
    
  }

  static populateAllNodesSelect() {
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

  static panelFolding(){
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
  }

  static populateAll(){
    const allNodesSelect = document.getElementById('allNodesSelect');
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
    // スタイル定義関数 (style.js から読み込まれる想定)
    const appStyleSheet = window.registerAppStyleSheet(); // style.js 内の関数名に合わせる

    const cy = window.cy = cytoscape({
      container: document.getElementById('cy'),
      elements: demo, // デモデータを使用
      layout: { name: 'preset' }, // 初期レイアウトはプリセット（データ内の位置）
      // style: fetch('style.json').then(res => res.json()) // JSONファイルの場合
      style: appStyleSheet(cytoscape), // style.js の関数を呼び出し
      wheelSensitivity: 0.2, // マウスホイール感度調整
    });

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
      CollapsiblePanel.populateAllNodesSelect();
      CollapsiblePanel.panelFolding();
          // ノード追加・削除時にドロップダウンを更新
      cy.on('add', 'node', CollapsiblePanel.populateAllNodesSelect);
      cy.on('remove', 'node',CollapsiblePanel.populateAllNodesSelect);
      // 入出力ノードリスト表示を更新する関数



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
   //targetNode = this; // 選択されたノードをtargetNodeに格納
    //targetNode.add_select = true;

    });
    const selectedNodeInfoDiv = document.getElementById('selectedNodeInfo');
    let sourceNodeForEdge = null; // エッジ追加時の接続元ノード
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
    const selectedNodeInfoDiv = document.getElementById('selectedNodeInfo');
        
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


   cy.container().style.display ="none";


  }

}
// Define the custom element


export { CollapsiblePanel };
