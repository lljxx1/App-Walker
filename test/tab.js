(async () => { 

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
    
    
    var $ = await getDoc(); 
    
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


    // var bottomX = 1500;
    var bottomX = 1185;

    Object.keys(sameSkyLine).forEach((startX) => {
        var nodes = sameSkyLine[startX];
        if(nodes.length > 1){
            nodes.forEach((el) => {
                // console.log( el.attr("class"), el.attr("text"),  el.attr("bounds"));
                
            });

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
    })

    console.log(SameLineUiSet.bottom.nodes[0].text());
})();