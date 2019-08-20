
var ws = require("nodejs-websocket")
var clients = {};
var debuggers = {};

var server = ws.createServer(function (conn) {
    console.log("New connection")
    var did = Math.floor(Math.random() * 100000);
    conn.on("text", function (str) {
        var data  = JSON.parse(str);

        if(data.method == "registerDevice"){
            conn.id = did;
            clients[did] = conn;
        }

        if(data.method == "registerDebugger"){
            conn.id = did;
            debuggers[did] = conn;
        }

        if(data.method == "getDevices"){
            conn.sendText(JSON.stringify({
                event: data,
                method: data.method,
                result: Object.keys(clients)
            }));
        }

        
        if(data.method == "getDebuggers"){
            conn.sendText(JSON.stringify({
                event: data,
                method: data.method,
                result: Object.keys(debuggers)
            }));
        }

        if(data.method == "sendMessage"){
            var devicId = data.did;
            var message = data.message;
            var status = false;
            var targetClient = null;
            if(clients[devicId]) targetClient = clients[devicId];
            if(debuggers[devicId]) targetClient = debuggers[devicId];

            if(targetClient){
                targetClient.sendText(JSON.stringify(
                    {
                        from: did,
                        msg: message,
                    }
                ));
                status = true;
            }
            
            conn.sendText(JSON.stringify({
                event: data,
                method: data.method,
                result: status
            }));
        }
    })

    conn.on("close", function (code, reason) {
        console.log("Connection closed")
        if(clients[did]) delete clients[did];
        if(debuggers[did]) delete debuggers[did];
    })

    conn.on('error', () => {

    })
});

server.listen(8886);
server.on('listening', function() {
  console.log('server start with port', 8886);
});