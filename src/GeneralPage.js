import PlayTab from './PlayTab';
import {
    elementToSelector,
    findTabs
} from './util';

export default class GeneralPage {

    constructor(){
        this.navigationBarSelector = null;
        this.secondTabs = null;
        this.secondTabIndex = 0;
        this.currentBarIndex = 0;
        this.failedCount = 0;
    }

    async identify($){
        var tabs = findTabs($);
        if(tabs.bottom && !this.navigationBarSelector){
            this.navigationBarSelector = elementToSelector(tabs.bottom.nodes[0]);
        }
        console.log('identify', Object.keys(tabs));
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
            console.log('playTab', this.currentBarIndex, currentNavTab.text());
            currentNavTab.click();
            await wait(8 * 1000);
            await this.playTab();
            this.currentBarIndex++;
        }
    }
}