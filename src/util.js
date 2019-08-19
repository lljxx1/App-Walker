
export function parseBounds(bounds){
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

export function getElementRect(el){
    return parseBounds(el.attr('bounds'));
}


export function findMainView($){
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


export function findListChild(node, height = 500, width = 1000, maxHeight = 1000){
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

export function elementToSelector(node){
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



