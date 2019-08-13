
const cheerio = require('cheerio');

/* Hello, World! Micro Service */
console.log('Hello World!, the Microservice is running!');

// A micro service will exit when it has nothing left to do.  So to
// avoid a premature exit, let's set an indefinite timer.  When we
// exit() later, the timer will get invalidated.
setInterval(function () {
 }, 1000);

function getGuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}


var watchers = {};

LiquidCore.on('actionResponse', (reponse) => {
    console.log(typeof reponse);
    var originalEvent = reponse.event;
    var eventId = originalEvent.eventId;
    var actionName = originalEvent.actionName;
    console.log(Object.keys(watchers));
    if (watchers[actionName]) {
        if (watchers[actionName]) {
            try {
                watchers[actionName][eventId](reponse.result);
                delete watchers[actionName][eventId];
            } catch (e) { }
        }
    }
})


// Wrapper
export function sendAction(actionName, data, timeout) {
    return new Promise((resolve, reject) => {
        // var respName = actionName + 'Response';
        var eventId = getGuid();
        data.eventId = eventId;
        data.actionName = actionName;

        timeout = timeout || 3000;

        watchers[actionName] = {};
        watchers[actionName][eventId] = (re) => {
            console.log('action callback', re);
            resolve(re);
        }

        console.log('sendAction', Object.keys(watchers));

        setTimeout(() => {
            try {
                delete watchers[actionName][eventId];
            } catch (e) {
            }
            reject('timeout');
        }, timeout);

        LiquidCore.emit(actionName, data);
    });
}



export class Driver {

    static findByText(text) {
        return sendAction('findElement', {
            strategy: 'text',
            selector: text
        });
    }

    static getSource() {
        return sendAction('getSource', {});
    }

    static clickElement(elementId) {
        return sendAction('doActionToElement', {
            elementId,
            action: 'click'
        });
    }

    static triggerEventToElement(elementId, type) {
        return sendAction('doActionToElement', {
            elementId,
            action: type
        });
    }
    // static 
}



LiquidCore.on('exit', function (name) {
    process.exit(0);
})

//LiquidCore.on('findByTextResponse', function(data) {
//    var element = JSON.parse(data.result);
//    console.log(element, element.length);
//    var appButon = element[0];
//    if(appButon){
//        console.log("send click");
////        LiquidCore.emit('clickByElementId', {
////            id: appButon.elementId
////        })
//    }
//})

LiquidCore.emit('ready');

var ATTR_ID = 'element-id';

export async function getDoc() {

    console.log('viewTree');
    var viewTree = await Driver.getSource();
    console.log(viewTree);
    var doc = cheerio.load(viewTree, { ignoreWhitespace: true, xmlMode: true });

    doc.prototype.click = function () {
        for (let index = 0; index < this.length; index++) {
            const element = this.eq(index);
            Driver.triggerEventToElement(element.attr(ATTR_ID), 'click');
        }
    }

    doc.prototype.scroll = function (type) {
        type = type || 'forward';
        for (let index = 0; index < this.length; index++) {
            const element = this.eq(index);
            Driver.triggerEventToElement(element.attr(ATTR_ID), 'scroll-' + type);
        }
    }

    return doc;
}



 