const logArea = document.getElementById('logArea');
const loadingSpinner = document.getElementById('loadingSpinner');
function setButtonsDisabled(disabled, exceptIds=[]) {
    document.querySelectorAll('button').forEach(button => {
        if (!exceptIds.includes(button.id))
            button.disabled = disabled;
    });
    loadingSpinner.style.display = disabled ? 'block' : 'none';
}
function logMessage(message, type="info") {
    const entry = document.createElement('div');
    entry.classList.add('log-entry');
    const timestamp = `[${new Date().toLocaleTimeString()}] `;
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    if (type === "error")
        messageSpan.classList.add('log-error');
    else if (type === "success")
        messageSpan.classList.add('log-success');
    else
        messageSpan.classList.add('log-info');
    entry.appendChild(document.createTextNode(timestamp));
    entry.appendChild(messageSpan);
    logArea.appendChild(entry);
    logArea.scrollTop = logArea.scrollHeight;
}
function showPhase(phaseId) {
    const phases = [ 'config-phase' ,'milestone-phase', 'scenario-phase', 'issue-phase'];
    document.querySelectorAll('.phase-navigation button').forEach(btn => btn.classList.remove('active-nav'));
    
    phases.forEach((phase)=>{
        const self = document.querySelector(phase);
        self.style.setProperty('--name-display', 'none');
        if(phase  == phaseId){
            self.style.setProperty('--name-display', 'block');
            document.querySelector(`#nav-${phase}`).classList.add('active-nav');
        }
    });
}
export {logMessage,setButtonsDisabled,showPhase};