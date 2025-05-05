import BaseHTMLComponentWithEvent from './base/BaseHTMLComponentWithEvent.js';
import $ from 'jquery';
class VirtualKeyboardComponent extends  BaseHTMLComponentWithEvent {
  _selector = 'virtual-keyboard-component';
  externalCB = (f) =>{};
  constructor() {
    super();
  }
  init(){
    this.id = this.generateId();
    sessionStorage.setItem("test1",this.id);
    this.registerId();
    this.eventInfo = this.retrieveEventInfo();
  }
  ishadow1() {
    this.init();
    this.shadowRoot.innerHTML = `
  <style>
    /* --- Basic Container Styles --- */
    #wrap {
      position: absolute; top: 10vh; left: 10vw; width: 80vw; height: 80vh;
      z-index: 1; display: flex; flex-direction: column; justify-content: center;
      align-items: center; padding: 20px; box-sizing: border-box; gap: 2px;
      pointer-events: none;
    }
    #keyboard, #icon { pointer-events: auto; }
    #keyboard{
      width: 80vw; height: 5vh; padding: 5px 10px; border: 1px solid #555;
      background-color: #333; color: #eee; border-radius: 4px;
      box-sizing: border-box; font-size: 1.1em;
    }
    #icon { cursor: pointer; }

    /* --- Keyboard Container (.ui-keyboard) --- */
    /* Using the class name from keyboard.js css.container option */
    /* .ui-keyboard.ui-widget-content.ui-widget */ /* More specific based on config */
    .ui-keyboard { /* Keep it simple for now */
      position: absolute !important; z-index: 1000; padding: 5px;
      background-color: #111; border: 1px solid #000; border-radius: 4px;
      text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.5);
      font-family: Arial, sans-serif; font-size: 16px; color: #d9d9d9;
      -ms-touch-action: manipulation; touch-action: manipulation;
    }
    /* --- Focus state for keyboard container --- */
    /* .ui-keyboard.keyboard-focused */ /* Using custom class added via JS */
    .ui-keyboard.keyboard-focused {
        border: 1px solid white;
    }

    /* --- Preview Input --- */
    .ui-keyboard-preview-wrapper { padding: 0 0 5px 0; }
    /* Using the class name from keyboard.js css.input option */
    input.ui-keyboard-preview.ui-widget-content {
        width: 98%; padding: 5px; margin: 0 auto; box-sizing: border-box;
        border: 1px solid #444; background-color: #222; color: #eee;
        border-radius: 3px; text-align: left;
    }

    /* --- Keyset (Rows of keys) --- */
    .ui-keyboard-keyset { text-align: center; white-space: nowrap; font-size: 1em; }

    /* --- Individual Buttons --- */
    /* Base style for all buttons */
    .ui-keyboard-button {
        height: 2.5em; min-width: 2.5em; margin: 2px; padding: 0 5px;
        box-sizing: border-box; border-radius: 4px;
        line-height: 2.5em; text-align: center; vertical-align: middle;
        cursor: pointer; overflow: hidden; user-select: none;
        -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none;
        transition: background-color 0.1s ease-in-out, border-color 0.1s ease-in-out;
        font-weight: bold; /* Common style */
        color: #ffffff; /* Common style */
    }

    /* --- Default State Button Style --- */
    /* Using the class name from keyboard.js css.buttonDefault option */
    .ui-keyboard-button.ui-state-default {
        border: 1px solid #333;
        background: linear-gradient(to bottom, #404040, #333333); /* Dark grey gradient */
        /* color: #ffffff; */ /* Moved to base .ui-keyboard-button */
        /* font-weight: bold; */ /* Moved to base .ui-keyboard-button */
    }

    /* --- Hover State Button Style --- */
    /* Using the class name from keyboard.js css.buttonHover option */
    .ui-keyboard-button.ui-state-hover {
        border-color: #557799; /* Blueish border */
        background: linear-gradient(to bottom, #4a6a8a, #3a5a7a); /* Blueish gradient */
    }

    /* --- Active/Action State Button Style --- */
    /* Using the class names from keyboard.js css.buttonActive and css.buttonAction options */
    .ui-keyboard-button.ui-state-active {
        border-color: #111;
        background: #222; /* Darker background when pressed/active */
    }

    /* --- Disabled State Button Style --- */
    /* Using the class name from keyboard.js css.buttonDisabled option */
    .ui-keyboard-button.ui-state-disabled {
        opacity: 0.5;
        cursor: default;
        border-color: #555;
        background: #555;
    }

    /* --- Special Keys --- */
    .ui-keyboard-widekey { min-width: 4em; }
    .ui-keyboard-space { min-width: 15em; }
    .ui-keyboard-actionkey .ui-keyboard-text { /* Style action key text if needed */ }

    /* --- Row Break --- */
    .ui-keyboard-button-endrow { clear: both; display: block; height: 0; margin: 0; padding: 0; }

    /* --- Text inside buttons --- */
    .ui-keyboard-text { display: inline-block; white-space: pre; }

  </style>
  <div id="wrap">
    <input id="keyboard" type="text" class="ui-keyboard-input ui-widget-content ui-corner-all" aria-haspopup="true" role="textbox">
    <!-- img id="icon" src="https://mottie.github.io/Keyboard/docs/css/images/keyboard.png" alt="Keyboard icon" -->
  </div>
    `;
    this.selector = this.shadowRoot.querySelector(`.${this._selector }`);
    //this.bind();
  }

