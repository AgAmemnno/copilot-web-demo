class PromptComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        input, button {
          padding: 10px;
          font-size: 16px;
        }
        button {
          background-color: #6200ea;
          color: white;
          border: none;
          cursor: pointer;
          border-radius: 4px;
        }
      </style>
      <form>
        <input type="text" name="prompt" placeholder="Enter your prompt" required>
        <button type="submit">Submit</button>
      </form>
    `;

    this.shadowRoot.querySelector('form').addEventListener('submit', (event) => {
      this.handleSubmit(event);
    });
  }

  handleSubmit(event) {
    event.preventDefault();
    const inputValue = this.shadowRoot.querySelector('input[name="prompt"]').value;

    const customEvent = new CustomEvent('prompt-submit', {
      detail: {
        value: inputValue
      }
    });
    this.dispatchEvent(customEvent);
  }
}

customElements.define('prompt-component', PromptComponent);

export { PromptComponent };
