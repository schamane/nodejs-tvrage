/* 
 * Usage example
 */


var TvRage = require('./tvrage'),
    tvrage = new TvRage(),
    util = require('util');

console.log(tvrage.toString());

//Example how to find some show by name

tvrage.search('The Event', function(res) {
    var num = parseInt(res[0].showid);

    //Example how to get show inforamtions by show id
    tvrage.showInfo(num, function(res) {
        console.log("Show Info:")
        console.log(util.inspect(res));
    });
    
    //Example how to get episode list for the show by id
    tvrage.episodeList(num, function(res) {
        console.log("Episodes Info:")
        console.log("episodes count:"+util.inspect(res.totalseasons));
        console.log("title of the S01E01:"+util.inspect(res.Episodelist[1][21].title));
        
        //Example how to get episode info for the tv show by id, season and episode number
        tvrage.episodeInfo(num, 1, res.Episodelist[1][21].seasonnum, function(res) {
            console.log("Episode Info:")
            console.log(util.inspect(res));
        });
    });
});