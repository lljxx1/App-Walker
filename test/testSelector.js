var fs = require('fs');
var cheerio = require('cheerio');
viewTree = fs.readFileSync('test.xml', 'utf-8');



var selector = `hierarchy > node[class='android.widget.FrameLayout'] > node[class='android.widget.LinearLayout'] > node[class='android.widget.FrameLayout'] > node[class='android.widget.LinearLayout'] > node[class='android.widget.TabHost'] > node[class='android.widget.FrameLayout'] > node[class='android.widget.TabWidget'] > node[class='android.widget.RelativeLayout']`;



var doc = cheerio.load(viewTree, { ignoreWhitespace: true, xmlMode: true });


var nodes = doc(selector);

console.log(nodes.length);