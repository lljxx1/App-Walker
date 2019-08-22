var ws = require("nodejs-websocket")


async function testCode1(){
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



async function testCode(){

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

    function elementToSelector(node){
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
            // console.log(parent.reverse().join(" > "), node.attr('class'), node.index());
            return parent.reverse().join(" > ");
        }catch(e){
            console.log(e);
        }
    
        return null;
    }


    function findListChild(node, height = 500, width = 1000, maxHeight = 1000){
        var CLICK_ABLE = "[clickable='true']";
        var clickElements = node.find(CLICK_ABLE);
        var els = [];

        for (let index = 0; index < clickElements.length; index++) {
            const clickElement = clickElements.eq(index);
            try{
                const clickAbleSiblings = clickElement.siblings(CLICK_ABLE);
                if(clickAbleSiblings.length > 1){
                    els.push(clickElement);
                }
            }catch(e){
                console.log('findError', e.toString());
            }
        }


        var sameSkyLine = {};

        els.forEach((el) => {
            var rect = getElementRect(el);
            sameSkyLine[rect.x] = sameSkyLine[rect.x] || [];
            sameSkyLine[rect.x].push(el);
          
        });

        // console.log(sameSkyLine[0]);
        if(!sameSkyLine['0']){
            return [];
        }


        var areaEnought = [];
        // 面积过滤
        sameSkyLine['0'].forEach((node) => {
            var rect = getElementRect(node);
            if(rect.height > height && rect.width > width){
                if(rect.height < maxHeight) areaEnought.push(node);
            }
        })

        return areaEnought;
    }

    function findMainView($){

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
        }

        return contentViewByBigArea;
    }

    
    var $ = await getDoc();
    console.log('findMainView')
    var listView = findMainView($);
    if(!listView){
        console.log("listView not found");
        return;
    }

    var parentViewPagers = listView.node.parents("node[class='android.support.v4.view.ViewPager'][scrollable='true']");
    
    console.log('parentViewPagers', parentViewPagers.eq(0).attr());

    var wrapTab = parentViewPagers.eq(0);
    console.log('parentViewPagers', wrapTab.attr());


    var tabSelector = elementToSelector(wrapTab);
    var listViewSelector = elementToSelector(listView.node);
    // listView.node.scroll();
    // await wait(1000);
    // wrapTab.scroll();


    // test play Tab
    // var $ = await getDoc();
    // var wrapTab = $(tabSelector);
    // for (let index = 0; index < 3; index++) {
    //     var clickResults = await wrapTab.scroll();
    //     console.log('clickResults', clickResults)
    //     await wait(10 * 1000);
    // }

    // console.log('done');
    // return;

    console.log('tabSelector', tabSelector);
    var isEnd = false;
    var postion = 'forward';
    // await listViewSelector.scroll();

    console.log('scroll first content');

    var contentCount = 3;
    var contentViewNode = null;

    // for (let index = 0; index < contentCount; index++) {
    //     var $ = await getDoc();
    //     contentViewNode = $(listViewSelector);
    //     if(index == 0){
    //         await contentViewNode.scroll('backward');
    //         await wait(3 * 1000);
    //     }
    //     console.log('contentViewNode');
    //     await contentViewNode.scroll();
    //     await wait(100);

    //     // var childNodes = findListChild(contentViewNode);
    //     if(childNodes.length){
    //         // await childNodes[0].click();
    //         break;
    //     }
    // }
    await playArticleContent(listView.node);

    return;


    function palyDetailNode(childNode){
        return new Promise((resolve, reject) => {
            // var childNodeSelector = elementToSelector(childNode);
            (async () => {

                console.log('palyDetailNode');
                // var $ = await getDoc();
                var childViewNode = childNode;
    
                // 记录窗口变化次数、回退用
                var windowChangeCount = 0;
                var stack = [];
                LiquidCore.on('onAccessibilityEvent', (reponse) => {
                    try{
                        if(reponse.indexOf('TYPE_WINDOW_STATE_CHANGED') > -1){
                            windowChangeCount++;
                            stack.push(reponse);
                        }
                    }catch(e){
                    }
                });
                
                var clickResult = await childViewNode.click();
                await wait(2 * 1000);
                if(windowChangeCount && clickResult){
                    for (let index = 0; index < 1; index++) {
                        await sendAction('doGlobalAction', {
                            action: 'back'
                        });
                        await wait(1000);
                    }
                }
                console.log('windowChangeCount', windowChangeCount);
                stack.forEach((a, i) => {
                    console.log('window change', i, a);
                })
                console.log('palyDetailNode done');
                resolve('done');
            })();
        });
    }

    async function playArticleContent(contentNode){
        var contentNodeSelector = elementToSelector(contentNode);
        var contentViewNode = null;
        var listViewChildSelector = null;

        var $ = await getDoc();
        contentViewNode = $(contentNodeSelector);

        var useClickTest = true;

        console.log('useClickTest', useClickTest);

        if(useClickTest){
            var testStartNode = contentViewNode;
            var fistEl = null;
            for (let index = 0; index < 5; index++) {
                var allIsClickAble = true;
                var contentChildrens = testStartNode.children();
                var clickAbleLength = contentChildrens.find("[clickable='true']");
                var clickablePercent = clickAbleLength.length / contentChildrens.length * 100;
                // 如果80%可点 认为是列表节点？
                if(clickablePercent > 80){
                    fistEl = contentChildrens.eq(0);
                    break;
                }
            }

            if(fistEl){
                listViewChildSelector = elementToSelector(fistEl);
            }
        }else{
            // 定位列表页的列表项的选择器
            var childNodes = findListChild(contentViewNode, 70, 1000, 400);
            if(childNodes.length){
                listViewChildSelector = elementToSelector(childNodes[0]);
            }
        }


        // console.log(contentViewNode.children().eq(0).attr());
        // return;

        for (let index = 0; index < 10; index++) {
            // 尝试点到详细页
            if(listViewChildSelector){
                var $ = await getDoc();
                var childNode = $(listViewChildSelector).eq(0);
                try{
                    await palyDetailNode(childNode);
                }catch(e){
                    console.log(e);
                } 
            }

            // 滚动
            await contentViewNode.scroll();
            await wait(300);
        }

        console.log('palyContent done');
    }

    async function palyContent(contentNode){
        var contentNodeSelector = elementToSelector(contentNode);
        var contentViewNode = null;
        for (let index = 0; index < contentCount; index++) {
            var $ = await getDoc();
            contentViewNode = $(contentNodeSelector);
            if(index == 0){
                await contentViewNode.scroll('backward');
                await wait(10 * 1000);
            }
            var scrollState = await contentViewNode.scroll();
            console.log('contentViewNode', scrollState);
            await wait(300);
        }

        console.log('palyContent done');
    }

    var round = 0;
    var roundLimit = 10;

    for (let index = 0; index < 40; index++) {
        if(round > roundLimit){
            break;
        }
        var $ = await getDoc();
        var content = findMainView($);
        if(content){
            // await palyContent(content.node);
            await playArticleContent(content.node);
        }

        wrapTab = $(tabSelector);
        var clickResults = await wrapTab.scroll(postion);
        console.log('clickResults', clickResults);
        if(!clickResults){
            console.log('change direction');
            isEnd = true;
            postion = postion == 'backward' ? 'forward' : 'backward';
            round++;
        }
        await wait(1000);
    }
        
    console.log('done');
}


url = "ws://192.168.41.120:8003/";
// url = "ws://192.168.31.211:8003/";
// url = "ws://127.0.0.1:8001/";
var codeRwap = testCode.toString()+"; testCode();";
var con = ws.connect(url, () => {
    console.log('connected');
    con.sendText(codeRwap);
})


