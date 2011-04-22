/* 
 * Nodejs module to access tvrage web services.
 * @module tvrage
 */

/*
 * @class TvRage
 */

var TvRage = function() {
    this.http = require('http'),
    this.querystring = require('querystring'),
    this.tvRageParser = require('./tvrageparser');
    this.busy = false;
};

TvRage.VERSION = "0.1";
TvRage.PATH_PREFIX = '/feeds/';
TvRage.SEARCH_URI = "search.php?";
TvRage.INFO_URI = "showinfo.php?";
TvRage.EPISODE_LIST_URI = "episode_list.php?";
TvRage.HTTP_OPTIONS = {
    host: 'services.tvrage.com',
    port: 80,
    method: 'GET'
};

/*
 * Handle response from TvRage
 * @method _parseResponse
 * @private
 * @param {Function} callback passed by request
 * @param {Object} res Http response object
 */
TvRage.prototype._parseResponse = function(callback, res) {
    var buf = [],
        idx = 0,
        handler, parser;
    if(res.statusCode !== 200) {
        this._handleError(new Error("wrong http status code"));
        return;
    }
    res.on('data', function(chunk) {
        buf[idx++] = chunk;
    });
    res.on('end', function() {
        this.parser = this.parser || require("htmlparser");
        handler = new this.tvRageParser();
        parser = new this.parser.Parser(handler);
        parser.parseComplete(buf.join());
        process.nextTick(function() { callback(handler.dom);});
    }.bind(this));
};

/*
 * Handle if http client response had an error
 * @method _handleError
 * @private
 * @param {Exception} e Exception object
 */
TvRage.prototype._handleError = function(e) {
    throw new Error(e);
};


/*
 * Get show information by id
 * @method _request
 * @private
 * @param {Object} options for the tvrage request
 * @param {Function} callback
 */
TvRage.prototype._request = function(options, callback) {
    this.http.get(options, function(res) {
        this._parseResponse(callback, res);
    }.bind(this)).on('error', function(e) {
        this._handleError(e);
    }.bind(this));
};

/*
 * Search tvshow id by name
 * @method search
 * @param {String} name of the tv show for the search
 * @param {Function} callback that should be called after search is done
 */
TvRage.prototype.search = function(name, callback) {
    var options = TvRage.HTTP_OPTIONS,
        query = this.querystring.stringify({show: name});
    
    options.path = TvRage.PATH_PREFIX + TvRage.SEARCH_URI + query;
    this._request(options, callback);
};

/*
 * Get show information by id
 * @method showInfo
 * @param {Int} id of the tv show to get info
 * @param {Function} callback that should be called after response was received
 */
TvRage.prototype.showInfo = function(id, callback) {
    var options = TvRage.HTTP_OPTIONS,
        query = this.querystring.stringify({sid: id});
    
    options.path = TvRage.PATH_PREFIX + TvRage.INFO_URI + query;
    this._request(options, callback);
};

/*
 * Get episode list for the show by id
 * @method episodeList
 * @param {Int} id of the tv show to get info
 * @param {Function} callback that should be called after response was received
 */
TvRage.prototype.episodeList = function(id, callback) {
    var options = TvRage.HTTP_OPTIONS,
        query = this.querystring.stringify({sid: id});
    
    options.path = TvRage.PATH_PREFIX + TvRage.EPISODE_LIST_URI + query;
    this._request(options, callback);
};

/*
 * Returns string to identify module for debuging
 * @method toString
 * @return {String} The text contains module name and version.
 */
TvRage.prototype.toString = function() {
    return "TvRage API Client v."+TvRage.VERSION;
};

module.exports = TvRage;
