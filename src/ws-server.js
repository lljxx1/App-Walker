var ws = require("nodejs-websocket")
var server = ws.createServer(function (conn) {
    console.log("New connection")
    conn.on("text", function (str) {
        eval(str);
    })
    conn.on("close", function (code, reason) {
        console.log("Connection closed")
    })
    conn.on('error', () => {

    })
    
}).listen(8001);
