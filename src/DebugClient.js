


var ws = require("nodejs-websocket")

var serverURL = "ws://116.62.113.50:8886/";
var remoteDebugger = null;
var remoteId = null;

var originalLog = console.log;

console.log = function() {
    var arr = Array.prototype.slice.call(arguments);
    if(!remoteDebugger){
        return originalLog.apply(null, arr);
    }
    try{
        var consoleStr = arr.join("\t");
        originalLog(remoteId, consoleStr);
        remoteDebugger.sendText(JSON.stringify({
            method: 'sendMessage',
            did: remoteId,
            message: JSON.stringify({
                method: "logger",
                log: consoleStr
            })
        }));
    }catch(e){
        originalLog(e);
    }
}

export function startListent(){
    var con = ws.connect(serverURL, () => {
        con.sendText(JSON.stringify({
            'method': 'registerDevice'
        }));
    })
    
    con.on("text", function (str) {
        originalLog(str);
        str = JSON.parse(str);
        try{
            var msg = JSON.parse(str.msg);
            if(msg.method == "eval"){
                eval(msg.code);
            }

            if(msg.method == "excuteFunction"){
                var funcName = msg.name;
                if(typeof global[funcName]){
                    (async () => {
                        try{
                            var result = null;
                            if(msg.args){
                                result = await global[funcName].apply(null, msg.args);
                            }else{
                                result = await global[funcName]();
                            }
                            if(remoteDebugger){
                                remoteDebugger.sendText(JSON.stringify({
                                    method: 'sendMessage',
                                    did: remoteId,
                                    message: JSON.stringify({
                                        funcName: funcName,
                                        method: "excuteFunctionResult",
                                        result: result,
                                        meta: msg.meta
                                    })
                                }));
                            }
                        }catch(e){

                        }
                    })();
                }
            }

            if(msg.method == 'inspect'){
                remoteDebugger = con;
                remoteId = str.from;
            }
        }catch(e){
        }
        
    })
    
    con.on('close', () => {
        console.log('closed');
        setTimeout(startListent, 3000);
    })

    con.on('error', () => {
        console.log('error')
    })
}