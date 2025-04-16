/*
import { AnimationComponent } from './AnimationComponent.js';
import { BaseHTMLComponent } from './base/BaseHTMLComponent.js';
import BaseHTMLComponentWithEvent from './base/BaseHTMLComponentWithEvent.js';
import { ButtonComponent } from './ButtonComponent.js';
import { FormComponent } from './FormComponent.js';
import { GoogleDriveManager } from './GoogleDriver.js';
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
import { VirtualTextareaComponent } from './VirtualTextareaComponent.js';

customElements.define('virtual-textarea-component', VirtualTextareaComponent);
/*
Object.keys(components).forEach(key => {
    eval(`window.${key} = ${key}`);
});
*/


