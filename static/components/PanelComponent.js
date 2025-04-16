import BaseHTMLComponentWithEvent from './base/BaseHTMLComponentWithEvent.js';

class CollapsiblePanel extends  BaseHTMLComponentWithEvent {
  _selector = ".collapsible-panel";
  
  constructor() {
    super();
    this.registerId();
    this.eventInfo = this.retrieveEventInfo();
  }

  render(){
      // Attach a shadow DOM
      const shadow = this.attachShadow({ mode: 'open' });

      // Create a template for the collapsible panel
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
      shadow.appendChild(template.content.cloneNode(true));

      // Add event listener for toggling the panel
      const panel = shadow.querySelector('.collapsible-panel');
      const header = shadow.querySelector('.panel-header');
      header.addEventListener('click', () => {
          panel.classList.toggle('collapsed');
      });
  }

  // Method to set the header text dynamically
  setHeaderText(headerText) {
      const shadow = this.shadowRoot;
      shadow.querySelector('h4').textContent = headerText;
  }

  static panelize(panels,panelName){
    const rightPanelContainer = document.getElementById(panelName);//'rightPanelContainer-wrapper1');
    panels.forEach(panelConfig => {
        const panel = document.createElement('collapsible-panel');
        panel.setAttribute('id', panelConfig.id);
        panel.innerHTML = panelConfig.content;
        panel.setHeaderText(panelConfig.headerText);
        rightPanelContainer.appendChild(panel);
    });
    
  }
  static populateAllNodesSelect() {
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
      CollapsiblePanel.populateAllNodesSelect();
      CollapsiblePanel.panelFolding();
          // ノード追加・削除時にドロップダウンを更新
      cy.on('add', 'node', CollapsiblePanel.populateAllNodesSelect);
      cy.on('remove', 'node',CollapsiblePanel.populateAllNodesSelect);
  }

}
// Define the custom element


export { CollapsiblePanel };
