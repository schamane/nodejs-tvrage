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
TvRageParser.NETWORK_TAG = "network";
TvRageParser.AKAS_TAG = "akas";
TvRageParser.AKA_TAG = "aka";
TvRageParser.COUNTRY = "country";
TvRageParser.PROPERTIES_MAP = { 
    "showname": "name",
    "showlink": "link",
    "origin_country": "country"
};

inherits(TvRageParser, htmlparser.DefaultHandler);

/*
 * parse generic properties array
 * @method _parsePropertiesArray
 * @private
 * @param {String} tag
 * @param {Object} properties
 * @return {Array | Null}
 */
TvRageParser.prototype._parsePropertiesArray = function(tag, properties, subtag) {
    var items, attr, value, result = null;
    try {
        items = DomUtils.getElementsByTagName(tag, properties, false);
    } catch(ex) {}
    if(items && items.length) {
        result = [];
        items.forEach(function(item) {
            attr = item.attribs;
            value = item.children[0].data;
            if(attr && subtag && attr[subtag]) {
                attr = attr[subtag];
                result[attr] = value;
            } else {
                result.push(value);
            }
        }.bind(this));
    }
    return result;
};

/*
 * parse generic properties
 * @method _parseProperties
 * @private
 * @param {Array} properties
 * @param {Boolean} map properties tag
 * @return {Array}
 */
TvRageParser.prototype._parseProperties = function(properties, map) {
    var tag, genres, value, attribs, country, akas,
        result = {};
    
    properties.forEach(function(prop){
        tag = prop.name;
        if(map && TvRageParser.PROPERTIES_MAP[tag]) {
            tag = TvRageParser.PROPERTIES_MAP[tag];
        }
        
        if(tag === TvRageParser.GENRES_TAG){
            genres = this._parsePropertiesArray(TvRageParser.GENRE_TAG, prop.children);
            if(genres) {
                result[tag]= genres;
            }                
        } else if(tag === TvRageParser.NETWORK_TAG) {
            attribs = prop.attribs;
            result[tag] = {};
            if(attribs && attribs.country)
                country = attribs.country;
            else
                country = "unknown";
            result[tag][country] = prop.children[0].data;
        } else if(tag === TvRageParser.AKAS_TAG) {
            akas = this._parsePropertiesArray(TvRageParser.AKA_TAG, prop.children, TvRageParser.COUNTRY);
            if(akas) {
                result[tag]= akas;
            }
        } else if(prop.children && prop.children.length === 1) {
            value = prop.children[0].data;
            if(value) {
                result[tag] = value;
            }
        }
    }.bind(this));
    return result;
};

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
                        this._parseShowResult(show);
                    }
                }.bind(this));
                break;
            case TvRageParser.ROOT_Info_TAG :
                this._parseShowInfo(feedRoot);
                break;
            default:
                break;
        }
    }
    this.dom = this.results;
    TvRageParser.super_.prototype.done.call(this);
};

/*
 * Parse dom object containing show informations from results response
 * @method _parseShowResult
 * @private
 * @param {Object} item passed as show dom object to parse
 */
TvRageParser.prototype._parseShowResult = function(item) {
    var properties = item.children,
        show = this._parseProperties(properties);
    
    this.results.push(show);
};

/*
 * Parse dom object containing show informations from show information response
 * @method _parseShowInfo
 * @private
 * @param {Object} item passed as show dom object to parse
 */
TvRageParser.prototype._parseShowInfo = function(item) {
    var properties = item.children,
        show = this._parseProperties(properties, true);
    
    this.results.push(show);
};

module.exports = TvRageParser;
