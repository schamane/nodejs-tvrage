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
};

TvRage.VERSION = "0.1";
TvRage.SEARCH_URI = "search.php?";
TvRage.INFO_URI = "showinfo.php?";
TvRage.HTTP_OPTIONS = {
    host: 'services.tvrage.com',
    port: 80,
    path: '/feeds/',
    method: 'GET'
};

/*
 * Handle response from TvRage
 * @method _parseSearchResponse
 * @private
 * @param {Function} callback passed by request
 * @param {Object} res Http response object
 */
TvRage.prototype._parseSearchResponse = function(callback, res) {
    var buf = [],
        idx = 0,
        handler, parser;
    if(res.statusCode !== 200) {
        this._handleError(callback, new Error("wrong http status code"));
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
        callback(handler.dom);
    }.bind(this));
};

/*
 * Handle if http client response had an error
 * @method _handleError
 * @private
 * @param {Funcion} callback Callback passed by request
 * @param {Exception} e Exception object
 */
TvRage.prototype._handleError = function(callback, e) {
    throw new Error(e);
    callback();
};

/*
 * Search tvshow id by name
 * @method search
 * @param {String} name of the tv show for the search
 * @param {Function} callback that should be called after search is done
 * @return {Array} The array of the shows that match name
 */
TvRage.prototype.search = function(name, callback) {
    var options = TvRage.HTTP_OPTIONS,
        query = this.querystring.stringify({show: name});
    
    options.path += TvRage.SEARCH_URI + query;
    this.http.get(options, function(res) {
        this._parseSearchResponse(callback, res);
    }.bind(this)).on('error', function(e) {
        this._handleError(callback, e);
    }.bind(this));
};

/*
 * Get show information by id
 * @method getInfo
 * @param {Int} id of the tv show to get info
 * @param {Function} callback that should be called after search is done
 * @return {Array} The array of the shows that match name
 */
TvRage.prototype.getInfo = function(id, callback) {
    var options = TvRage.HTTP_OPTIONS,
        query = this.querystring.stringify({sid: id});
    
    options.path += TvRage.INFO_URI + query;
    this.http.get(options, function(res) {
        this._parseSearchResponse(callback, res);
    }.bind(this)).on('error', function(e) {
        this._handleError(callback, e);
    }.bind(this));
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
