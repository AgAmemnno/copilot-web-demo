// iframe-module.js
export class MyIframeClass {
    constructor(iframeId) {
      this.iframeId = iframeId;
      console.log(`MyIframeClass created within iframe: ${iframeId}`);
    }
    whoAmI() {
      console.log(`I am running inside iframe: ${this.iframeId}`);
    }
  }