  ishadow() {
    this.init();
    this.shadowRoot.innerHTML = `

  <link rel="stylesheet" type="text/css" href="https://mottie.github.io/Keyboard/css/keyboard.css" >
  <link rel="stylesheet" type="text/css" href="https://code.jquery.com/ui/1.11.4/themes/dot-luv/jquery-ui.css">
  <style>
    #wrap {
      position: fixed;
      top: 50vh;
      left: 50vw;
      width: 0vw;
      height: 0vh;
      z-index: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 20px;
      box-sizing: border-box;
      gap: 2px;
    }
    #icon{
    position: fixed;
    top: 3%;
    left: 3%;
    transform: scale(1.5);
    
    }
    #keyboard{
      width: 0vw;
      height: 0vh;
      display:none;
    }
    /* --- Keyboard Container (.ui-keyboard) --- */
    .ui-keyboard {
      position: absolute !important; z-index: 1000; padding: 5px;
      background-color: #111; border: 1px solid #000; border-radius: 4px;
      text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.5);
      font-family: Arial, sans-serif; font-size: 16px; color: #d9d9d9;
      -ms-touch-action: manipulation; touch-action: manipulation;

      pointer-events: auto;
      backdrop-filter: blur(5px);
      -webkit-backdrop-filter: blur(5px);
      background-color: #1a1a1a;
      border-width: 11px;
      border-style: double;
      border-top-color: #2a2a2a;
      border-left-color: #2a2a2a;
      border-bottom-color: #3a3a3a;
      border-right-color: #3a3a3a;
      border-radius: 100px;
      box-shadow: inset 0 2px 336px rgba(0, 0, 0, 0.7), 0 1px 0px rgba(255, 255, 255, 0.9);

        background-color: #0a0a10; /* Dark blue/black base */

   
    }
    /* --- Focus state for keyboard container --- */
    .ui-keyboard.keyboard-focused {
        border: 1px solid white;
    }

    /* --- Preview Input --- */
     input:focus-visible{
       outline :none;
     }
    input.ui-keyboard-preview.ui-widget-content
     {
        font-family: "Special Elite", system-ui;
        font-weight: 600;
        font-style: normal;
        font-size: 1.4rem;
        position: relative;
        width: 75%;
        height: 73px;
        padding: 9px;
        margin: 21px 0px 0px 0px;
        box-sizing: border-box;
        border: 5px;
        border-style: dotted;
        background-color: #0c0b0bde;
        color: #000000;
        border-radius: 0%;
        text-align: left;
    }
    /* --- Keyset (Rows of keys) --- */
    .ui-keyboard-keyset { 
    margin: 37px 2px 37px 2px;
    padding: 22px;
      text-align: center; white-space: nowrap; font-size: 1em; 
    }

    .ui-keyboard-keyset-normal {
        border-radius: 55px;
        box-sizing: border-box;
        background-color: #434343;
        margin:  27px;
        padding: 15px 10px 45px 9px;
        box-shadow: inset 5px 19px 34px rgb(0 0 0 / 76%), inset -9px -6px 20px rgba(255, 255, 255, 0.8);
    }

    .ui-keyboard-keyset-shift {
        border-radius: 55px;
        box-sizing: border-box;
        background-color: #222222;
        margin:  27px;
        padding: 15px 10px 45px 9px;
        box-shadow: inset 5px 19px 34px rgb(0 0 0 / 76%), inset -9px -6px 20px rgba(255, 255, 255, 0.8);
    }
    /* --- Individual Buttons --- */
    .ui-keyboard-button {
        margin: 6px;
        padding: 0 17px;
        height: 2.5em; min-width: 2.5em; margin: 2px; padding: 0 5px;
        box-sizing: border-box; border-radius: 4px;
        line-height: 2.5em; text-align: center; vertical-align: middle;
        cursor: pointer; overflow: hidden; user-select: none;
        -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none;
        transition: background-color 0.1s ease-in-out, border-color 0.1s ease-in-out, box-shadow 0.2s ease-out; /* Added box-shadow transition */
        font-weight: bold; 
        color: #ffffff;
        pointer-events: auto;
        /* Remove default border, use box-shadow for effect */
        border: none;
        /* Add base box-shadow for depth */
        box-shadow: 0 1px 3px rgba(0,0,0,0.5);


    }

    /* --- Default State Button Style --- */
    .ui-keyboard-button.ui-state-default {
        position: relative;
        top: 24px;
        padding: 0 18px;
        margin: 5px;
        border-radius: 40%;
        border-style: outset;
        border-width: thin;
        background: linear-gradient(to bottom, #242424, #4f4f4f05);
    }

    /* --- Hover State Button Style --- */
    .ui-keyboard-button.ui-state-hover {
        background: linear-gradient(to bottom, #3d3f3d, #070807);
        /* --- Neon Glow Effect (Hover) --- */
        box-shadow: 0 1px 50px rgb(50 56 56);
    }
    button.ui-keyboard-accept.ui-keyboard-valid-input
     {
        border-color: #9C27B0;
        background: #E91E63;
        color: #fff;
    }

    
    /* --- Active/Action State Button Style --- */
    .ui-keyboard-button.ui-state-active {
        background: #222;
        animation: neon-blink 1.5s infinite ease-in-out;
    }


     @keyframes neon-blink {
        0%, 100% { /* Start and end state (brighter) */
            box-shadow: 
            0px 1px 14px 13px rgb(255 0 126 / 34%), 
            -3px -6px 20px 10px rgb(58 0 255 / 92%);
        }
        50% { /* Mid state (dimmer) */
            box-shadow: 
            0px 1px 14px 1px rgb(255 0 126 / 34%), 
            0px 0px 20px 0px rgb(58 0 255 / 92%);
        }
    }
   

    /* --- Disabled State Button Style --- */
    .ui-keyboard-button.ui-state-disabled {
        opacity: 0.5; cursor: default;
        background: #555;
        box-shadow: 0 1px 2px rgba(0,0,0,0.4); /* Simpler shadow for disabled */
    }

    /* --- Special Keys --- */
    .ui-keyboard-widekey { min-width: 4em; }
    .ui-keyboard-space { min-width: 15em; }
    .ui-keyboard-actionkey .ui-keyboard-text { /* Style action key text if needed */ }

    /* --- Row Break --- */
    .ui-keyboard-button-endrow { clear: both; display: block; height: 0; margin: 0; padding: 0; }

    /* --- Text inside buttons --- */
    .ui-keyboard-text { 
        display: inline-block; 
        white-space: pre; 
        pointer-events: none;
        font-family: "Special Elite", system-ui;
        font-weight: 600;
        font-style: normal;
        font-size: 1.4rem;
        color: black;
    }
    /* --- Help Modal Styles --- */
    #help-modal {
        position: fixed;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 100%;
        height: 75%;
        max-width: 100vw;
        background-color: rgb(0 0 0 / 42%);
        color: #3f3f3f;
        border: 1px solid #555;
        border-radius: 5px;
        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.7);
        padding: 30px;
        z-index: 2000;
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(3px);
          font-family: "Dela Gothic One", sans-serif;
          font-weight: 400;
          font-style: normal;
        display: none;
        opacity: 0;
        transition: opacity 1.3s ease-in-out;
    }
    #help-modal.visible {
        display: block;
        opacity: 1;
    }
    .modal-content h2 {
        margin-top: 0;
        color: #e91e63;
        text-align: center;
        border-bottom: 6px solid #cb1ee966;
        padding-bottom: 25px;
        margin-bottom: 45px;
        font-size: 2.4rem;
        font-weight: 100;
    }
    .modal-content p {
        line-height: 1.6;
        text-align: center;
        color: #9b0077;
        font-size: 1.2rem;
    }
    .modal-content ul {
        list-style: decimal;
        margin-left: 10%;
        color: #9b00ff;
        font-size: 1.6rem;
    }
    .close-button {
        position: absolute;
        top: 10px;
        right: 15px;
        background: none;
        border: none;
        color: #aaa;
        font-size: 24px;
        font-weight: bold;
        cursor: pointer;
        padding: 0;
        line-height: 1;
    }
    .close-button:hover {
        color: #fff;
    }
  </style>

  <div id="wrap">
    <input id="keyboard" type="text" class="ui-keyboard-input ui-widget-content ui-corner-all" aria-haspopup="true" role="textbox">
    <img id="icon" src="https://mottie.github.io/Keyboard/docs/css/images/keyboard.png">
  </div>

  
    `;
    this.selector = this.shadowRoot.querySelector(`.${this._selector }`);
    //this.bind();
  }
  connectedCallback() {
    // --- Load the keyboard initialization script ---
    const scriptElem = document.createElement('script');
    scriptElem.type = 'module';
    scriptElem.src = '/components/script/keyboard.js'; // This script should initialize $('#keyboard').keyboard({...})

    // --- Add contextmenu listener AFTER the script is likely loaded and keyboard initialized ---
    // For robustness, ideally keyboard.js should signal when it's done,
    // but we'll attach the listener after appending the script for now.
    scriptElem.onload = () => {
        this.addContextMenuListener();
        console.log("keyboard.js loaded and context menu listener added.");
    };
    scriptElem.onerror = () => {
        console.error("Failed to load keyboard.js");
    };

    this.shadowRoot.appendChild(scriptElem);

    // Fallback in case onload doesn't fire reliably in all scenarios or keyboard.js is very fast
    // setTimeout(() => this.addContextMenuListener(), 500); // Less ideal, but a potential fallback
  }

