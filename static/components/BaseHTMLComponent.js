class BaseHTMLlement extends HTMLElement {
    constructor() {
      super(); // ★ 派生クラスの constructor では最初に必ず super() を呼び出す
      this.attachShadow({ mode: 'open' });
      this._selecotr ="";
    }

    getId(name){
        return this.shadowRoot.getElementById(name);
    }
    
    query() {
      return this.shadowRoot.querySelector(this._selecotr);
    }


  }