import BaseHTMLComponentWithEvent from './base/BaseHTMLComponentWithEvent.js';

class GridLayoutComponent extends BaseHTMLComponentWithEvent {
  constructor() {
    super();
    this.layoutStrategy = null;
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const template = document.createElement('template');
    template.innerHTML = `
      <style>
        :host {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: var(--grid-base-gap, 10px);
        }
        ::slotted(*) {
          margin: var(--element-extra-margin, 5px);
        }
      </style>
      <slot></slot>
    `;
    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  setLayoutStrategy(strategy) {
    this.layoutStrategy = strategy;
    this.applyLayoutStrategy();
  }

  applyLayoutStrategy() {
    if (this.layoutStrategy) {
      this.layoutStrategy.apply(this);
    }
  }

  static get observedAttributes() {
    return ['data-layout-mode'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'data-layout-mode') {
      this.updateLayoutMode(newValue);
    }
  }

  updateLayoutMode(mode) {
    switch (mode) {
      case 'grid':
        this.setLayoutStrategy(new GridLayoutStrategy());
        break;
      case 'voronoi':
        this.setLayoutStrategy(new VoronoiLayoutStrategy());
        break;
      default:
        this.setLayoutStrategy(new GridLayoutStrategy());
    }
  }
}

class GridLayoutStrategy {
  apply(component) {
    component.style.display = 'grid';
    component.style.gridTemplateColumns = 'repeat(auto-fit, minmax(100px, 1fr))';
    component.style.gap = 'var(--grid-base-gap, 10px)';
  }
}

class VoronoiLayoutStrategy {
  apply(component) {
    component.style.display = 'flex';
    component.style.flexWrap = 'wrap';
    component.style.justifyContent = 'space-around';
    component.style.alignItems = 'center';
  }
}


export { GridLayoutComponent, GridLayoutStrategy, VoronoiLayoutStrategy };