var ws = require("nodejs-websocket")

var serverURL = "ws://192.168.41.148:8886/";
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


function startListent(){
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


startListent();