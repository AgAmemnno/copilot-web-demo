export default class BaseHTMLComponent extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._selecotr ="";
    }

    getId(name){
        return this.shadowRoot.getElementById(name);
    }
    
    query() {
      return this.shadowRoot.querySelector(this._selecotr);
    }
    connectedCallback(){}
    disconnectedCallback(){}
    adoptedCallback(){}
    attributeChangedCallback(name, oldValue, newValue){}
}

