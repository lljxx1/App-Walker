import PlayDetail from './PlayDetail';
import GeneralPage from './GeneralPage';

export default class SimpleWalker {

    constructor(){
        this.pages = [new GeneralPage(this)];
        // this.bind();
    }

    back(){
        console.log('need back');
    }

    // newPage(){
    //     this.pages.push(new GeneralPage(this));
    // }

    // bind(){
    //     listEventChange((event) => {
    //         this.handleEventChange(event);
    //     });
    // }

    // handleEventChange(event){
    //     if(reponse.indexOf('TYPE_WINDOW_STATE_CHANGED') > -1){
    //         console.log("new Page");
    //         this.newPage();
    //     }
    // }

    getCurrentPage(){
        return this.pages[this.pages.length - 1];
    }

    run(){
        return new Promise((resolve, reject) => {
            var self = this;
            (function actionLoop(){
                (async () => {
                    console.log('SimpleWalker run');
                    try{
                        var currentPage = self.getCurrentPage();
                        var $ = await getDoc();
                        await currentPage.identify($);
                        var re = await currentPage.doAction($);
                        if(re){
                            return resolve();
                        }
                    }catch(e){
                        console.log(e);
                    }
                    setTimeout(actionLoop, 200);
                })();
            })();
        });
    }
}
