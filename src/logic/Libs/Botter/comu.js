const { ipcRenderer } = _require('electron');

export default class Comu{

    constructor(wv){
        this.tasks = [];
        this.wv = wv;
        this.wci = wv.webContents.id;
        ipcRenderer.on('do', e => {
            if(e.channel == 'do'){
                this.doResponse(...e.args);
            }
        });
        this.tasksPtr = 1;
    }


    doResponse(ref, status, resp, wci){
        if(wci !== this.wci) return;
        const task_idx = this.tasks.findIndex(t => t.ref == ref);
        if (task_idx != -1) {
            const task = this.tasks.splice(task_idx, 1)[0];
            if(status == 'OK'){
                task.resolve(resp);
            }else{
                task.reject(resp);
            }
        }

    }

    do(todo){
        const ref = this.tasksPtr++;
        return new Promise((resolve, reject) => {
            const task = {resolve, reject, ref };
            this.tasks.push(task);
            this.wv.webContents.send('do', ref, todo, this.wci);
        });
    }

}