  disconnectedCallback() {
    // Remove context menu listener
    if (this.boundContextMenuListener) {
      window.removeEventListener('contextmenu', this.boundContextMenuListener);
      console.log("Context menu listener removed from document.");
      this.boundContextMenuListener = null;
    }
    // Clean up modal if it exists
    const existingModal = this.shadowRoot.querySelector('#help-modal');
    if (existingModal) {
        existingModal.remove();
    }
  }
    
  addContextMenuListener() {
    const keyboardInput = this.shadowRoot.querySelector('#keyboard');

    if (keyboardInput) {
        this.boundContextMenuListener = this.handleContextMenu.bind(this, keyboardInput);
        document.addEventListener('contextmenu', this.boundContextMenuListener);
    } else {
        console.error("#keyboard element not found in shadow DOM for context menu listener setup.");
    }
  }
    
　handleContextMenu(keyboardInput, event) {
    event.preventDefault(); // Prevent the default browser context menu
    console.log("Right-click detected on #wrap");

    try {
        const kbInstance = $(keyboardInput).getkeyboard(); // Get the keyboard instance
        if (kbInstance && typeof kbInstance.reveal === 'function') {
           // Check if keyboard is already visible to potentially toggle or just reveal
           if (!kbInstance.isOpen) {
               console.log("Revealing keyboard...");
               kbInstance.reveal(); // Show the keyboard
           } else {
               console.log("Keyboard already open.");
               // Optionally, close it on second right-click: kbInstance.close();
           }
        } else {
            console.error("Could not get keyboard instance or reveal method.");
        }
    } catch (err) {
        console.error("Error accessing keyboard instance:", err);
    }

  
  }
  // --- Method to handle the 'accepted' event ---
  handleKeyboardAccept(finalValue) {
      console.log(`Keyboard accepted value: "${finalValue}"`);
　　　this.externalCB(finalValue);
      // --- Add your switching logic here based on the finalValue ---
      switch (finalValue.toLowerCase()) {
          case 'animate1':
              console.log('Triggering Animation 1...');
              // Call your animation function: triggerAnimation('animationType1');
              break;
          case 'mode_toggle':
              console.log('Toggling mode...');
              // Call your mode toggle function: toggleApplicationMode();
              break;
          case 'reset':
              console.log('Resetting...');
              // Call your reset function: resetScene();
              break;
          case 'help': // Added help case
              console.log('Showing help modal...');
              this.showHelpModal(); // Call the new method
              break;
          default:
              console.log('No specific action defined for this value.');
              // Handle default case or do nothing
      }

      // Optionally clear the input after processing, EXCEPT for help
      if (finalValue.toLowerCase() !== 'help') {
          const keyboardInput = this.shadowRoot.querySelector('#keyboard');
          if (keyboardInput) {
              $(keyboardInput).val(''); // Clear jQuery val
              const kbInstance = $(keyboardInput).getkeyboard();
              if (kbInstance && kbInstance.$preview) {
                  kbInstance.setValue(''); // Use plugin's method if possible
              }
          }
      }
  }
  // --- End handleKeyboardAccept ---

