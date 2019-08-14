var ws = require("nodejs-websocket")


async function testCode(){
    var $ = await getDoc();
    var CLICK_ABLE = "[clickable='true']";
    var clickElements = $(CLICK_ABLE);
    var els = [];

    async function wait(du){
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve();
            }, du);
        })
    }

    for (let index = 0; index < clickElements.length; index++) {
        const clickElement = clickElements.eq(index);
        try{
            const clickAbleSiblings = clickElement.siblings(CLICK_ABLE);
            if(clickAbleSiblings.length > 1){
                els.push(clickElement);
            }
            console.log(clickAbleSiblings.length)
        }catch(e){
            console.log('findError', e.toString());
        }
        // console.log(clickAbleSiblings.length);
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
    
    var sameSkyLine = {};

    els.forEach((el) => {
        var rect = getElementRect(el);
        sameSkyLine[rect.y] = sameSkyLine[rect.y] || [];
        sameSkyLine[rect.y].push(el);
        // console.log( el.attr("class"), el.attr("text"),  el.attr("bounds"))
    });


    var SameLineUiSet = {};

    Object.keys(sameSkyLine).forEach((startX) => {
        var nodes = sameSkyLine[startX];
        if(nodes.length > 1){
            nodes.forEach((el) => {
                console.log( el.attr("class"), el.attr("text"),  el.attr("bounds"));
            });

            var position = 'nav';

            if(startX > 1500){
                position = 'bottom' 
            }

            if(startX > 100 && startX < 1500){
                position = 'top' 
            }

            SameLineUiSet[position] = {
                startX: startX,
                position: position,
                nodes: nodes
            }
            // SameLineUiSet.push();
        }
    })


    SameLineUiSet.bottom.nodes.forEach((node) => {

        try{
            var parent = [];
            var startNode = node;
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
            console.log(parent.reverse().join(" > "), node.attr('class'), node.index());
        }catch(e){
            console.log(e);
        }
    })

    return;
    if(SameLineUiSet.bottom){
        var tabs = SameLineUiSet.bottom.nodes;
        var round = 0;
        (async function loop(){
            if(round > 10) return;
            return;
            console.log('rund');

            try{
                for (let index = 0; index < tabs.length; index++) {
                    const tab = tabs[index];
                    console.log('send click');
                    tab.click();
                    await wait(10 * 1000);
                }
            }catch(e){
                console.log(e);
            }

            round++;
            setTimeout(loop, 1000);
        })();
    }

    var Scrollable = "[scrollable='true']";
    var scrollableElements = $(Scrollable);
    console.log(scrollableElements.length);

    var contentViewByArea = [];
    var contentViewByBigArea = null;

    for (let index = 0; index < scrollableElements.length; index++) {
        const element = scrollableElements.eq(index);
        if(element.attr('class') == "android.support.v4.view.ViewPager"){
            continue;
        }

        var rect = getElementRect(element);
        var comp = {
            rect: rect,
            area: rect.width * rect.height,
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

        contentViewByArea.push({
            rect: rect,
            area: rect.width * rect.height,
            node: element
        });
        console.log( element.attr("class"), element.attr("text"),  element.attr("bounds"));
    }

    console.log(contentViewByBigArea);
    
    for (let index = 0; index < 20; index++) {
        // const element = array[index];
        console.log(index, 'scroll')
        contentViewByBigArea.node.scroll();
        await wait(3 * 1000);
    }
}



url = "ws://192.168.41.120:8003/";
// url = "ws://192.168.31.211:8003/";
// url = "ws://127.0.0.1:8001/";
var codeRwap = testCode.toString()+"; testCode();";
var con = ws.connect(url, () => {
    console.log('connected');
    con.sendText(codeRwap);
})


