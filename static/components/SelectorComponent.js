class SelectorComponent extends BaseHTMLElement {
  _selector = "select";
  constructor() {super();}

  render(id,options) {
    const template = document.createElement('template');
    template.innerHTML = `
      <style>
        select {
          padding: 10px;
          font-size: 16px;
          border-radius: 4px;
          border: 1px solid #ccc;
          background-color: #f9f9f9;
          color: #333;
          width: 100%;
          box-sizing: border-box;
        }

        select:focus {
          border-color: #6200ea;
          outline: none;
          box-shadow: 0 0 5px rgba(98, 0, 234, 0.5);
        }

        option {
          padding: 10px;
          font-size: 16px;
          background-color: #fff;
          color: #333;
        }

        option:hover {
          background-color: #f1f1f1;
        }
      </style>
      <select id="${id}">
        ${options.map(option => `<option value="${option.value}">${option.label}</option>`).join('')}
      </select>
    `;
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }


}

customElements.define('selector-component', SelectorComponent);
