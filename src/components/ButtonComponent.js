class ButtonComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        button {
          background-color: #6200ea;
          color: white;
          border: none;
          padding: 10px 20px;
          text-align: center;
          text-decoration: none;
          display: inline-block;
          font-size: 16px;
          margin: 4px 2px;
          cursor: pointer;
          border-radius: 4px;
        }
      </style>
      <button><slot></slot></button>
    `;

    this.shadowRoot.querySelector('button').addEventListener('click', () => {
      this.handleClick();
    });
  }

  handleClick() {
    const event = new CustomEvent('button-click', {
      detail: {
        message: 'Button clicked!'
      }
    });
    this.dispatchEvent(event);
  }
}

customElements.define('button-component', ButtonComponent);
