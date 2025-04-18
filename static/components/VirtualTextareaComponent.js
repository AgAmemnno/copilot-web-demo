import BaseHTMLComponent from './base/BaseHTMLComponent.js';
import BaseHTMLComponentWithEvent from './base/BaseHTMLComponentWithEvent.js';

const ShadowStyle = `
textarea {
-webkit-text-size-adjust: 100%;
-webkit-tap-highlight-color: rgba(0,0,0,0);
box-sizing: border-box;
font: inherit;
margin: 0;
overflow: auto;
line-height: inherit;
font-family: Verdana,Tahoma,Segoe,sans-serif;
font-size: 14px;
width: 260px;
padding: 5px 0;
border: 1px solid #666;
background: #000 url("images/ui-bg_inset-soft_25_000000_1x100.png") 50% bottom repeat-x;
color: #fff;
border-top-left-radius: 6px;
border-top-right-radius: 6px;
border-bottom-left-radius: 6px;
border-bottom-right-radius: 6px;
text-align: left;
box-shadow: 0 0 5px #4d90fe;
}
`;

class VirtualTextareaComponent extends  BaseHTMLComponentWithEvent {
  _selector = 'virtual-textarea-component';
  constructor() {
    super();
  }
  init(){
    this.id = this.generateId();
    this.registerId();
    this.eventInfo = this.retrieveEventInfo();
  }
  ishadow() {
    this.init();
    this.shadowRoot.innerHTML = `
      <style>
      ${ShadowStyle}
      .block {
        -webkit-text-size-adjust: 100%;
        -webkit-tap-highlight-color: rgba(0,0,0,0);
        line-height: 1.42857143;
        color: #ddd;
        box-sizing: border-box;
        font-family: Verdana,Tahoma,Segoe,sans-serif;
        font-size: 14px;
        width: 270px;
        display: inline-block;
        min-height: 180px;
        margin: 15px;
        padding-bottom: 30px;
        text-align: center;
        vertical-align: top;
        position: relative;
      }
      </style>
      <div class="block">
          <h2>
            <span class="tooltip-tipsy" original-title="Click, then scroll down to see this code">Custom: Mapped Keys</span>
          </h2>
          <textarea class="${this._selector }" id="map" aria-haspopup="true" role="textbox"></textarea>
          <br>
          <small>
            * No preview window.<br>
            * Type in a-g.<br>
            * Type in A-G (shifted).<br>
          </small>
      </div>
    `;
    this.selector = this.shadowRoot.querySelector(`.${this._selector }`);
  }

  static instanciate(parent){
    let selector =  document.createElement('virtual-textarea-component');
    parent.appendChild(selector);
  }
}

export { VirtualTextareaComponent };

