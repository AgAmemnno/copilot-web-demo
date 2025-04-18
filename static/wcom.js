/*
import { AnimationComponent } from './AnimationComponent.js';
import { ButtonComponent } from './ButtonComponent.js';
import { FormComponent } from './FormComponent.js';

import { InputComponent } from './InputComponent.js';
import { ModalComponent } from './ModalComponent.js';
import { CollapsiblePanel } from './PanelComponent.js';
import { PromptComponent } from './PromptComponent.js';
import { SelectorComponent } from './SelectorComponent.js';

const components = {
    AnimationComponent,
    BaseHTMLComponent,
    BaseHTMLComponentWithEvent,
    ButtonComponent,
    FormComponent,
    GoogleDriveManager,
    InputComponent,
    ModalComponent,
    CollapsiblePanel,
    PromptComponent,
    SelectorComponent,
    VirtualTextareaComponent
};

*/
import { VirtualTextareaComponent } from './components/VirtualTextareaComponent.js';
import { VirtualKeyboardComponent } from './components/VirtualKeyboardComponent.js';
import { PopoverMenuComponent } from './components/PopoverMenuComponent.js';
import { AnimMenuComponent } from './components/AnimMenuComponent.js';
import { CollapsiblePanel } from './components/PanelComponent.js';
import { ButtonComponent } from './components/ButtonComponent.js';
import { GoogleDriveManager } from './components/GoogleDriver.js';
customElements.define('virtual-textarea-component', VirtualTextareaComponent);
customElements.define('virtual-keyboard-component',VirtualKeyboardComponent);
customElements.define('popover-menu-component',PopoverMenuComponent);
customElements.define('anim-menu-component',AnimMenuComponent);

customElements.define('collapsible-panel', CollapsiblePanel);
customElements.define('button-component', ButtonComponent);
const wcomponents = {
    VirtualTextareaComponent,
    VirtualKeyboardComponent,
    PopoverMenuComponent,
    AnimMenuComponent,
    CollapsiblePanel,
    ButtonComponent,
    GoogleDriveManager,
};

Object.keys(wcomponents).forEach(key => {
    eval(`window.${key} = ${key}`);
});


/**
 * 指定されたタグ名の要素を作成し、追加の処理を行うファクトリ関数（推奨される代替案）
 * @param {string} tagName - 作成する要素のタグ名
 * @param {object} [options] - document.createElementの第二引数オプション (例: { is: 'custom-tag' })
 * @returns {HTMLElement} 生成され、拡張された要素
 */
function createElement(tagName, options) {
    const element = document.createElement(tagName, options);
    element.ishadow();
    return element;
}

window.createElement = createElement;
