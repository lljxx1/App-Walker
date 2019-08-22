

(async () => { 
    var $ = await getDoc();
    console.log($.tabs('bottom').length)
})();