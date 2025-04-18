import BaseHTMLComponent from './BaseHTMLComponent.js';
class BaseHTMLComponentWithEvent extends BaseHTMLComponent {
  constructor() {
    super();
  }

  generateId() {
    return 'component-' + Math.random().toString(36).substr(2, 9);
  }

  registerId() {
    sessionStorage.setItem(this.id, JSON.stringify({ events: [], dependencies: [] }));
  }

  retrieveEventInfo() {
    const eventInfo = sessionStorage.getItem(this.id);
    return eventInfo ? JSON.parse(eventInfo) : { events: [], dependencies: [] };
  }

  registerEvent(eventName, dependencies = []) {
    const eventInfo = this.retrieveEventInfo();
    eventInfo.events.push(eventName);
    eventInfo.dependencies.push(...dependencies);
    sessionStorage.setItem(this.id, JSON.stringify(eventInfo));
  }

  resolveDependencies() {
    const eventInfo = this.retrieveEventInfo();
    const resolvedEvents = eventInfo.dependencies.every(dep => sessionStorage.getItem(dep));
    if (resolvedEvents) {
      this.registerEvent('resolved');
    }
  }

  dispatchCustomEvent(eventName, detail = {}) {
    const event = new CustomEvent(eventName, { detail });
    document.dispatchEvent(event);
  }
}

export default BaseHTMLComponentWithEvent;
