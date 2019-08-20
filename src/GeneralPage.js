import PlayTab from './PlayTab';
import {
    elementToSelector,
    getElementRect
} from './util';

export default class GeneralPage {

    constructor(){
        this.navigationBarSelector = null;
        this.secondTabs = null;
        this.secondTabIndex = 0;
        this.currentBarIndex = 0;
        this.failedCount = 0;
        
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

        if(this.failedCount > 200){
            return 'failed';
        }

        if(!this.navigationBarSelector){
            console.log('wait app tab ready');
            this.failedCount++;
            return;
        }


        this.failedCount = 0;

        var allNativeTabs = $(this.navigationBarSelector);
        var excludeTabNames = ['通知', '登录', '消息', '会员', '我的'];
        var allTabs = [];

        for (let index = 0; index < allNativeTabs.length; index++) {
            const allNativeTab = allNativeTabs.eq(index);
            const tabName = allNativeTab.text();
            if(tabName){
                var isInBlackList = false;
                excludeTabNames.forEach((excludeTabName) => {
                    if(tabName.indexOf(excludeTabName) > -1){
                        isInBlackList = true;
                        console.log(tabName, excludeTabName);
                    }
                });
                if(!isInBlackList){
                    allTabs.push(allNativeTab);
                }
            }
        }


        if(allTabs.length == 0 && this.currentBarIndex == 0){
            console.log('wait app tab ready');
            return;
        }

        if(this.currentBarIndex >= allTabs.length){
            this.currentBarIndex = 0;
            console.log('done');
            return 'done';
        }

        // var currentNavTab = allTabs.eq(this.currentBarIndex);
        var currentNavTab = allTabs[this.currentBarIndex];

        if(currentNavTab){
            currentNavTab.click();
            await wait(8 * 1000);
            await this.playTab();
        }

        this.currentBarIndex++;
    }
}