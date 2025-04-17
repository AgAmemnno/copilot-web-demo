import BaseHTMLComponentWithEvent from './base/BaseHTMLComponentWithEvent.js';
class AnimMenuComponent extends  BaseHTMLComponentWithEvent {
  _selector = 'anime-menu-component';
  constructor() {
    super();
  }
  init(){
    this.id = this.generateId();
    sessionStorage.setItem("test2",this.id);
    this.registerId();
    this.eventInfo = this.retrieveEventInfo();
  }
  ishadow() {
    this.init();
    const template = document.createElement('template');
    template.innerHTML = `
    <link rel="stylesheet" href="/components/css/anim_menu.css"/>
    <style>
      .i-svg {
        /* --- 基本スタイル --- */
        display: inline-block;
        width: 24px;
        height: 24px;
        background-repeat: no-repeat;
        background-size: contain;
        background-position: center;
        vertical-align: middle;
        background-image: var(--icon-url); /* CSS変数で画像URLを指定 */

        &.icon1 {
          --icon-url: url('/components/svg/alarm-minus.svg');
        }

        &.icon2 {
          --icon-url: url('/components/svg/align-top.svg');
        }

        &.icon3 {
          --icon-url: url('/components/svg/battery-full.svg');
        }

        &.icon4 {
          --icon-url: url('/components/svg/chat-teardrop-text.svg');
        }

        &.icon5 {
          --icon-url: url('/components/svg/drone.svg');
        }

        &.icon6 {
          --icon-url: url('/components/svg/lightning.svg');
        }
      }
    </style>
    <nav class="menu">
      <input type="checkbox" href="#" class="menu-open" name="menu-open" id="menu-open" style="opacity:0;" />
      <label class="menu-open-button" for="menu-open">
        <span class="lines line-1"></span>
        <span class="lines line-2"></span>
        <span class="lines line-3"></span>
      </label>

      <a href="#" class="menu-item blue"> <i class="i-svg icon1"></i> </a>
      <a href="#" class="menu-item green"> <i class="i-svg icon2"></i> </a>
      <a href="#" class="menu-item red"> <i class="i-svg icon3"></i> </a>
      <a href="#" class="menu-item purple"> <i class="i-svg icon4"></i> </a>
      <a href="#" class="menu-item orange"> <i class="i-svg icon5"></i> </a>
      <a href="#" class="menu-item lightblue"> <i class="i-svg icon6"></i> </a>
    </nav>
    `;
  
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.selector = this.shadowRoot.querySelector(`.${this._selector }`);
  }
  connectedCallback() {
    const scriptElem = document.createElement('script');
    scriptElem.type = 'module';
    scriptElem.src = '/components/script/anime_menu.js';
    this.shadowRoot.appendChild(scriptElem);
  }


  static instanciate(parent){
    let selector =  document.createElement('anime-menu-component');
    parent.appendChild(selector);
  }
}
export {AnimMenuComponent};
