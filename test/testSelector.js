var fs = require('fs');
var cheerio = require('cheerio');
viewTree = fs.readFileSync('test.xml', 'utf-8');



var selector = `hierarchy > node[class='android.widget.FrameLayout'] > node[class='android.widget.LinearLayout'] > node[class='android.widget.FrameLayout'] > node[class='android.widget.LinearLayout'] > node[class='android.widget.TabHost'] > node[class='android.widget.FrameLayout'] > node[class='android.widget.TabWidget'] > node[class='android.widget.RelativeLayout']`;



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
        return getText(this);
    };
    
    return doc;
}



var doc = createDoc(viewTree);
var nodes = doc(selector);

console.log(nodes.length);


function getText(elems){
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

// var text = getText(nodes.eq(1));
console.log(nodes.eq(1).text());