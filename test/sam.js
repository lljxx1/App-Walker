


// 遍历子页
async function WalkPager(mainViewPagerSelector, func, guarder, maxLimit = 10){
    var $ = await getDoc();
    var mainViewPager = $(mainViewPagerSelector);
    let direction = null;

    if(mainViewPager.attr('scroll-forward') == "true"){
        direction = "forward";
    }else{
        if(mainViewPager.attr('scroll-backward') == "true"){
            direction = "backward";
        }
    }

    for (let tabCount = 0; tabCount < maxLimit; tabCount++) {

        if(!guarder.shouldKeep()){
            break;
        }

        var $ = await getDoc();
        var currentPager = await $(mainViewPagerSelector);
        if(!currentPager.attr("scroll-"+direction)){
            console.log('canot scroll anymore')
            break;
        }
        try{
            await func();
        }catch(e){
            console.log(e);
        }

        var $ = await getDoc();
        var result = await $(mainViewPagerSelector).scroll(direction);
        console.log('scroll to next channel', tabCount, result);
        await wait(2 * 1000);
    }
}


// 点击内容页
function PlayDetail(childNode, guarder) {
    return new Promise((resolve, reject) => {
        var isDone = false;
        (async () => {
            console.log('PlayDetail.run');
            var childViewNode = childNode;
            // 记录窗口变化次数、回退用
            var windowChangeCount = 0;
            var clicked = false;
            var stack = [];

            const onCallback = (reponse) => {
                if(isDone) return;
                try{
                    if(reponse.indexOf('TYPE_WINDOW_STATE_CHANGED') > -1){
                        windowChangeCount++;
                        stack.push(reponse);
                        handleActivityIn();
                    }
                }catch(e){
                }
            }

            LiquidCore.on('onAccessibilityEvent', onCallback);

            var _isCalled = false;

            function handleActivityIn(){
                if(_isCalled) return;
                LiquidCore.removeListener('onAccessibilityEvent', onCallback);
                _isCalled = true;
                // 3秒后准备返回列表页
                setTimeout(() => {
                    isDone = true;
                    (async () => {
                        await excutePlugin('detailPage', guarder);
                        await sendAction('doGlobalAction', {
                            action: 'back'
                        });
                        resolve('done');
                    })();
                }, 8 * 1000);
            }
            

            var clickResult = await childViewNode.click();
            if(!clickResult){
                console.log('click failed');
                await wait(1000);
                resolve('done');
            }else{
                clicked = true;
            }

            // 超时处理
            setTimeout(() => {
                if(isDone) return;
                _isCalled = true;
                isDone = true;
                resolve('timeout');
            }, 15 * 1000);
        })();
    });
};


// 遍历内容列表
async function WalkListView(guarder, count = 3, articleCountLimit = 6){

    var $ = await getDoc();
    var mainView = $.mainContentView();

    if(!mainView){
        console.log('this tab has no mainView');
        return;
    }

    var mainViewSelector = mainView.toSelector();
    var childSelector = mainView.children("[clickable='true']").eq(0).toSelector();

    var clickCache = {};
    var articleCount = 0;

    for (let index = 0; index < count; index++) {

        if(!guarder.shouldKeep()){
            break;
        }

        var $ = await getDoc();
        var childs = $(childSelector);

        for (let childIndex = 0; childIndex < childs.length; childIndex++) {

            if(articleCount > articleCountLimit){
                break;
            }

            var $ = await getDoc();
            var child = $(childSelector).eq(childIndex);
            var eid = child.attr('element-id');

            // 防止重复点
            if(!clickCache[eid]){
                await PlayDetail(child, guarder);
                clickCache[eid] = 1;
                articleCount++;
                await wait(2 * 1000);
            }

            if(!guarder.shouldKeep()){
                break;
            }
        }

        await wait(2 * 1000);

        // 重新获取
        var $ = await getDoc();
        mainView = $(mainViewSelector);

        // 找不到主要view了
        if(!mainView.length){
            console.log('where im i ?')
            break;
        }

        await mainView.scroll();
        await wait(3 * 1000);

    }
}



