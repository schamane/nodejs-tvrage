# Nodejs-TvRage

Nodejs client to work with http://www.tvrage.com services. To get informations about tv shows.

Version 0.2.0 initial release. Just for testing two web service features.
There are 3 methods implemented:
 
- search
- show info
- episode list

## Install

<pre>
npm install nodejs-tvrage
</pre>

## Simple usage

<pre>
var TvRage = require('./tvrage'),
    tvrage = new TvRage(),
    util = require('util');

tvrage.search('buffy', function(res) {
    console.log(util.inspect(res[0]));
});
</pre>