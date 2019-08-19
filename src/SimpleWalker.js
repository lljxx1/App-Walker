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

        console.log(element.attr('class') );
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
        console.log( node.attr("class"), node.attr("text"),  node.attr("bounds"), rect)
        if(rect.height > height && rect.width > width){
            if(rect.height < maxHeight) areaEnought.push(node);
        }
    })

    return areaEnought;
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




class PlayTab {

    constructor() {

        this.onlyOne = true;
        this.scrollCount = 3;

    }

    palyDetailNode(childNode){
        return new Promise((resolve, reject) => {
            // var childNodeSelector = elementToSelector(childNode);
            (async () => {
                console.log('palyDetailNode');
                // var $ = await getDoc();
                var childViewNode = childNode;
                // 记录窗口变化次数、回退用
                var windowChangeCount = 0;
                var stackChange = [];

                const handleCallback = (reponse) => {
                    try{
                        console.log(reponse);
                        if(reponse.eventString.indexOf('TYPE_WINDOW_STATE_CHANGED') > -1){
                            stackChange.push(reponse);
                            windowChangeCount++;
                        }
                    }catch(e){
                    }
                    AccessibilityEventEmitter.removeListener('event', handleCallback);
                };

                AccessibilityEventEmitter.on('event', handleCallback);
                
                var clickResult = await childViewNode.click();
                await wait(2 * 1000);
                if(windowChangeCount && clickResult){
                    for (let index = 0; index < 1; index++) {
                        await sendAction('doGlobalAction', {
                            action: 'back'
                        });
                        await wait(1000);
                    }
                }else{
                    console.log(clickResult);
                    console.log(windowChangeCount);
                    console.log(stackChange);
                    // await wait(100 * 1000);
                }
                console.log('windowChangeCount', windowChangeCount);
                resolve('done');
            })();
        });
    }

    async playArticleContent(contentNode){
        var contentNodeSelector = elementToSelector(contentNode);
        var contentViewNode = null;
        for (let index = 0; index < this.scrollCount; index++) {
            var $ = await getDoc();
            contentViewNode = $(contentNodeSelector);
            console.log('playArticleContent', contentNodeSelector); 
            if(index == 0){
                console.log('pull refresh')
                // await contentViewNode.scroll('backward');
                // await wait(2 * 1000);
            }

            // var scrollState = 
            await contentViewNode.scroll();
            // if(!scrollState){
            //     console.log('cannot scroll');
            //     break;
            // }
            // console.log('contentViewNode', scrollState);
            await wait(300);
            var childNodes = findListChild(contentViewNode, 70, 1000, 400);
            console.log('childNodes', childNodes.length);
            // childNodes.forEach((a) => {
            //     console.log(a.attr())
            // });

            await wait(2 * 1000);
            
            for (let nodeIndex = 0; nodeIndex < childNodes.length; nodeIndex++) {
                const childNode = childNodes[nodeIndex];
                // 尝试到详细页
                try{
                    await this.palyDetailNode(childNode);
                    if(this.onlyOne){
                        break;
                    }
                }catch(e){
                    console.log(e);
                }   
            }
        }

        console.log('palyContent done');
    }

    async run(){

        var $ = await getDoc();
        console.log('PlayTab Start')
        var listView = findMainView($);
        if(!listView){
            console.log("listView not found");
            return;
        }

        var parentViewPagers = listView.node.parents("node[class='android.support.v4.view.ViewPager'][scrollable='true']");
        var wrapTab = parentViewPagers.eq(0);
        console.log('parentViewPagers', wrapTab.attr());
        var tabSelector = elementToSelector(wrapTab);
        var listViewSelector = elementToSelector(listView.node);
        console.log('tabSelector', tabSelector);
        var isEnd = false;
        var postion = 'forward';
        console.log('scroll first content');

        var contentCount = 3;
        var contentViewNode = null;

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
                await this.playArticleContent(content.node);
            }

            var $ = await getDoc();
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
    }

    async palyContent(contentNode){
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
}



class GeneralPage {

    constructor(){
        this.navigationBarSelector = null;
        this.secondTabs = null;
        this.secondTabIndex = 0;
        this.currentBarIndex = 0;
        
    }

    findTabs($){
        var CLICK_ABLE = "[clickable='true']";
        var clickElements = $(CLICK_ABLE);
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
            sameSkyLine[rect.y] = sameSkyLine[rect.y] || [];
            sameSkyLine[rect.y].push(el);
            // console.log( el.attr("class"), el.attr("text"),  el.attr("bounds"))
        });


        var SameLineUiSet = {};

        Object.keys(sameSkyLine).forEach((startX) => {
            var nodes = sameSkyLine[startX];
            if(nodes.length > 1){
                nodes.forEach((el) => {
                    // console.log( el.attr("class"), el.attr("text"),  el.attr("bounds"));
                    
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

        return SameLineUiSet;
    }

   
    async identify($){
        var tabs = this.findTabs($);
        if(tabs.bottom && !this.navigationBarSelector){
            this.navigationBarSelector = elementToSelector(tabs.bottom.nodes[0]);
        }
    }

    async playTab(){
        await new PlayTab().run();
        console.log('playTab done');
    }

    async doAction($){
        var allTabs = $(this.navigationBarSelector);
        if(this.currentBarIndex >= allTabs.length){
            this.currentBarIndex = 0;
            console.log('done');
            return;
        }

        var currentNavTab = allTabs.eq(this.currentBarIndex);
        if(currentNavTab){
            currentNavTab.click();
            await wait(3000);
            await this.playTab();
        }

        this.currentBarIndex++;
    }
}

export default class SimpleWalker {

    constructor(){
        this.pages = [new GeneralPage(this)];
        this.bind();
    }

    back(){
        console.log('need back');
    }

    newPage(){
        this.pages.push(new GeneralPage(this));
    }

    bind(){
        listEventChange((event) => {
            this.handleEventChange(event);
        });
    }

    handleEventChange(event){
        if(reponse.indexOf('TYPE_WINDOW_STATE_CHANGED') > -1){
            console.log("new Page");
            this.newPage();
        }
    }

    getCurrentPage(){
        return this.pages[this.pages.length - 1];
    }

    run(){
        return new Promise((resolve, reject) => {
            var self = this;
            (function actionLoop(){
                (async () => {
                    console.log('SimpleWalker run');
                    try{
                        var currentPage = self.getCurrentPage();
                        var $ = await getDoc();
                        await currentPage.identify($);
                        await currentPage.doAction($);
                    }catch(e){
                        console.log(e);
                    }
                    setTimeout(actionLoop, 200);
                })();
            })();
        });
    }
}
