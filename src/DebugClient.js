


var ws = require("nodejs-websocket")

var serverURL = "ws://116.62.113.50:8886/";
var remoteDebugger = null;
var remoteId = null;
var hookLog = false;

if(hookLog){
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
}else{
    function sendLog(consoleStr){
        if(!remoteDebugger){
            return;
        }
        try{
            remoteDebugger.sendText(JSON.stringify({
                method: 'sendMessage',
                did: remoteId,
                message: JSON.stringify({
                    method: "logger",
                    log: consoleStr
                })
            }));
        }catch(e){
            console(e, e.stack);
        }
    }
    
    LiquidCore.on('onStdout', (str) => {
        sendLog(str);
    });
    LiquidCore.on('onStderr', (str) => {
        sendLog(str);
    });

    
}



export function startListent(){

    var heartBeatTimer = null;
    var con = ws.connect(serverURL, () => {
        con.sendText(JSON.stringify({
            'method': 'registerDevice'
        }));

        heartBeatTimer = setInterval(() => {
            con.sendText(JSON.stringify({
                method : 'heartbeat',
                time: Date.now()
            }));
        }, 20 * 1000);
    })
    
    con.on("text", function (str) {
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
        clearInterval(heartBeatTimer);
        setTimeout(startListent, 3000);
    })

    con.on('error', () => {
        console.log('error')
    })
}


process.on('uncaughtException', (err) => {
    console.error(err.toString());
    console.error(err.stack.toString());
})