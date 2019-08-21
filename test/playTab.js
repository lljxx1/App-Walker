(async () => { 

    function findMainView($){
        var Scrollable = "[scrollable='true']";
        var scrollableElements = $(Scrollable);
        console.log(scrollableElements.length);
    
        var contentViewByArea = [];
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
    
    
    
    var $ = await getDoc(); 
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

    var $ = await getDoc();
    wrapTab = $(tabSelector);
    var res = await wrapTab.scroll(postion);
    console.log(res, postion, wrapTab.attr('element-id'));
})();