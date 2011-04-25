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

TvRageParser.ROOT_RESULTS_TAG = "Results";
TvRageParser.ROOT_INFO_TAG = "Showinfo";
TvRageParser.ROOT_EPISODE_TAG = "Show";
TvRageParser.ROOT_EPISODE_INFO_TAG = "show";
TvRageParser.SHOW_TAG = "show";
TvRageParser.GENRES_TAG = "genres";
TvRageParser.GENRE_TAG = "genre";
TvRageParser.NETWORK_TAG = "network";
TvRageParser.AKAS_TAG = "akas";
TvRageParser.AKA_TAG = "aka";
TvRageParser.COUNTRY = "country";
TvRageParser.SEASONS_COUNT = "totalseasons";
TvRageParser.EPISODELIST_TAG = "Episodelist";
TvRageParser.SEASONS_TAG = "Season";
TvRageParser.EPISODE_TAG = "episode";
TvRageParser.EPISODEINFO_TAG = "episode";
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
 * @param {String} tag to search for array
 * @param {Object} properties dom
 * @param {String} subtag optional
 * @return {Array | Null} returns back an parsed array or null
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
 * @param {Object} properties dom
 * @param {Boolean} map properties tag optional
 * @return {Object} return parsed array or empty object
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
        found = DomUtils.getElementsByTagName(function (value) {
            return(value === TvRageParser.ROOT_RESULTS_TAG || 
                value === TvRageParser.ROOT_INFO_TAG ||
                value === TvRageParser.ROOT_EPISODE_TAG ||
                value === TvRageParser.ROOT_EPISODE_INFO_TAG);
        }, this.dom, false);
    
    if (found.length) {
        feedRoot = found[0];
    }
    
    this.results = null;
    if(feedRoot) {
        switch(feedRoot.name) {
            case TvRageParser.ROOT_RESULTS_TAG :
                feedRoot = feedRoot.children;
                this.results = [];
                feedRoot.forEach(function(show) {
                    if(show.name === TvRageParser.SHOW_TAG) {
                        this._parseShowResult(show);
                    }
                }.bind(this));
                break;
            case TvRageParser.ROOT_INFO_TAG :
                this._parseShowInfo(feedRoot);
                break;
            case TvRageParser.ROOT_EPISODE_TAG:
                this.results = {};
                this._parseEpisodesList(feedRoot);
                break;
            case TvRageParser.ROOT_EPISODE_INFO_TAG:
                this.results = {};
                this._parseEpisodeInfo(feedRoot);
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
    
    this.results = show;
};

/*
 * Parse dom object containing episodes list informations
 * @method _parseEpisodesList
 * @private
 * @param {Object} item passed as show dom object to parse
 */
TvRageParser.prototype._parseEpisodesList = function(item) {
    var properties = item.children,
        count, seasons, list, episode, seasonlist = [], seasonNumber = 0, episodeNumber = 0;
    
    try {
        count = DomUtils.getElementsByTagName(TvRageParser.SEASONS_COUNT, properties, false)[0].children[0].data;
    } catch(ex) {}
    if(count) {
        this.results[TvRageParser.SEASONS_COUNT] = count;
    }
    try{
        list = DomUtils.getElementsByTagName(TvRageParser.EPISODELIST_TAG, properties)[0].children;
        DomUtils.getElementsByTagName(TvRageParser.SEASONS_TAG, list).forEach(function(seasons){
            seasonNumber = parseInt(seasons.attribs.no);
            seasonlist[seasonNumber] = [];
            DomUtils.getElementsByTagName(TvRageParser.EPISODE_TAG, seasons.children).forEach(function(item){
                episode = this._parseProperties(item.children);
                episodeNumber = parseInt(episode.epnum);
                if(seasonNumber && episodeNumber) {
                    delete episode.epnum;
                    seasonlist[seasonNumber][episodeNumber] = episode;
                }
            }.bind(this));
        }.bind(this));
    } catch(ex) {}
    if(seasonlist.length) {
        this.results[TvRageParser.EPISODELIST_TAG] = seasonlist;
    }
};

/*
 * Parse dom object containing episode informations
 * @method _parseEpisodeInfo
 * @private
 * @param {Object} item passed as show dom object to parse
 */
TvRageParser.prototype._parseEpisodeInfo = function(item) {
    var properties = item.children,
        episode;
    
    try{
        episode = DomUtils.getElementsByTagName(TvRageParser.EPISODEINFO_TAG, properties)[0].children;
    } catch(ex) {}
    if(episode) {
        this.results = this._parseProperties(episode, true);
    }
};

module.exports = TvRageParser;
