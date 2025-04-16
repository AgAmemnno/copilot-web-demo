import { BaseHTMLComponent } from './BaseHTMLComponent.js';

class InputComponent extends BaseHTMLElement {
  _selector = "input";
  constructor() {super();}
  render(type,id,label){
    this.id = id;
    const template = document.createElement('template');
    template.innerHTML = `
        <style>
            input {
                border: 1px solid #ccc;
                border-radius: 4px;
                padding: 8px;
                font-size: 14px;
                width: 100%;
                box-sizing: border-box;
                margin-bottom: 10px;
            }

            input:focus {
                border-color: #6200ea;
                outline: none;
                box-shadow: 0 0 5px rgba(98, 0, 234, 0.5);
            }

            label {
                font-size: 14px;
                font-weight: bold;
                color: #333;
                display: block;
                margin-bottom: 5px;
            }

            label.required::after {
                content: '*';
                color: red;
                margin-left: 5px;
            }
        </style>
        <label for=${id} class="required">${label}</label>
        <input  type=${type} id=${id} placeholder="${label}"/>
        `;
    this.shadowRoot.appendChild(template.content.cloneNode(true));
　}
}

customElements.define('input-comp',InputComponent);

export { InputComponent };
