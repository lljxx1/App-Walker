
// 
export default class PlayDetail {

    constructor(childNode){
        this.childNode = childNode;
    }

    run(){
        return new Promise((resolve, reject) => {
            var isDone = false;
            // var childNodeSelector = elementToSelector(childNode);
            (async () => {
                console.log('PlayDetail.run');
                // var $ = await getDoc();
                var childViewNode = this.childNode;
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
                    }, 2 * 1000);
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
                // 点击后 应该尽量等到下个activity出现
                // await wait(6 * 1000);
                // if(windowChangeCount && clickResult){
                //     for (let index = 0; index < 1; index++) {
                //         await sendAction('doGlobalAction', {
                //             action: 'back'
                //         });
                //         await wait(1000);
                //     }
                // }
                // console.log('windowChangeCount', windowChangeCount);
                // stack.forEach((a, i) => {
                //     console.log('window change', i, a);
                // })
                // console.log('palyDetailNode done');

                // isDone = true;
                // resolve('done');
            })();
        });
    }
    
}