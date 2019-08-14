
import {
    getDoc,
    sendAction
} from './driver.js'
import SimpleWalker from './SimpleWalker';


async function wait(du){
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve();
		}, du);
	})
}



global.wait = wait;

(async function loop() {
    return;
    // var bidui = await request('http://www.baidu.com');
    // console.log('source new', bidui);
    var $ = await getDoc();
    var chrome = $("[text*='惠拍']");

    var clickElements = $("[clickable='true']");
    var scrollElements = $("[scrollable='true']");
    // chrome.eq(0).click();
    // var els = await Driver.findByText("Chrome");
    // els = JSON.parse(els);
    // var source = await Driver.getSource();
    // console.log('source', chrome.length);
    // console.log('findByTextNNN', els);
    // if (els.length > 0) {
    //     Driver.clickElement(els[0].elementId)
    // };

    // if (chrome.length) {
    //     console.log('chrome', chrome.length, chrome.attr());
    //     var icon = chrome.eq(0);
    //     console.log('chrome icon id', icon.attr(ATTR_ID))
    //     // Driver.clickElement(icon.attr(ATTR_ID));
    //     // return;
    // }

    // for (let index = 0; index < clickElements.length; index++) {
    //     const element = clickElements.eq(index);
    //     console.log('clickElements', element.attr());
    //     // element.click();
    // }

    // for (let index = 0; index < scrollElements.length; index++) {
    //     const element = scrollElements.eq(index);
    //     console.log('scrollElements', element.attr())
    //     // element.scroll();
    // }

    // setTimeout(loop, 5000);
})();



var isRecord = false;
var actionsBuffer = [];
var eventListenners = [];


LiquidCore.on('onAccessibilityEvent', (reponse) => {
    try{
        // console.log(reponse)
        if(reponse.indexOf('TYPE_WINDOW_STATE_CHANGED') > -1){
            console.log(reponse);
        }

        if(isRecord){
            actionsBuffer.push(reponse);
        }
        
        eventListenners.forEach((eventListenner) => {
            eventListenner(reponse);
        })
    }catch(e){

    }
});


function listEventChange(cb){
    eventListenners.push(cb);
}


global.listEventChange = listEventChange;

LiquidCore.on('startRecord', () => {
    console.log("startRecord");
    (async () => {
        var appList = await sendAction('launchPackage', {
            appName: '今日头条'
        });
        isRecord = true;

    })();
});


LiquidCore.on('stopRecord', () => {
    console.log("stopRecord", actionsBuffer.length);
    var collect = JSON.stringify(actionsBuffer);
    actionsBuffer = [];
    isRecord = false;
});




// var originalConsole = console.log;
// console.log = function(m){
//     originalConsole(m);
//     conn.sendText();
// }

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
});

// server.listen(8003);


(async () => {

    await sendAction('launchPackage', {
        appName: '微博'
    });

    await wait(5 * 1000);

    var walker = new SimpleWalker();
    await walker.run();
   

    var $ = await getDoc();
    var dialog = $("[text*='个人信息保护指引']");
    var knowButton = $("[text*='我知道了']");

    console.log(dialog.length, knowButton.length);
    if(dialog.length && knowButton.length){
        console.log("try to click");
        knowButton.click();
    }

    await wait(10 * 1000);

    var $ = await getDoc();
    var clickElements = $("[clickable='true']");

    for (let index = 0; index < clickElements.length; index++) {
        // const element = clickElements.eq(index);
        // element.click();
        // await wait(5 * 1000);
    }
   
})();




(async function loop() {
    return;
    var $ = await getDoc();
    var chrome = $("[text*='今日头条']");
    if (chrome.length) {
        var icon = chrome.eq(0);
        icon.parent().click();
    }

    await wait(10 * 1000);

    var $ = await getDoc();
    var dialog = $("[text*='个人信息保护指引']");
    var knowButton = $("[text*='我知道了']");

    if(dialog.length && knowButton.length){
        console.log("try to click");
        knowButton.click();
        return;
    }

    setTimeout(loop, 5000);
})();