
(async () => { 

    var $ = await getDoc();
    $("[resource-id='com.ss.android.article.news:id/ab9']").click()
    console.log($("[resource-id='com.ss.android.article.news:id/ab9']").length)


    var $ = await getDoc();
    $("[class='android.support.v7.widget.RecyclerView']").scroll()

})();


(async () => { 
    var $ = await getDoc();
    console.log($("[class='android.support.v7.widget.RecyclerView']").eq(0).text());
    $("[class='android.support.v7.widget.RecyclerView']").eq(0).scroll()
})();