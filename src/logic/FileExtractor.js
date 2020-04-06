// const app = req('electron').remote.app;
const path = req('path');
const fs = req("fs");

class FileExtractor {

    static init(){
        
    }

    static async extractIfNotExist(files){
        const baseDir = this.getBaseFolderPath();
        await this.prepareFolder(baseDir);
        for(let file of files){
            const filename = path.join(baseDir, file);
            const exist = await this.fileExist(filename);
            if(!exist){
                await this.extract(file, filename);
            }
        }
    }

    static prepareFolder(path) {
        return new Promise((resolve, reject) => {
            fs.mkdir(path, function(err) {
                if (err) {
                    if (err.code == 'EEXIST') resolve(); // ignore the error if the folder already exists
                    else reject(err); // something else went wrong
                } else resolve(); // successfully created folder
            });
        })
    }

    static getPath(name){
        return app.getPath(name) + '\\';
    }

    static setBaseFolderPath(path){
        this.baseFolder = path;
    }

    static getBaseFolderPath(){
        // return this.getPath('documents') + 'TGMS\\';
        return this.baseFolder;
    }

    static fileExist(path){
        return new Promise((resolve, reject) => {
            try {
              fs.stat(path, (error, file) => {
                if (!error && file.isFile()) {
                  return resolve(true);
                }
        
                if (error && error.code === 'ENOENT') {
                  return resolve(false);
                }
              });
            } catch (err) {
              reject(err);
            }
          });
    }

    static extract(sourceInAsarArchive, destOutsideAsarArchive) {
        return new Promise((resolve, reject) => {
            fs.copyFile(app.getAppPath() + "/" + sourceInAsarArchive, destOutsideAsarArchive, (err) => {
                if (err) {
                    reject(err);
                }else{
                    resolve();
                }
            });
        })
    }

}
FileExtractor.init();
export default FileExtractor;