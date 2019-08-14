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

class GeneralPage {

    constructor(){
        // this.navigationBar = [];
        // this.tabs = [];
        this.actions = [];
        this.actionIndex = 0;
        this.clicked = {};
        this.actionTree = {};
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
                console.log(clickAbleSiblings.length)
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

        return SameLineUiSet;
    }


    findMainView($){

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

    async identify(){
        
        var $ = await getDoc();
        var tabs = this.findTabs($);
        var mainView = this.findMainView($);

        if(tabs.bottom){
            tabs.bottom.nodes.forEach((node) => {
                var selector = elementToSelector(node);
                var uid = selector + node.index();
                if(!this.actionTree[uid]){
                    this.actions.push({
                        type: 'click',
                        node: node,
                        uid: uid,
                        actions: [
                            {
                                type: 'findTabs',
                                actions: [
                                    {
                                        type: "findContentView",
                                        actions: [
                                            {
                                                type: "scroll",
                                                actions: "click"
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    });
                    this.actionTree[uid] = {
                        action: false
                    };
                    if(mainView){
                        for (let index = 0; index < 20; index++) {
                            this.actions.push({
                                type: 'scroll',
                                node: mainView.node,
                                uid: uid,
                                pending: 2
                            });
                        }
                    }
                }else{
                    this.actionTree[uid] = {
                        type: 'click',
                        node: node,
                        uid: uid
                    }
                }
            });
        }


       
    }

    async doAction(){
        if(!this.actions[this.actionIndex]) this.actionIndex = 0;
        var currentAction = this.actions[this.actionIndex];

        if(!currentAction){
            return;
        }
        

        if(currentAction.type == "click"){
            console.log('doAction');
            currentAction.node.click();
        }   

        if(currentAction.type == "scroll"){
            console.log('doAction');
            currentAction.node.scroll();
        }   

        if(currentAction.pending){
            await wait(currentAction.pending);
        }

        this.actionIndex++;
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
                        await currentPage.identify();
                        await currentPage.doAction();
                    }catch(e){
                        console.log(e);
                    }
                    setTimeout(actionLoop, 200);
                })();
            })();
        });
    }
}
