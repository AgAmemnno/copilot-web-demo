import { AnimationComponent } from './AnimationComponent.js';
import { BaseHTMLComponent } from './BaseHTMLComponent.js';
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
    ButtonComponent,
    FormComponent,
    GoogleDriveManager,
    InputComponent,
    ModalComponent,
    CollapsiblePanel,
    PromptComponent,
    SelectorComponent
};

customElements.define('animation-component', AnimationComponent);
customElements.define('button-comp', ButtonComponent);
customElements.define('form-component', FormComponent);
customElements.define('input-comp', InputComponent);
customElements.define('modal-component', ModalComponent);
customElements.define('collapsible-panel', CollapsiblePanel);
customElements.define('prompt-component', PromptComponent);
customElements.define('selector-component', SelectorComponent);
