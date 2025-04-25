import BaseHTMLComponentWithEvent from './base/BaseHTMLComponentWithEvent.js';

class Task1ManagerComponent extends BaseHTMLComponentWithEvent {
  constructor() {
    super();
    this.tasks = [];
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const template = document.createElement('template');
    template.innerHTML = `
      <style>
        .task-manager {
          padding: 20px;
          border: 1px solid #ccc;
          border-radius: 5px;
          background-color: #f9f9f9;
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
        <iframe id="sampleIframe" src="/static/iframe/iframe-content.html" width="100%" height="300px"></iframe>
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

export { Task1ManagerComponent };
