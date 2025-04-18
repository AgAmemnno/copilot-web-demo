import BaseHTMLComponentWithEvent from './base/BaseHTMLComponentWithEvent.js';
export class FormComponent extends  BaseHTMLComponentWithEvent {
  constructor() {
    super();
    this.registerId();
    this.eventInfo = this.retrieveEventInfo();
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
        <input type="text" name="name" placeholder="Name" required>
        <input type="email" name="email" placeholder="Email" required>
        <button type="submit">Submit</button>
      </form>
    `;

    this.shadowRoot.querySelector('form').addEventListener('submit', (event) => {
      this.handleSubmit(event);
    });
  }

  handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });

    const eventDetail = new CustomEvent('form-submit', {
      detail: data
    });
    this.dispatchEvent(eventDetail);
  }
}


