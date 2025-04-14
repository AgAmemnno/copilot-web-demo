class SelectorComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        select {
          padding: 10px;
          font-size: 16px;
          border-radius: 4px;
          border: 1px solid #ccc;
        }
      </style>
      <select>
        <option value="option1">Option 1</option>
        <option value="option2">Option 2</option>
        <option value="option3">Option 3</option>
      </select>
    `;

    this.shadowRoot.querySelector('select').addEventListener('change', (event) => {
      this.handleChange(event);
    });
  }

  handleChange(event) {
    const selectedValue = event.target.value;
    const customEvent = new CustomEvent('selector-change', {
      detail: {
        value: selectedValue
      }
    });
    this.dispatchEvent(customEvent);
  }
}

customElements.define('selector-component', SelectorComponent);
