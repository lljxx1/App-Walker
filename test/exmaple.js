function PlayDetail(childNode) {
    return new Promise((resolve, reject) => {
        var isDone = false;
        (async () => {
            console.log('PlayDetail.run');
            var childViewNode = childNode;
            // 记录窗口变化次数、回退用
            var windowChangeCount = 0;
            var clicked = false;
            var stack = [];

            LiquidCore.on('onAccessibilityEvent', (reponse) => {
                if(isDone) return;
                try{
                    if(reponse.indexOf('TYPE_WINDOW_STATE_CHANGED') > -1){
                        windowChangeCount++;
                        stack.push(reponse);
                        handleActivityIn();
                    }
                }catch(e){
                }
            });

            var _isCalled = false;

            function handleActivityIn(){
                if(_isCalled) return;
                _isCalled = true;
                // 3秒后准备返回列表页
                setTimeout(() => {
                    isDone = true;
                    (async () => {
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


(async () => { 
    var $ = await getDoc();
    var mainView = $.mainContentView();

    var childSelector = mainView.children("[clickable='true']").eq(0).toSelector();
    var mainViewPager = mainView.parents("node[class='android.support.v4.view.ViewPager'][scrollable='true']").eq(0);
    var mainViewPagerSelector = mainViewPager.toSelector();
    

    for (let index = 0; index < 10; index++) {

        

    }


    for (let index = 0; index < 10; index++) {
        var $ = await getDoc();
        var childs = $(childSelector);

        if(childs.length) {
            await PlayDetail(childs.eq(0));
        }

        await wait(3 * 1000);

        var $ = await getDoc();
        mainView = $.mainContentView();
        await mainView.scroll();
        await wait(3 * 1000);
    }

    console.log('all done')
})();


(async () => {
    var $ = await getDoc();
    var mainView = $.mainContentView();
    console.log(mainView.children().eq(0).attr());
})();