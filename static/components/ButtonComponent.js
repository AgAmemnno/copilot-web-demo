import BaseHTMLComponentWithEvent from './base/BaseHTMLComponentWithEvent.js';

class ButtonComponent extends  BaseHTMLComponentWithEvent {
  _selector = "button";
  constructor() {
      super();
      this.registerId();
      this.eventInfo = this.retrieveEventInfo();
  }
  render(id,label){
      this.id = id;
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
      this.shadow.appendChild(template.content.cloneNode(true));
  }

  static buttonize(btnProps){
    Object.entries(btnProps).forEach( ([key,Props]) => {
      let statusDiv = document.getElementById(key);
      Props.forEach(props => {
              const btn  = document.createElement('button-comp');
              btn.render(props[0],props[1]);  
              if(props.length > 2){
                  for (const [eventName, eventHandler] of Object.entries(props[2])) {
                    btn.addEventListener(eventName, eventHandler);
                  }
              };
              statusDiv.parentNode.insertBefore(btn, statusDiv.nextSibling);
              statusDiv = btn;
      });
     });
  } 
}


export { ButtonComponent };
