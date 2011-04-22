/* 
 * Usage example
 */


var TvRage = require('./tvrage'),
    tvrage = new TvRage(),
    util = require('util');

//console.log(util.inspect(tvrage.toString()));

tvrage.search('The Event', function(res) {
    console.log(util.inspect(res));
}.bind(this));


tvrage.getInfo(25703, function(res) {
    console.log(util.inspect(res));
}.bind(this));