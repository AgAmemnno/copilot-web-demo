import BaseHTMLComponentWithEvent from './base/BaseHTMLComponentWithEvent.js';
class PopoverMenuComponent extends  BaseHTMLComponentWithEvent {
  _selector = 'popover-menu-component';
  constructor() {
    super();
  }
  init(){
    this.id = this.generateId();
    //sessionStorage.setItem("test1",this.id);
    this.registerId();
    this.eventInfo = this.retrieveEventInfo();
  }
  ishadow() {
    this.init();

    const template = document.createElement('template');
    template.innerHTML = `
    <style>
      html {
        font-family: sans-serif;
      }

      body [popover] {
        border: 1px solid black;
        width: 120px;
        inset: unset;
      }

      #mainpopover {
        left: 7px;
        top: 38px;
      }

      #subpopover {
        left: 120px;
        top: 86px;
      }

      .listcontainer,
      .subcontainer {
        display: flex;
        flex-direction: column;
      }

      a {
        flex: 1;
        text-decoration: none;
        outline: none;
        text-align: center;
        line-height: 3;
        color: black;
      }

      a:link,
      a:visited {
        background: palegoldenrod;
        color: black;
      }

      a:hover,
      a:focus {
        background: orange;
      }

      a:active {
        background: darkred;
        color: white;
      }
    </style>
    <button popovertarget="mainpopover" popovertargetaction="toggle">
      Menu
    </button>
    <div id="mainpopover" popover>
      <nav class="listcontainer">
        <a href="#">Home</a>
        <div class="subcontainer" tabindex="0">
          <a href="#">Pizza <strong>></strong></a>
          <div id="subpopover" popover>
            <div class="listcontainer">
              <a href="#">Margherita</a>
              <a href="#">Pepperoni</a>
              <a href="#">Ham & Shroom</a>
              <a href="#">Vegan</a>
            </div>
          </div>
        </div>
        <a href="#">Music</a>
        <a href="#">Wombats</a>
        <a href="#">Finland</a>
      </nav>
    </div>
    <div id="tooltip-1" class="tooltip" popover="hint">Tooltip A</div>
    <div id="tooltip-2" class="tooltip" popover="hint">Tooltip B</div>
    <div id="tooltip-3" class="tooltip" popover="hint">Tooltip C</div>
    `;

    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.selector = this.shadowRoot.querySelector(`.${this._selector }`);
  }
  connectedCallback() {
    
    const subcontainer = this.shadowRoot.querySelector(".subcontainer");
    const mainpopover = this.shadowRoot.getElementById("mainpopover");
    const subpopover = this.shadowRoot.getElementById("subpopover");
    
    // Events to show/hide the subpopover when the mouse moves over and out
    subcontainer.addEventListener("mouseover", () => {
      subpopover.showPopover();
    });
    
    subcontainer.addEventListener("mouseout", () => {
      if (subpopover.matches(":popover-open")) {
        subpopover.hidePopover();
      }
    });
    
    // Event to make the subpopover keyboard-accessible
    subcontainer.addEventListener("focusin", () => {
      subpopover.showPopover();
    });
    
    // Events to hide the popover menus when an option is selected in either of them
    mainpopover.addEventListener("click", () => {
      if (subpopover.matches(":popover-open")) {
        subpopover.hidePopover();
      }
    
      if (mainpopover.matches(":popover-open")) {
        mainpopover.hidePopover();
      }
    });
    
    subpopover.addEventListener("click", () => {
      subpopover.hidePopover();
      mainpopover.hidePopover();
    });
    
    
  }


  static instanciate(parent){
    let selector =  document.createElement('popover-menu-component');
    parent.appendChild(selector);
  }
}
export {PopoverMenuComponent};
