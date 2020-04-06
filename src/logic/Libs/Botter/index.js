import { sleep, rnd } from '../../utils'
 
export default class Botter{

    static get Appear(){ return 1 }
    static get Disappear(){  return 2 }


    constructor(wv){
        this.wv = wv;
        wv.webContents.on('dom-ready', () => this._wvLoaded());

        this.temEl = document.createElement('template');
        this.toExec = []
    }

    allwaysExec(sx){
        this.toExec.push(sx)
    }

    async setValue(selector, value){
        await this.clickElement(selector)
        await sleep(rnd(50, 200))
        await this.exec(`document.querySelector('${selector}').value = ''`)
        await sleep(50)
        await this.writeText(value)
    }

    async waitForElement(selector, action){
        while(true){
            const rect = await this.getElementRect(selector)
            if(action == Botter.Appear && rect) return true;
            if(action == Botter.Disappear && !rect) return true;
            await sleep(50)
        }
    }

    async writeText(text) {
        this.wv.webContents.sendInputEvent({ type: 'char', keyCode: ' ' });
        await sleep(rnd(300, 500));
        this.wv.webContents.replace(text);
    }

    async pressTab(wait){
        this.wv.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Tab' });
        this.wv.webContents.sendInputEvent({ type: 'char', keyCode: ' ' });
        if(wait){
            await sleep(wait);
        }
    }

    async click(x, y) {
        this.wv.webContents.sendInputEvent({ type: 'mouseDown', x, y, button: 'left', clickCount: 1 });
        await sleep(10);
        this.wv.webContents.sendInputEvent({ type: 'mouseUp', x, y, button: 'left', clickCount: 1 });
        await sleep(10);
    }

    async clickElement(selector, index){
        const rect = await this.getElementRect(selector, index)
        if(!rect) throw new Error('Element does not exist.')
        const x = rect.x + rnd(5, 10)
        const y = rect.y + rnd(5, 10)
        await this.click(x, y)
    }

    countElements(selector){
        return this.exec(`document.querySelectorAll('${selector}').length`)
    }

    getElementRect(selector, index){
        return this.exec(`
        function __getElRect(selector, index){
            const el = index ? document.querySelectorAll(selector)[index] : document.querySelector(selector)
            if(!el) return null;
            const rect = el.getClientRects()[0];
            if(!rect) return null;
            return JSON.parse(JSON.stringify(rect));
        }
        __getElRect('${selector}', ${index});
        `)
    }

    exec(jscode){
        return this.wv.webContents.executeJavaScript(jscode)
    }

    navigate(url){
        return new Promise((resovle, reject) => {
            this.wv.webContentsLoadedHandler = resovle;
            this.wv.webContents.loadURL(url);
        });
    }

    _wvLoaded(){
        if (this.wv.webContentsLoadedHandler) {
            this.wv.webContentsLoadedHandler();
            this.wv.webContentsLoadedHandler = null;
            for(let sx of this.toExec){
                this.exec(sx)
            }
        }
    }

    _parseHTMLElement(rawHTML){
        this.temEl.innerHTML = rawHTML;
        return this.temEl.content.children[0];
    }

}
