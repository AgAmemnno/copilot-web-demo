export class AnimationComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .animation {
          width: 100px;
          height: 100px;
          background-color: red;
          position: relative;
          animation: move 2s infinite;
        }
        @keyframes move {
          0% { left: 0; }
          50% { left: 50px; }
          100% { left: 0; }
        }
      </style>
      <div class="animation"></div>
    `;
  }

  startAnimation() {
    this.shadowRoot.querySelector('.animation').style.animationPlayState = 'running';
  }

  stopAnimation() {
    this.shadowRoot.querySelector('.animation').style.animationPlayState = 'paused';
  }
}

customElements.define('animation-component', AnimationComponent);
