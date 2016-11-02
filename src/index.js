import fs from 'fs-extra';
import path from 'path';
import Promise from 'bluebird';
import child_process from 'child_process';


Promise.promisifyAll(fs)

export default class Transpiler{
    constructor(serverless, options={}){

        this.serverless = serverless;

        this.servicePath    = this.serverless.config.servicePath;
        this.tmpDir         = path.join(this.servicePath, './.serverless');
        this.buildTmpDir    = path.join(this.tmpDir, './build');

        this.hooks = {
            'before:invoke:local:invoke':(...args)=>this.compile(...args)
        };

        this.servicePath    = this.serverless.config.servicePath;
        this.tmpDir         = path.join(this.servicePath, './.serverless');
        this.buildTmpDir    = path.join(this.tmpDir, './build');

    }
    async compile(){
        this.serverless.cli.log("Compiling source code for local execution");

        await fs.ensureDirAsync(this.buildTmpDir);
        const params = [path.join(this.servicePath,"functions"), "--out-dir", path.join(this.buildTmpDir,"functions")];

        await Promise.all([
           this.compileFolder("functions"),
           this.compileFolder("lib")
        ]);

        this.serverless.config.servicePath = this.buildTmpDir;
    }

    compileFolder(folderName){
        return new Promise((resolve, reject)=>{
            const params = [path.join(this.servicePath,folderName), "--out-dir", path.join(this.buildTmpDir,folderName)];
            const spawn = child_process.spawn;

            let  babel = spawn(path.join(this.servicePath,'node_modules/.bin/babel'), params,{
                "cwd":path.dirname(this.servicePath)
            });
            babel.on('exit', function (code, signal) {
                if (code === 0) {
                    resolve(folderName);
                } else {
                    reject("Error");
                }
            });
            babel.on('error', (err)=>{
                console.log(err);
                reject(err);
            });

            babel.stderr.on('data', function(data) {
                console.log('stderr: ' + data);
                reject("Error");
                //Here is where the error output goes
            });
        })
    }
}

