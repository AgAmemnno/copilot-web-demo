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
      
.circle-outer {
    position: absolute; /* 親要素を基準に配置 */
    top: 0;
    left: 0;
    display: flex; /* Flexコンテナにする */
    justify-content: center; /* 子要素を主軸（デフォルトは横）で中央揃え */
    align-items: center; /* 子要素を交差軸（デフォルトは縦）で中央揃え */
    min-height: 100vh; /* bodyの高さをビューポートの高さの100%にする */
    min-width: 100vw;
    margin: 0; /* bodyのデフォルトマージンをリセット */
    transform:scale(0);
}
 .circle-svg{
      position: absolute; /* 親要素を基準に配置 */
      top: 10vh;
      left: 10vw;
      width: 80vw;
      height: 80vh;
      border-radius: 34%;
      background-color: #d2691e1f;
  }
  
 .html-content {
    position: absolute;
    top: 10vh;
    left: 10vw;
    width: 80vw;
    height: 80vh;
    z-index: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 20px;
    box-sizing: border-box;
    gap: 2px;
  }
  
.input-group,
.select-group {
    width: 100%;
    display: grid; /* Gridコンテナにする */
    /* 列（カラム）のテンプレートを定義：ラベル用の固定幅と、フォーム要素用の残りのスペース */
    grid-template-columns: 20% 80%; /* 左から 90px幅の1列目、残りの幅 (1fr) の2列目 */
    gap: 10px; /* カラム間の隙間（横方向） */
    align-items: center; /* グリッドセル内で子要素を縦方向（交差軸）の中央揃え */
}
    
    /* 円内のフォーム要素の共通スタイル */
    
    .circle-label,
    .circle-input,
    .circle-select {
        /* 親コンテナ（円）の幅に収まるように調整 */
       
        box-sizing: border-box; /* paddingやborderを幅計算に含める */
        padding: 8px; /* 内側の余白 */
        margin: 0; /* デフォルトのマージンをリセット */
        text-align: center; /* テキストを中央揃え */
        border: 5px solid #bdc3c738;
        border-radius: 15px;
        background-color: #d2691e82;
        font-size: 1rem;
    }
    
    /* ラベルのスタイル（必要に応じて調整） */
    .circle-label {
        display: block; /* Flexアイテムなので block のように振る舞うが、明示的に指定することも */
        text-align: center; /* テキストを中央揃え */
        color: #000000;
        margin-bottom: 0px; /* 入力要素との間に少しスペース */
       
    }
    
    /* セレクトボックスのスタイル（必要に応じて矢印などをカスタムしたい場合は追加） */
    .circle-select {
        /* 必要に応じて追加のスタイルを定義 */
    }
    
    /* フォーカス時のスタイル */
    .circle-input:focus,
    .circle-select:focus {
        outline: none; /* デフォルトのアウトラインを消す */
        border-color:rgb(234, 86, 41);
        box-shadow: 0 0 5px rgba(242, 115, 4, 0.5);
    }
    </style>

<div id="alarm-minus" class="circle-outer">

    <img src='/components/svg/alarm-minus.svg' alt="alarm-minus" class="circle-svg">
    <div class="html-content">
      <div class="input-group">
          <label for="myInput" class="circle-label">テキスト入力:</label>
          <input type="text" id="myInput" name="myInput" class="circle-input">
      </div>

      <div class="select-group">
          <label for="mySelect" class="circle-label">オプション選択:</label>
          <select id="mySelect" name="mySelect" class="circle-select">
              <option value="">--選択してください--</option>
              <option value="option1">オプション1</option>
              <option value="option2">オプション2</option>
              <option value="option3">オプション3</option>
          </select>
      </div>
    </div>
</div>

<div id="alarm-top" class="circle-outer">
  <img src='/components/svg/align-top.svg' alt="align-top" class="circle-svg">
</div>

<div id="battery-full" class="circle-outer">
  <img src='/components/svg/battery-full.svg' alt="battery-full" class="circle-svg">
  
</div>

    <nav class="menu">
      <input type="checkbox" href="#" class="menu-open" name="menu-open" id="menu-open" style="opacity:0;" />
      <label class="menu-open-button" for="menu-open">
        <span class="lines line-1"></span>
        <span class="lines line-2"></span>
        <span class="lines line-3"></span>
      </label>

      <a href="#" class="menu-item"> <i class="i-svg icon1"></i> </a>
      <a href="#" class="menu-item"> <i class="i-svg icon2"></i> </a>
      <a href="#" class="menu-item"> <i class="i-svg icon3"></i> </a>
      <a href="#" class="menu-item"> <i class="i-svg icon4"></i> </a>
      <a href="#" class="menu-item"> <i class="i-svg icon5"></i> </a>
      <a href="#" class="menu-item"> <i class="i-svg icon6"></i> </a>
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

  append_battery_full(ele){
    this.shadowRoot.querySelector("#battery-full").appendChild(ele);
  }
  
  static instanciate(parent){
    let selector =  document.createElement('anime-menu-component');
    parent.appendChild(selector);
  }
}
export {AnimMenuComponent};
