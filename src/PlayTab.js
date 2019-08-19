import PlayDetail from './PlayDetail';
import {
    elementToSelector,
    findListChild,
    findMainView
} from './util';


export default class PlayTab {

    constructor() {
        this.onlyOne = true;
        this.scrollCount = 3;
        this.quickMode = true;
    }

    async palyDetailNode(childNode){
        await new PlayDetail(childNode).run();
    }

    async playArticleContent(contentNode){
        
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
        for (let index = 0; index < 5; index++) {
            var $ = await getDoc();
            contentViewNode = $(contentNodeSelector);

            // 前三次
            if(index < 4){
                // 尝试点到详细页
                if(listViewChildSelector){
                    var childNode = $(listViewChildSelector).eq(0);
                    try{
                        await this.palyDetailNode(childNode);
                    }catch(e){
                        console.log(e);
                    } 
                }
            }

            await wait(1000);

            // 滚动
            await contentViewNode.scroll();
            await wait(500);
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

        // android.widget.HorizontalScrollView

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
        var roundLimit = 2;

        for (let index = 0; index < 40; index++) {
            if(round > roundLimit){
                break;
            }

            if(this.quickMode && index > 5){
                console.log('quick mode skip', index);
                break;
            }

            var $ = await getDoc();
            var content = findMainView($);
            if(content){
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
                break;
            }
            await wait(1000);
        }
    }

}
