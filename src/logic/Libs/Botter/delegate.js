const { ipcRenderer } = require('electron');
const OK = 'OK';
const FAIL = 'FAIL';

function init(){
    ipcRenderer.on('do', onDo);
}

function respondeDo(ref, status, resp){
    ipcRenderer.sendToHost('do', ref, status, resp);
}

function onDo(e, ref, todo){
    switch (todo.action) {
        case 'getPosition':
            getPosition(ref, todo);
            break;
        case 'callElMethod':
            callElMethod(ref, todo);
            break;
        case 'dropFile':
            dropFile(ref, todo);
            break;
        case 'getElements':
            getElements(ref, todo);
            break;
        case 'getElementByChildText':
            getElementByChildText(ref, todo);
            break;
        default:
            respondeDo(ref, FAIL, 'Unknow action');
            break;
    }
}

function getPosition(ref, { selector }){
    const el = document.querySelector(selector);
    if(el){
        const rect = el.getClientRects()[0];
        respondeDo(ref, OK, { x: rect.x, y: rect.y });
    }else{
        respondeDo(ref, OK, null);
        // respondeDo(ref, FAIL, 'Element not found');
    }
}

function callElMethod(ref, { selector, method }){
    const el = document.querySelector(selector);
    if (el) {
        if (typeof el[method] == 'function'){
            el[method]();
            respondeDo(ref, OK, true);
        }else{
            respondeDo(ref, FAIL, 'Method not found');
        }
    } else {
        respondeDo(ref, FAIL, 'Element not found');
    }
}

function dropFile(ref, { selector, dataURL }){
    const el = document.querySelector(selector);
    if (el) {
        const file = dataURLtoFile(dataURL, `pic_${rnd(1000, 2000)}.png`);
        el.ondrop({
            dataTransfer: { files: [file] },
            preventDefault: function () { }
        });
    } else {
        respondeDo(ref, FAIL, 'Element not found');
    }
}

function getElements(ref, { selector }){
    const els = document.querySelectorAll(selector);
    const result = [];
    for(let el of els){
        result.push(el.outerHTML);
    }
    respondeDo(ref, OK, result);
}

function getElementByChildText(ref, args){
    const { elClass, childSelector, childText } = args;
    const sText = childText.replace(/\s/g, '');
    const els = document.querySelectorAll(childSelector);
    let elf;
    for(let el of els){
        const elText = el.innerText.replace(/\s/g, '');
        if(elText == sText){
            elf = el;
            break;
        }
    }
    while (elf) {
        if (elf.classList.contains(elClass)) {
            respondeDo(ref, OK, elf.outerHTML);
            break;
        } else {
            elf = elf.parentNode;
        }
    }
    respondeDo(ref, OK, null);
}


init();


// UTILS

function dataURLtoFile(dataurl, filename) {
    var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}

function rnd(min, max, float) {
    const num = Math.random() * (max - min) + min;
    return float ? num : Math.floor(num);
}