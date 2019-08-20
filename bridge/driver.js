var ws = require("nodejs-websocket")
var serverURL = "ws://192.168.41.148:8886/";


function startListent(){

    var con = ws.connect(serverURL, () => {
        con.sendText(JSON.stringify({
            'method': 'getDevices'
        }));
        // con.sendText(JSON.stringify({
        //     method: 'sendMessage',
        //     did: 50644,
        //     message: JSON.stringify({
        //         method: "test"
        //     })
        // }))
        con.sendText(JSON.stringify({
            'method': 'registerDebugger'
        }));
    })
    
    con.on("text", function (str) {
        console.log(str)
        str = JSON.parse(str);
        if(str.method == "getDevices"){

            var did = str.result[0];
            con.sendText(JSON.stringify({
                method: 'sendMessage',
                did: did,
                message: JSON.stringify({
                    method: "inspect",
                })
            }))

            con.sendText(JSON.stringify({
                method: 'sendMessage',
                did: did,
                message: JSON.stringify({
                    method: "eval",
                    code: 'console.log(2)'
                })
            }))

            con.sendText(JSON.stringify({
                method: 'sendMessage',
                did: did,
                message: JSON.stringify({
                    method: "eval",
                    code: 'console.log(6)'
                })
            }))
        }


        if(str.msg){
            var bundle = JSON.parse(str.msg);
            if(bundle.method = "logger"){
                console.log(bundle.log);
            }
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