// 遍历导航
async function WaklNavigationBar(mainFunc, guarder, retryTimes =  100){

    var tabFound = false;
    var totalNavbar = 0;
    var tabSelector = null;

    for (let index = 0; index < retryTimes; index++) {

        if(!guarder.shouldKeep()){
            break;
        }

        if(tabFound){
            break;
        }

        var $ = await getDoc();
        var bootomTab = $.tabs('bottom');
        if(bootomTab){
            tabFound = true;
            tabSelector = bootomTab.eq(0).toSelector();
            totalNavbar = bootomTab.length;
        }

        var cliks = $.clickable();
        if(cliks.length){
            guarder.setPackageName(cliks.eq(0).attr('package'));
        }

        await wait(2 * 1000);
    }

    console.log('tabSelector', tabSelector);

    var excludeTabNames = ['通知', '登录', '消息', '会员', '我的'];

    for (let index = 0; index < totalNavbar; index++) {

        if(!guarder.shouldKeep()){
            break;
        }

        var $ = await getDoc();
        var tabBarItem = $(tabSelector).eq(index);

        if(tabBarItem){
            var tabBarItemText = tabBarItem.text();
            var nameIsInBlackList = false;
            excludeTabNames.forEach(name => {
                if(tabBarItemText.indexOf(name) > -1){
                    nameIsInBlackList = true;
                }
            })

            if(nameIsInBlackList){
                console.log('skip tabBarItem', tabBarItemText);
                continue;
            }

            console.log('Start Tab', index);
            var clickResult = await tabBarItem.click();
            console.log('Switch to Tab', index, clickResult);
            await wait(1 * 1000);

            try{
                await mainFunc(tabBarItemText);
            }catch(e){
                console.log(e);
            }
        }
    }

    console.log('WaklNavigationBar done');
}


var lastApp = null;


// 遍历某个App
async function WalkApp(appName, guarder){

    if(lastApp){
        await sendAction('stopApp', {
            appName: lastApp
        });

        await wait(10 * 1000);
    }

    await sendAction('launchPackage', {
        appName: appName
    });

    await wait(10 * 1000);

    lastApp = appName;

    await WaklNavigationBar(async (tabName) => {

        var mainView = null;
        for (let index = 0; index < 10; index++) {
            if(mainView) break;
            var $ = await getDoc();
            mainView = $.mainContentView();
            await wait(1 * 1000);
        }

        if(!mainView){
            console.log('mainView still not Found');
            return;
        }
        
        var mainViewPager = mainView.parents("node[class='android.support.v4.view.ViewPager'][scrollable='true']").eq(0);
        var mainViewPagerSelector = mainViewPager.toSelector();
        console.log('Play', tabName);

        await WalkPager(mainViewPagerSelector, async () => {
            var mainView = null;
            for (let index = 0; index < 10; index++) {
                if(mainView) break;
                var $ = await getDoc();
                mainView = $.mainContentView();
                await wait(1 * 1000);
            }

            if(!mainView){
                console.log('mainView not found');
            }

            await WalkListView(guarder);
        }, guarder)
    }, guarder);
}


var appNames = ['知乎', '今日头条'];
var appIndex = 0;
var lastApp = null;

async function playApp(appName){

    await sendAction('launchPackage', {
        appName: appName
    });

    await wait(10 * 1000);

    if(lastApp){
        await sendAction('stopApp', {
            appName: lastApp
        });
    }

    try{
        await WalkApp(appName);
    }catch(e){
        console.log(e);
    }

    lastApp = appName;
}




function Guard() {
    var stooped = false, packageName = null;
    return {
        setPackageName(name){
            packageName = name;
        },

        getPackageName(){
            return packageName;
        },

        stop(){
            console.log("Should Stop");
            stooped = true;
        },

        shouldKeep(){
            return !stooped;
        }
    }
}


var plugins = {};

function registerPlugin(type, pkg, handler){
    plugins[type] = plugins[type] || {};
    plugins[type][pkg] = handler;
}


async function excutePlugin(type, guarder){
    var pkg = guarder.getPackageName();
    if(pkg){
        console.log('excutePlugin', pkg);
        if(plugins[type] && plugins[type][pkg]){
            try{
                await plugins[type][pkg](guarder);
            }catch(e){
                console.log('excutePlugin error', e)
            }
        }
    }
}


// 内页下一个回答
registerPlugin('detailPage', 'com.zhihu.android', async (guarder) => {
    for (let index = 0; index < 3; index++) {
        var $ = await getDoc();
        var nextAnwser = $("[resource-id='com.zhihu.android:id/next_answer_animation_view']");
        if(!nextAnwser.length){
            break;
        }
        var clickResult = await nextAnwser.click();
        console.log('click next answser', clickResult)
        await wait(10 * 1000);
    }
});


function actionLoop(){
    (async () => {
        if(!appNames[appIndex]){
            appIndex = 0;   
        }
        var appName = appNames[appIndex];
        try{
            var guarder = new Guard();
            setTimeout(() => {
                guarder.stop();
            }, 180 * 1000);
            await WalkApp(appName, guarder);
        }catch(e){
            console.log('playApp', e);
        }

        appIndex++;

        await wait(5 * 1000);
        setTimeout(actionLoop, 200);
    })();
}

(async () => {
    actionLoop();
    // var guarder = new Guard();
    // setTimeout(() => {
    //     guarder.stop();
    // }, 120 * 1000);
    // WalkApp('知乎', guarder);
})();