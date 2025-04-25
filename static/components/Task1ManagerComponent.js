import BaseHTMLComponentWithEvent from './base/BaseHTMLComponentWithEvent.js';
class Task1ManagerComponentMenu{
  constructor(animMenu,ele){
    this.animMenu = animMenu;
    this.ele = ele;
  }
  pushFrame(){
    this.animMenu.shadowRoot.getElementById("chat-teardrop-text").appendChild(this.ele);
  }
  
  popFrame(){
    this.animMenu.shadowRoot.getElementById("chat-teardrop-text").removeChild(this.ele);
  }
}

class Task1ManagerComponent extends BaseHTMLComponentWithEvent {
  constructor() {
    super();
    this.tasks = [];
  }
  ishadow(){
    this.render();
  }
  connectedCallback() {
    
  }

  render() {
    const template = document.createElement('template');
    template.innerHTML = `
      <style>
       :host{
        position:absolute;
        z-index :5;
       }
        .task-manager {
          position:fixed;
          top:0;
          left:0;
          width:100vw;
          height:100vh;
          padding: 20px;
          border: 1px solid #ccc;
          border-radius: 5px;
          background-color: #f9f9f9;
          z-index :9;
        }
        .task-list {
          margin-top: 20px;
        }
        .task-item {
          padding: 10px;
          border-bottom: 1px solid #ddd;
        }
      </style>
      <div class="task-manager">
        <h2>Task Manager</h2>
        <button id="addTaskButton">Add Task</button>
        <div class="task-list" id="taskList"></div>
        <iframe id="sampleIframe" src="/iframe/iframe-content.html" width="100%" height="300px"></iframe>
      </div>
    `;
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.shadowRoot.getElementById('addTaskButton').addEventListener('click', () => this.addTask());
    
  }
  

  
  addTask() {
    const task = `Task ${this.tasks.length + 1}`;
    this.tasks.push(task);
    this.updateTaskList();
  }

  updateTaskList() {
    const taskList = this.shadowRoot.getElementById('taskList');
    taskList.innerHTML = '';
    this.tasks.forEach(task => {
      const taskItem = document.createElement('div');
      taskItem.className = 'task-item';
      taskItem.textContent = task;
      taskList.appendChild(taskItem);
    });
  }
}

export { Task1ManagerComponent,Task1ManagerComponentMenu };
