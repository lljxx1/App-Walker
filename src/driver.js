
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
    var originalEvent = reponse.event;
    var eventId = originalEvent.eventId;
    var actionName = originalEvent.actionName;
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

        var isCalled = false;

        watchers[actionName] = {};
        watchers[actionName][eventId] = (re) => {
            isCalled = true;
            resolve(re);
        }

        setTimeout(() => {
            if(isCalled) return;
            try {
                delete watchers[actionName][eventId];
            } catch (e) {
            }

            console.log('timeout', actionName, data);
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



LiquidCore.on('exit', function () {
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


export function createDoc(xmlString){
    
    var doc = cheerio.load(xmlString, { ignoreWhitespace: true, xmlMode: true });
    doc.prototype.click = async function () {
        const element = this.eq(0);
        return await Driver.triggerEventToElement(element.attr(ATTR_ID), 'click');
    }

    doc.prototype.scroll = async function (type) {
        type = type || 'forward';
        const element = this.eq(0);
        return await Driver.triggerEventToElement(element.attr(ATTR_ID), 'scroll-' + type);
    }

    doc.prototype.text = function() {
        return getText(this);
    };

    return doc;
}

export async function getDoc() {
    var viewTree = await Driver.getSource();
    return createDoc(viewTree);
}


export function getText(elems){
    var ret = '',
      len = elems.length,
      elem;
    for (var i = 0; i < len; i++) {
        elem = elems[i];
        if(elem.attribs && elem.attribs.text){
            ret += elem.attribs.text;
        }
        else if (
            elem.children &&
            elem.type !== 'comment' &&
            elem.tagName !== 'script' &&
            elem.tagName !== 'style'
        ) {
            ret += getText(elem.children);
        }
    }
    return ret;
}

global.getDoc = getDoc;
global.sendAction = sendAction;
global.Driver = Driver;
global.getSource = Driver.getSource;