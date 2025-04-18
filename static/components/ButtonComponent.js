import BaseHTMLComponentWithEvent from './base/BaseHTMLComponentWithEvent.js';

class ButtonComponent extends  BaseHTMLComponentWithEvent {
  _selector = "button";
  constructor() {
      super();
      this._selector = "button";
  }
  ishadow(id,label){
      this.id = id;
      this.registerId();
      this.eventInfo = this.retrieveEventInfo();
      const template = document.createElement('template');
      template.innerHTML = `
      <style>
          button {
              background-color: #6200ea;
              color: white;
              border: none;
              padding: 10px 20px;
              text-align: center;
              text-decoration: none;
              display: inline-block;
              font-size: 16px;
              margin: 4px 2px;
              cursor: pointer;
              border-radius: 4px;
          }
      </style>
      <button id=${id}>${label}</button>
      `;
      this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  static buttonize(btnProps){
    Object.entries(btnProps).forEach( ([key,Props]) => {
      let statusDiv = document.getElementById(key);
      Props.forEach(props => {
              const btn  = document.createElement('button-component');
              btn.ishadow(props[0],props[1]);  
              if(props.length > 2){
                  for (const [eventName, eventHandler] of Object.entries(props[2])) {
                    if ((typeof eventHandler === 'object') && eventHandler !== null){
                      for (const [eventName2, eventHandler2] of Object.entries(eventHandler)) {
                        if(eventName2 === "proxy"){
                          btn.addEventListener(eventName, eventHandler2(btn));
                        }else{
                          //statusDiv.addEventListener(eventName2, eventHandler2);
                          /*
                          document.body.addEventListener('addnode', (event) => {
                            console.log('body で addnode イベントを捕捉しました。');
                            console.log('イベントターゲット:', event.target); // 通常は Shadow Host (カスタム要素自身)
                            console.log('イベント詳細データ:', event.detail); // カスタムイベントに含めたデータ
                            // ここで Cytoscape.js の処理などを実行
                            //cy.add(event.detail.nodedata);
                          });
                          */
                        }
                      }
                    }else{
                      btn.addEventListener(eventName, eventHandler);
                    }
                  }
              };
              statusDiv.parentNode.insertBefore(btn, statusDiv.nextSibling);
              statusDiv = btn;
      });
     });
  } 
}


export { ButtonComponent };
