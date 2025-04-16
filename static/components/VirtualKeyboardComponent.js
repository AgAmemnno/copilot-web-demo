import BaseHTMLComponentWithEvent from './base/BaseHTMLComponentWithEvent.js';

/* widget.js, position.js, keycode.js, unique-id.js, widgets/autocomplete.js, widgets/menu.js */



class VirtualKeyboardComponent extends  BaseHTMLComponentWithEvent {
  _selector = 'virtual-keyboard-component';
  constructor() {
    super();
  }
  init(){
    this.id = this.generateId();
    sessionStorage.setItem("test1",this.id);
    this.registerId();
    this.eventInfo = this.retrieveEventInfo();
  }
  ishadow() {
    this.init();
    this.shadowRoot.innerHTML = `
  <link rel="stylesheet" type="text/css" href="https://mottie.github.io/Keyboard/css/keyboard.css" >
  <link rel="stylesheet" type="text/css" href="https://ajax.googleapis.com/ajax/libs/jqueryui/1.8/themes/ui-lightness/jquery-ui.css">

  <div id="wrap">
    <input id="keyboard" type="text" class="ui-keyboard-input ui-widget-content ui-corner-all" aria-haspopup="true" role="textbox">
    <img id="icon" src="https://mottie.github.io/Keyboard/docs/css/images/keyboard.png">
  </div>

  
    `;
    this.selector = this.shadowRoot.querySelector(`.${this._selector }`);
    //this.bind();
  }
  connectedCallback() {
    const shadowRoot = this.shadowRoot; 
    const scriptElem = document.createElement('script');
    scriptElem.type = 'module';
    scriptElem.src = '/components/script/keyboard.js';
    this.shadowRoot.appendChild(scriptElem);
  }


  static instanciate(parent){
    let selector =  document.createElement('virtual-keyboard-component');
    parent.appendChild(selector);
  }
}





export {VirtualKeyboardComponent};