  // --- Method to show the help modal ---
  showHelpModal() {
      // Remove existing modal first to prevent duplicates
      const existingModal = this.shadowRoot.querySelector('#help-modal');
      if (existingModal) {
          existingModal.remove();
      }

      // Create modal elements
      const modal = document.createElement('div');
      modal.id = 'help-modal';

      const modalContent = document.createElement('div');
      modalContent.classList.add('modal-content');

      const closeButton = document.createElement('button');
      closeButton.classList.add('close-button');
      closeButton.innerHTML = '&times;'; // 'x' symbol
      closeButton.onclick = () => {
          modal.classList.remove('visible');
          // Remove after transition ends
          setTimeout(() => modal.remove(), 300);
      };

      const title = document.createElement('h2');
      title.textContent = 'ヘルプ情報';

      const helpText = document.createElement('p');
      helpText.textContent = 'ここにキーボードの操作方法や、入力可能なコマンドの説明などを記述します。';

      const commandList = document.createElement('ul');
      const commands = ['animate1: アニメーション1を開始', 'mode_toggle: モード切り替え', 'reset: リセット', 'help: このヘルプを表示'];
      commands.forEach(cmdText => {
          const li = document.createElement('li');
          li.textContent = cmdText;
          commandList.appendChild(li);
      });

      // Assemble modal
      modalContent.appendChild(closeButton);
      modalContent.appendChild(title);
      modalContent.appendChild(helpText);
      modalContent.appendChild(commandList);
      modal.appendChild(modalContent);

      // Append to shadow DOM
      this.shadowRoot.appendChild(modal);

      // Trigger fade-in effect
      requestAnimationFrame(() => {
          modal.classList.add('visible');
      });
  }
  // --- End showHelpModal ---
  static instanciate(parent){
    let selector =  document.createElement('virtual-keyboard-component');
    parent.appendChild(selector);
  }
}
export {VirtualKeyboardComponent};
