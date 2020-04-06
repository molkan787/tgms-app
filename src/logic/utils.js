const electron = req('electron')
const dialog = electron.dialog
const fs = req('fs')

window.Utils = module.exports = class Utils {

    static timestamp(){
        return Math.floor(new Date().getTime() / 1000);
    }

    static p(executor) {
        return new Promise(executor);
    }

    static waitUntil(checker, interval) {
        return new Promise(resolve => {
            const timer = setInterval(() => {
                if (checker()) {
                    clearInterval(timer);
                    resolve()
                }
            }, interval || 20)
        })
    }

    static rndSleep(min, max) {
        return Utils.sleep(Utils.rnd(min, max))
    }

    static sleep(time) {
        return new Promise(r => setTimeout(() => r(), time))
    }

    static rnd(min, max) {
        const rn = Math.random()
        return min + Math.floor((max - min) * rn)
    }

    static rndItem(arr) {
        const index = Math.round(Math.random() * (arr.length - 1))
        return arr[index]
    }

    static async delay(executor, time){
        await Utils.sleep(time)
        return await executor()
    }

    static divideArray(array, divider) {
        const result = [];
        for (let i = 0; i < array.length; i += divider) {
            result.push(array.slice(i, i + divider));
        }
        return result;
    }

    static splitArray(arr, count){
        const chunks = []
        const chunkSize = Math.floor(arr.length / count)
        const rest = arr.length % count
        let index = 0
        for(let i = 0; i < count; i++){
            const size = chunkSize + (i < rest ? 1 : 0)
            chunks.push(arr.slice(index, index + size))
            index += size
        }
        return chunks
    }

    static async promptDirectory() {
        const resp = await dialog.showOpenDialog({
            properties: ['openDirectory']
        })
        if (resp.canceled) return null

        return resp.filePaths[0]
    }

    static async promptFile() {
        const resp = await dialog.showOpenDialog()
        if (resp.canceled) return null

        return resp.filePaths[0]
    }

    static async promptSaveFile() {
        const resp = await dialog.showSaveDialog()
        if (resp.canceled) return null

        return resp.filePath
    }

    static readFile(filename) {
        return new Promise((resolve, reject) => {
            fs.readFile(filename, 'utf8', (err, contents) => {
                err ? reject(err) : resolve(contents)
            })
        })
    }

    static writeFile(filename, data) {
        return new Promise((resolve, reject) => {
            fs.writeFile(filename, data, err => {
                err ? reject(err) : resolve()
            })
        })
    }

}