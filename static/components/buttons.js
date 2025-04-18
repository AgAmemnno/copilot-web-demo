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


const btnProps =
{ 
  'status':[
      ['loadDataButton', 'LoadData',
      {
        'click': async () => {
            window.driveManager = new GoogleDriveManager();
            if (!(driveManager.gapiInited && driveManager.gisInited)) {
                await driveManager.initializeGapi();
            }else{
              driveManager.accessCert();
            }
        },
        'change': () => {
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
        }
      }
      ],
      ['getButton', 'Get', {'click':sendGetRequest}],
      ['postButton', 'Post',{'click':sendPostRequest}]
   ],
  'documentOptions':[["addDocumentNodeButton","Documentノード追加",
    {'click': { 
      "proxy" : (self) =>{
                   return () =>
                  {
                      let nodeCounter = sessionStorage.getItem("nodeCounter");
                      if(nodeCounter == null){
                          nodeCounter = 0;
                      }
                      const nodeClass = 'document'; // 固定
                      const label = nodeLabelInput.value || `${nodeClass} ${nodeCounter}`;
                      const id = `doc_${nodeCounter}`; // IDプレフィックス変更
                      nodeCounter++;
                      sessionStorage.setItem("nodeCounter",nodeCounter);
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
                              //clonemarker: "false",
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
                      /*
                      const addNodeEvent = new CustomEvent('addnode', {
                        bubbles: true,
                        composed: true,
                        detail: {
                            nodedata :newNodeData
                        }
                      });
                    
                      // カスタム要素自身 (Shadow Host) からイベントを発火
                      self.dispatchEvent(addNodeEvent);
                      */
                      cy.add(newNodeData);
                      //console.log('Added node:', newNodeData);
                      nodeLabelInput.value = ''; // ラベル入力欄をクリア
                    } 
                },
       "addnode" : (event) => {
                  cy.add(event.detail.nodedata); 
                  }
      }}
    ]],  

  'edgeClassSelect' :[["addEdgeButton","関連付け実行",
    {'click'  :() => 
      {
          const processType = processTypeSelectForEdge.value; // 選択されたプロセスタイプを取得
          const edgeClass = edgeClassSelect.value;
          const selectedAgent = agentSelectForEdge.value;
          const inputNodeBtn  = document.getElementById("addInputNodeButton")
          const outputNodeBtn = document.getElementById("addOutputNodeButton")
          const selectedInputNodes = JSON.parse(inputNodeBtn.dataset.selectedNodes);
          const selectedOutputNodes = JSON.parse(outputNodeBtn.dataset.selectedNodes);
          
          console.log('--- Add Edge/Process Request ---');
          console.log('Input Nodes:', selectedInputNodes);
          console.log('Output Nodes:', selectedOutputNodes);
          console.log('Process Type:', processType);
          console.log('Edge Class (Doc<->Proc):', edgeClass);
          
          if (selectedInputNodes.length === 0 || selectedOutputNodes.length === 0) {
              alert('入力ノードと出力ノードをそれぞれ1つ以上選択してください。');
              return;
          }
          
          let agentCounter = sessionStorage.getItem("agentCounter");
          if(agentCounter == null){
              agentCounter = 0;
          }
          let edgeCounter = sessionStorage.getItem("edgeCounter");
          let processCounter = sessionStorage.getItem("processCounter");
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
   
          updateNodeListDisplay(inputNodeListDiv, []);
          updateNodeListDisplay(outputNodeListDiv, []);
          allNodesSelect.value = "";
          processTypeSelectForEdge.value = "general"; // デフォルトに戻す
          edgeClassSelect.value = "production"; // デフォルトに戻す
  
           sessionStorage.setItem("agentCounter",agentCounter);
           sessionStorage.setItem("edgeCounter",edgeCounter);
           sessionStorage.setItem("processCounter",processCounter);
           inputNodeBtn.dataset.selectedNodes = JSON.stringify([]);
           outputNodeBtn.dataset.selectedNodes = JSON.stringify([]);
  }
    }]],
  'others-controls':[["deleteSelected","選択要素削除",{'click':() => 
                      {
                          const selectedElements = cy.$(':selected');
                          if (!selectedElements.empty()) {
                              cy.remove(selectedElements);
                          } else {
                              alert('削除する要素を選択してください。');
                          }
                      }
                  }],["layoutButton","レイアウト実行",{'click':() =>{
                          const layout = cy.layout({ name: 'preset' }); // とりあえず preset
                          layout.run();
                  }}]],
  'allNodesSelect':[["addInputNodeButton","入力に追加",{'click': (event) => {
                          const target  = event.target;
                          let   selectedInputNodes = [];
                          if(Object.prototype.hasOwnProperty.call(target.dataset, 'selectedNodes')){
                             selectedInputNodes = JSON.parse(target.dataset.selectedNodes);
                          }
                          const inputNodeListDiv = document.getElementById('inputNodeList');
                          const selectedNodeId = allNodesSelect.value;
                          if (selectedNodeId && !selectedInputNodes.includes(selectedNodeId)) {
                              // NOT IMPLEMENTED: ノードタイプによる入力制限チェック (例: Agentは入力になれないなど)
                              selectedInputNodes.push(selectedNodeId);
                              updateNodeListDisplay(inputNodeListDiv, selectedInputNodes);
                          }
                          target.dataset.selectedNodes = JSON.stringify(selectedInputNodes);
                  }}],["addOutputNodeButton","出力に追加",{'click': () => {
                          const selectedNodeId = allNodesSelect.value;
                          const target  = event.target;
                          let   selectedOutputNodes = [];
                          if(Object.prototype.hasOwnProperty.call(target.dataset, 'selectedNodes')){
                             selectedOutputNodes = JSON.parse(target.dataset.selectedNodes);
                          }
                          const outputNodeListDiv = document.getElementById('outputNodeList');
                          if (selectedNodeId && !selectedOutputNodes.includes(selectedNodeId)) {
                              // NOT IMPLEMENTED: ノードタイプによる出力制限チェック
                              selectedOutputNodes.push(selectedNodeId);
                              updateNodeListDisplay(outputNodeListDiv, selectedOutputNodes);
                          }
                          target.dataset.selectedNodes = JSON.stringify(selectedOutputNodes);
                  }}]],
}

export {btnProps};