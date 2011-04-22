/* 
 * Inherits XML default parser from htmlparser to get data from TvRage request results
 */

var inherits = require('util').inherits,
    htmlparser = require("htmlparser"),
    DomUtils = htmlparser.DomUtils;

/*
 * XML Parser for the TvRage XML Response
 * @class TvRageParser inherits DefaultHandler from htmlparser
 */
var TvRageParser = function(callback) {
    TvRageParser.super_.call(this, callback, {ignoreWhitespace: true, verbose: false, enforceEmptyTags: false});
};

TvRageParser.ROOT_Results_TAG = "Results";
TvRageParser.ROOT_Info_TAG = "Showinfo";
TvRageParser.SHOW_TAG = "show";
TvRageParser.GENRES_TAG = "genres";
TvRageParser.GENRE_TAG = "genre";

inherits(TvRageParser, htmlparser.DefaultHandler);

/*
 * overwrite default parser method done to recognise result show data
 * @method done
 */
TvRageParser.prototype.done = function() {
    var feedRoot,
        found = DomUtils.getElementsByTagName(function (value) {return(value === TvRageParser.ROOT_Results_TAG || value === TvRageParser.ROOT_Info_TAG);}, this.dom, false);
    
    if (found.length) {
        feedRoot = found[0];
    }
    
    this.results = [];
    if(feedRoot) {
        switch(feedRoot.name) {
            case TvRageParser.ROOT_Results_TAG :
                feedRoot = feedRoot.children;
                feedRoot.forEach(function(show) {
                    if(show.name === TvRageParser.SHOW_TAG) {
                        this._parserShow(show);
                    }
                }.bind(this));
                break;
            case TvRageParser.ROOT_Info_TAG :
                //console.log(feedRoot.children);
                this._parserShow(feedRoot);
                break;
            default:
                break;
        }
    }
    this.dom = this.results;
    TvRageParser.super_.prototype.done.call(this);
};

/*
 * Parse dom object containing show informations
 * @method _parseShow
 * @private
 * @param {Object} item passed as show dom object to parse
 */
TvRageParser.prototype._parserShow = function(item) {
    var show = {},
        tag, value, genres,
        properties = item.children;
    properties.forEach(function(prop){
        tag = prop.name;
        if(tag === TvRageParser.GENRES_TAG){
            try {
                genres = DomUtils.getElementsByTagName(TvRageParser.GENRE_TAG, prop.children, false);
            } catch(ex) {}
            if(genres && genres.length) {
                    show.genres = [];
                    genres.forEach(function(genre) {
                        show.genres.push(genre.children[0].data);
                    }.bind(this));
                }
        } else if(prop.children && prop.children.length === 1) {
            value = prop.children[0].data;
            if(value) {
                show[tag] = value;
            }
        }
    }.bind(this));
    
    this.results.push(show);
};

module.exports = TvRageParser;
