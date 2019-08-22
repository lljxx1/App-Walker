


function wait(du){
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve();
		}, du);
	})
}


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
                }, 10 * 1000);
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



(function actionLoop(){

    var maxRound = 1000;
    var rounCount = 0;


    (async () => {

        if(rounCount > maxRound){
            return;
        }

        var tabIndex = 0;
        var tabFound = false;

        var $ = await getDoc();
        var bootomTab = $.tabs('bottom');

        if(!tabFound){
            if(bootomTab){
                tabFound = true;
            }
        }

        if(tabFound){
            await bootomTab.eq(tabIndex).click();

            var $ = await getDoc();
            var mainView = $.mainContentView();
            if(mainView){


                var childSelector = mainView.children("[clickable='true']").eq(0).toSelector();

                for (let index = 0; index < 10; index++) {
                    var childs = $(childSelector);
                    if(childs.length){
                        await PlayDetail(childs.eq(0));
                    }
                    

                    

                }




                console.log(childSelector);


                await $.mainContentView().scroll();




            }
            
        }
        

        rounCount++;
        setTimeout(actionLoop, 200);
    })();
})();