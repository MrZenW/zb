/**
 * Created with JetBrains WebStorm.
 * User:	zenboss
 * GitHub:	zenboss
 * Date:	13-8-13
 * Time:	下午10:21
 * Email:	zenyes@gmail.com
 */
"use strict";


(function(){
    var undefined = (function(){})();
    var _window = null;
    var _module = null;
    var isNode = false;
    //判断是否NODEJS环境
    if(typeof module !== typeof undefined && typeof process !== typeof undefined && !!process.version){
        _module = module;
        isNode = true;
    }else{
        _window = window;
        isNode = false;
    }


    var __innerNextTick = null;


    var __syncInnerExec = function(funcs,count,fnSum,argv,self,nextArgs){


        if(count == fnSum){
            return;
        }else{
            funcs[count].call(
                self,
                function(){//is next function
                    count++;
    //                __syncInnerExec(funcs,count,fnSum,argv,self,arguments);
                    __innerNextTick(__syncInnerExec,funcs,count,fnSum,argv,self,arguments);
                },
                argv,
                nextArgs
            );

        }
    };


    var boss = function(){ //构造函数
        this.__events = {};
        this.__models = {};
        this.__configs = {};
        this.__actions = {};
        this.CONST = {};//常量
        this.data = {};
        this.model = {};
        this.action = {};
        this.ext = {};
        this.ext.middles = [];
        this.checkLevel = {0:true};
        this.debug=1;
        this._loadFn = null;


    };
    //单例实例
    boss.__bossInstance = null;
    boss.prototype.VER_NAME = 'ZB_FRAMEWORK_2.2';
    boss.prototype.VER_STRING = 'ZB/2.2';
    boss.prototype.VER_NUMBER = '2.2';
    boss.prototype.extendEvent = function(obj){
        obj.__events = obj.__events || {};
        obj.on = boss.prototype.on;
        obj.once = boss.prototype.once;
        obj.emit = boss.prototype.emit;
        obj.emitApply = boss.prototype.emitApply;
        obj.removeLister = boss.prototype.removeLister;
        obj.removeAllListeners = boss.prototype.removeAllListeners;
        return obj;
    };
    boss.prototype.isNode = isNode;
    boss.prototype.sync = function(funcQ,argv){
        var self = this;
        var fLen = funcQ.length;
        argv = argv||{};
        if(!Array.isArray(argv)){
            argv=[argv];
        }

        return __syncInnerExec(funcQ,0,fLen,argv,self);

    };


    //异步循环
    var syncLoop = boss.prototype.syncLoop = function(func,args){
        args = args||{};
        __innerNextTick(func,function(){
            syncLoop(func,args);
        },args)
    };

    //对某个函数超时调用的默认调用
    boss.prototype.funcTimeout = function(func,timeout){
        var self = this;
        if((timeout|0)>0){
            var funcTimeoutTHD = 0;
            var called = false;
            var funcPack = function(arg1,arg2,argN){
                clearTimeout(funcTimeoutTHD);
                var retVal;
                if(!called){ //如果超时函数没有被执行过就执行他
                    retVal = func.apply(self,arguments);
                }
                called = true;
                return retVal;
            };
            funcTimeoutTHD = setTimeout(funcPack,timeout,'timeout_call');
            return funcPack;
        }else{
            return func;
        }

    };

	//UUID
	var UUID = 1;
	boss.prototype.uuid = function(){
		return UUID++;
	}


    //委派事件
    var eventPoolUUID = 1;
    boss.prototype.on = function(event_name,func,func_name){

        func_name = func_name || "__default__"+eventPoolUUID;
        eventPoolUUID++;
        this.__events[event_name] = this.__events[event_name] || {};
        this.__events[event_name][func_name] = func.bind(this);
        this.debug && console.log('-[boss.on]:['+event_name+']:',func_name);
    };
    
    //委派一次性事件
    boss.prototype.once = function(eventName,func,func_name){
        var self = this;
        func_name = func_name || "__default__"+eventPoolUUID;
        eventPoolUUID++;
        self.on(eventName,function(){
            func.apply(self,arguments);
            self.removeLister(eventName,func_name)
        },func_name);
    };

    //激发事件
    boss.prototype.emit = function(event_name,arg1){
        var self = this;
    //    self.debug && console.log('-[boss.emit]-:',event_name);
        var tmp_event_all = this.__events[event_name] || {};
        var args = [];
        for(var i=1;i<arguments.length;i++){
            args.push(arguments[i]);
        }
        var eventFnCount = 0;
        for(var key in tmp_event_all){
            var theFunc = tmp_event_all[key];
            __innerNextTick.apply(self,[theFunc].concat(args));
            self.debug && console.log('-[boss.emit]:['+event_name+']:',key);
            eventFnCount++;
    //        process.nextTick((function(_theFunc){
    //            return function(){
    //                _theFunc.apply(self,args);
    //            };
    //
    //        })(theFunc));

        }
        return eventFnCount;
    };

    //激发事件，第二位参数是数组
    boss.prototype.emitApply = function(event_name,argArray){
        var self = this;
        var args = [event_name];
        for(var i=0;i<argArray.length;i++){
            args.push(argArray[i]);
        }
        console.log(args);
        return self.emit.apply(self,args);
    };

    //移除监听
    boss.prototype.removeLister = function(event_name,func_name){

        var tmp_event_all = this.__events[event_name] || {};
        if(func_name){ //如果输入了函数名，就只删除这一个函数
            delete tmp_event_all[func_name];
        }else{//如果没有输入函数名，就把整个事件删除
            delete this.__events[event_name];
        }
    };

    //移除所有监听
    boss.prototype.removeAllListeners = function(event_name){
        delete this.__events[event_name];
    };

    //检查函数
    boss.prototype.check = function(level,args){ //用来收集数据的函数

        var self = this;
    //    var arg = [];
    //    for(var i in arguments){
    //        arg[arg.length] = arguments[i];
    //    }
    //    arg.unshift("boss.check."+level);
    //    console.log("check...");
        self.emit("boss.check",arguments);

    };


    boss.prototype.load = function(loadFn){
        this._loadFn = loadFn;
        this._loadFn();

    };
    boss.prototype.reload = function(){
        if('function' == typeof this._loadFn){
            this._loadFn();
        }
    };


    boss.prototype.help = {};
    boss.prototype.help.fs = {};
    boss.prototype.help.fs.createMenuSync = function(path,cb){
        cb = cb||function(file){return file;};
        var self = this;
        var retVal = {};

        var fs = require('fs');
        var fileStat = fs.lstatSync(path); //获得文件信息，包括大小

        if (fileStat === undefined) return false;

        if(fileStat.isDirectory()){//如果不是文件夹

            var dirInfo = fs.readdirSync(path);

            for(var key in dirInfo){
                var item = dirInfo[key];
                var bias = '';
                if(path[path.length-1]!='/'){
                    bias = '/';
                }
                var filePath = path+bias+item;

                var _retVal = self.createMenuSync.call(self,filePath,cb);
                for(var _key in _retVal){
                    retVal[_key] = _retVal[_key];
                }


            }
            return retVal;

        }else{

            var file = fs.statSync(path);

            file['/real_path/'] = fs.realpathSync(path);
            file['/file_name/'] = file['/real_path/'].substring(file['/real_path/'].lastIndexOf('/')+1);
            var extIndex = file['/file_name/'].lastIndexOf('.');
            file['/ext/'] = file['/file_name/'].substring(extIndex+1);
            file['/name/'] = file['/file_name/'].substring(0,extIndex);
            file['/path/'] = path;
            var dirIndex = file['/real_path/'].lastIndexOf('/');
            file['/dir/'] = file['/real_path/'].substring(0,dirIndex);
            file['/isDir/'] = false;
            file['/type/'] = 'file';

            var fileType = null;
            if(file.isFile()){
                fileType = 'file';
            }else if(file.isDirectory()){
                fileType = 'directory';
            }else if(file.isBlockDevice()){
                fileType = 'block_device';
            }else if(file.isCharacterDevice()){
                fileType = 'character_device';
            }else if(file.isSymbolicLink()){
                fileType = 'symbolic_link';
            }else if(file.isFIFO()){
                fileType = 'FIFO';
            }else if(file.isSocket()){
                fileType = 'socket';
            }
            file['/type/'] = fileType;

            retVal[file['/real_path/']] = cb(file);
            return retVal;



        }



    };
    //按行读取文件
    boss.prototype.help.fs.readFileLine = function(path,cb,endCB){
        var fs = require('fs');

        cb = cb||function(){};
        endCB = endCB||function(){};

        fs.stat(path,function(err,stats){
    //        console.log(err,stats);
            if(err){
                endCB(err);
                return;
            }
            var fl = fs.createReadStream(path,{bufferSize:512});
    //    var nullFl = fs.createReadStream('/dev/null',{bufferSize:512});

            var readline = require('readline');
            var rl = readline.createInterface({
                input:fl,
                output:fl

            });
            var lineNum = 0;
            rl.on('line',function(line){
                lineNum++;
                cb.call(rl,line,lineNum);
            })
            fl.on('end',endCB);
        });



    };
    boss.prototype.help.fs.mkdirs = function(dir,mode,cb){
        if('function' == typeof mode){
            cb = mode;
            mode = '0777';
        }
        cb = cb || function(){};
        var self = this;
        var fs = require('fs');
        var path = require('path');
        fs.exists(dir,function(exists){
            if(exists){
                cb(null,dir);

            }else{
                self.mkdirs(path.dirname(dir),mode,function(){
                    fs.mkdir(dir,mode,cb);
                });

            }

        })

    };
    boss.prototype.addModel = function(pathOrObj,modelName){
        var self = this;
        if('string' == typeof pathOrObj){
            try{
                pathOrObj = require(pathOrObj);
            }catch(ex){
                console.error('addModel - model path not found file');
                pathOrObj=null;
            }

        }

        if(!!pathOrObj){
            if(!modelName){
                console.error("model name cannot is empty");
                return null;
            }
            for(var funcName in pathOrObj){
                var theFunc = pathOrObj[funcName];
                if('function' == typeof theFunc && pathOrObj.hasOwnProperty(funcName)){
                    pathOrObj[funcName] = pathOrObj[funcName].bind(self);
                }
            }

            self.__models[modelName] = pathOrObj;
        }
        return self;

    };
    boss.prototype.getModel = function(modelName){
        if(modelName){
            return this.__models[modelName];
        }else{
            return this.__models;
        }

    };
    boss.prototype.config = function(configname,val){
        if('object' == typeof configname){
            for(var _k in configname){
                this.__configs[_k] = configname[_k];
            }
            return this.__configs;
        }
        if(arguments.length>=2){
            this.__configs[configname] = val;
        }

        if(configname){
            return this.__configs[configname];
        }else{
            return this.__configs;
        }
    };
    boss.prototype.loadConfig = function(path,cb){
        var paths = this.help.fs.createMenuSync(path);
        for(var _path in paths){
            var conf = require(_path);
            this.config(conf);        
        }
        
    };

    //工作程式主函数
    boss.prototype.emitCronjob = function(){
        var self = this;        
        var now = new Date();
        var nowTimeStamp = now.valueOf();

        var h = ('0'+now.getHours()).substr(-2); //使用原生的更快一些
        var i = ('0'+now.getMinutes()).substr(-2);
        var hi = h+':'+i;
        self.emit("boss.time.xx:xx",nowTimeStamp,now);
        self.emit("boss.time."+hi,nowTimeStamp,now);
        self.emit("boss.time.xx:"+i,nowTimeStamp,now);
    };

    var defaultTimeEventsIHD = null;//默认时间事件句柄
    boss.prototype.runDefaultTimeEvents = function(){
        var self = this;
		if(!!defaultTimeEventsIHD){
			return defaultTimeEventsIHD;
		}
        defaultTimeEventsIHD = setInterval(self.emitCronjob,1000*60);
        return defaultTimeEventsIHD;
    };

    boss.prototype.stopDefaultTimeEvents = function(){
        if(defaultTimeEventsIHD!==null){
            clearInterval(defaultTimeEventsIHD);
        }
		defaultTimeEventsIHD = null;
    };

    //空函数
    boss.prototype.noneFunc = function(){};

    //获得NODEJS 系统参数
    if(isNode && process && process.argv){
        boss.prototype.argv = {};
        var argv = process.argv.slice(2);
        for(var i in argv){
            var _temp = argv[i].split('=');
            var k = _temp[0];
            var v = _temp[1];
            if(0==k.indexOf('--')){
                k = k.substr(2);
                boss.prototype.argv[k] = v;
            }

        }
    }


    boss.instanceName = 'boss';
    if(isNode){
        __innerNextTick = boss.prototype.nextTick = setImmediate;

        _module.exports = function(opt){
            opt = opt||{};
            if(!boss.__bossInstance){
                boss.__bossInstance = new boss();
                if(opt.runDefaultTimeEvents!==false){
                    boss.__bossInstance.runDefaultTimeEvents();
                }

            }
            return boss.__bossInstance;
        };

        

    }else{

        __innerNextTick = boss.prototype.nextTick = function(fn){
            var args = Array.prototype.slice.call(arguments,1);
            return setTimeout(function(){
                fn.apply(null,args);
            },0);
        }

        //退位函数
        boss.prototype.abdicate = function(){
            var inst = _window[boss.instanceName];
            _window[boss.instanceName] = boss._preInstanceNameObj;
            return inst;
        };
        //原始的值
        boss._preInstanceNameObj = _window[boss.instanceName];
        var instance = _window[boss.instanceName] = new boss();
        instance.runDefaultTimeEvents();

    }

})();