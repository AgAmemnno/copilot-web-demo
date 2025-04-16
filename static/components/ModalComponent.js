export class ModalComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .modal {
          display: none;
          position: fixed;
          z-index: 1;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          overflow: auto;
          background-color: rgb(0,0,0);
          background-color: rgba(0,0,0,0.4);
        }
        .modal-content {
          background-color: #fefefe;
          margin: 15% auto;
          padding: 20px;
          border: 1px solid #888;
          width: 80%;
        }
        .close {
          color: #aaa;
          float: right;
          font-size: 28px;
          font-weight: bold;
        }
        .close:hover,
        .close:focus {
          color: black;
          text-decoration: none;
          cursor: pointer;
        }
      </style>
      <div class="modal">
        <div class="modal-content">
          <span class="close">&times;</span>
          <slot></slot>
        </div>
      </div>
    `;

    this.shadowRoot.querySelector('.close').addEventListener('click', () => {
      this.closeModal();
    });
  }

  openModal() {
    this.shadowRoot.querySelector('.modal').style.display = 'block';
  }

  closeModal() {
    this.shadowRoot.querySelector('.modal').style.display = 'none';
  }
}

customElements.define('modal-component', ModalComponent);
