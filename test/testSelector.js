var fs = require('fs');
var cheerio = require('cheerio');
viewTree = fs.readFileSync('test.xml', 'utf-8');
var _ = {
    merge: require('lodash/merge'),
    defaults: require('lodash/defaults')
};


var selector = `hierarchy > node[class='android.widget.FrameLayout'] > node[class='android.widget.LinearLayout'] > node[class='android.widget.FrameLayout'] > node[class='android.widget.LinearLayout'] > node[class='android.widget.TabHost'] > node[class='android.widget.FrameLayout'] > node[class='android.widget.TabWidget'] > node[class='android.widget.RelativeLayout']`;




cheerio.prototype.ttt = function(){


}


function createDoc(xmlString){
    
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
        console.log(this.length);
        return getText(this);
    };

    doc.prototype.scrollable = function(){
        return this.text();
    }

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

            return contentViewByBigArea.node;
        }
    });
    
    return doc;
}



var doc = createDoc(viewTree);
var nodes = doc(selector);

function getText(elems){
    var ret = '',
      len = elems.length,
      elem;
    for (var i = 0; i < len; i++) {
        elem = elems[i];
        if(!elem) continue;
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

// var text = getText(nodes.eq(1));
// console.log(nodes.eq(1).text());
// console.log(doc.clickable().eq(0).siblings().filterClickable().eq(0).text())
// console.log(doc.tabs('bottom').eq(2).text())
// console.log(doc.mainContentView().toSelector())