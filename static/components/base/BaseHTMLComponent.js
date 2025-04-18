export default class BaseHTMLComponent extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
    }

    getId(name){
        return this.shadowRoot.getElementById(name);
    }
    
    query() {
      return this.shadowRoot.querySelector(this._selector);
    }
    connectedCallback(){}
    disconnectedCallback(){}
    adoptedCallback(){}
    attributeChangedCallback(name, oldValue, newValue){}
}

