
const cheerio = require('cheerio');
var _ = {
    merge: require('lodash/merge'),
    defaults: require('lodash/defaults')
};


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
            console.log('timeout', actionName, JSON.stringify(data));
            reject('timeout');
        }, timeout);

        console.log('send', actionName, JSON.stringify(data));
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
        var status = false;
        try{
            status = await Driver.triggerEventToElement(element.attr(ATTR_ID), 'click');
        }catch(e){
        }
        return status;
    }

    doc.prototype.scroll = async function (type) {
        type = type || 'forward';
        const element = this.eq(0);
        var status = false;
        try{
            status = await Driver.triggerEventToElement(element.attr(ATTR_ID), 'scroll-' + type);
        }catch(e){
        }
        return status;
    }

    doc.prototype.text = function() {
        return getText(this);
    };


    function parseBounds(bounds){
        bounds = bounds.split('][');
        var boundsOne = bounds[0].replace('[', '').split(',')
        var boundsTwo = bounds[1].replace(']', '').split(',');
        return {
            x: parseInt(boundsOne[0]),
            y: parseInt(boundsOne[1]),
            width: boundsTwo[0] - boundsOne[0],
            height: boundsTwo[1] - boundsOne[1]
        }
    }
    
    function getElementRect(el){
        return parseBounds(el.attr('bounds'));
    }

    doc.prototype.getElementRect = function(){
        return getElementRect(this);
    }

    doc.prototype.getArea = function(){
        var rect = getElementRect(this);
        return rect.width * rect.height;
    }

    doc.prototype.isClickable = function(){
        return this.attr('clickable') == "true";
    }

    doc.prototype.isScrollable = function(){
        return this.attr('scollable') == "true";
    }

    doc.prototype.filterClickable = function(){
        var els = [];
        for (let index = 0; index < this.length; index++) {
            const element = this.eq(index);
            if(element.isClickable()){
                els.push(element);
            }
        }
        return this._make(els);
    }


    doc.prototype.toSelector = function(includeSelf){
        try{
            var parent = [];
            var startNode = this;
            for (let index = 0; index < 20; index++) {
                if(startNode.length == 0) break;
                var className = startNode.attr('class');
                if(className) {
                    var currentSelector = [startNode[0].tagName, "[class='"+className+"']"].join('')
                    parent.push(currentSelector);
                }else{
                    parent.push(startNode[0].tagName);
                };
                startNode = startNode.parent();
            }
            // console.log(parent.reverse().join(" > "), node.attr('class'), node.index());
            return parent.reverse().join(" > ");
        }catch(e){
            console.log(e);
        }
    }


    function getSelector(direc){
        var selector = "[scrollable='true']";
        if(direc){
            selector = "[scroll-"+direc+"='true']";
        }
        return selector;
    }



    _.merge(doc, {
        scrollForwardAble: function(){
            return this(getSelector('forward'));
        },

        scrollBackwardAble: function(){
            return this(getSelector('backward'));
        },

        scrollable: function(direc){
            return this(getSelector(direc));
        },

        clickable: function(){
            return this("[clickable='true']");
        },

        tabs: function(type, maxHeight = 1185){
            var clickElements = this.clickable();
            var els = [];
            for (let index = 0; index < clickElements.length; index++) {
                const clickElement = clickElements.eq(index);
                const clickAbleSiblings = clickElement.siblings().filterClickable();
                try{
                    if(clickAbleSiblings.length > 1){
                        els.push(clickElement);
                    }
                }catch(e){
                    console.log('findError', e.toString());
                }
            }

            var sameSkyLine = {};

            els.forEach((el) => {
                var rect = el.getElementRect();
                sameSkyLine[rect.y] = sameSkyLine[rect.y] || [];
                sameSkyLine[rect.y].push(el);
            });

            var SameLineUiSet = {};
            var bottomX = maxHeight;

            Object.keys(sameSkyLine).forEach((startX) => {
                var nodes = sameSkyLine[startX];
                if(nodes.length > 1){

                    var position = 'nav';
                    if(startX > bottomX){
                        position = 'bottom' 
                    }

                    if(startX > 100 && startX < bottomX){
                        position = 'top' 
                    }

                    SameLineUiSet[position] = {
                        startX: startX,
                        position: position,
                        nodes: nodes
                    }
                }
            });

            if(type){
                if(SameLineUiSet[type]){
                    return clickElements._make(SameLineUiSet[type].nodes);
                }
                return null;
            }else{
                var all = {};
                for(var atype in SameLineUiSet){
                    all[atype] = clickElements._make(SameLineUiSet[atype].nodes);
                }
            }
        },

        mainContentView: function(){
            var scrollableElements = this.scrollable();
            var contentViewByBigArea = null;

            for (let index = 0; index < scrollableElements.length; index++) {
                const element = scrollableElements.eq(index);
                // 排除滚屏组件
                if(element.attr('class') == "android.support.v4.view.ViewPager"){
                    continue;
                }

                // 排除banner
                if(element.attr('class') == "android.widget.HorizontalScrollView"){
                    continue;
                }

                var area = element.getArea();
                var comp = {
                    area: area,
                    node: element
                };

                // android.support.v4.view.ViewPager
                if(contentViewByBigArea == null){
                    contentViewByBigArea = comp
                }else{
                    if(comp.area > contentViewByBigArea.area){
                        contentViewByBigArea = comp;
                    }
                }
            }

            if(contentViewByBigArea){
                return contentViewByBigArea.node;
            }

            return contentViewByBigArea;
        }
    });

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