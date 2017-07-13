'use strict';

var cheerio = require('cheerio');
var extend = require('extend-shallow');
var slugify = require('markdown-slug');
var escape = require('escape-html');

module.exports = function(strOrObj, options) {
  var opts = extend({
    selectors: 'h1,h2',
    id: '#toc',
    slugger: slugify,
    minLength: 0,
    header: '',
    addID: false,
    parentLink: true
  }, options);

  var $;
  if (strOrObj.prototype.cheerio && strOrObj.prototype.cheerio === "[cheerio object]" && strOrObj._root) {
    $ = strOrObj;
  } else if (opts.$) {
    $ = opts.$;
  } else if (typeof strOrObj === 'string') {
    $ = cheerio.load(strOrObj);    
  } else {
    throw new TypeError('Expected a String or Cheerio Instance');
  }

  // get all the anchor tags from inside the headers
  var headings = $(opts.selectors);
  var firstHeading = headings.first()[0];
  if (!firstHeading) return strOrObj;

  var base = +firstHeading.name.slice(1);
  var navigation = [];
  var slugs = {};

  function findLocation(navigation, depth) {
    if (depth <= 0) {
      return navigation;
    }
    var loc = navigation[navigation.length - 1];
    if (!loc) {
      loc = { children: [] };
      navigation.push(loc);
    } else if (!loc.children) {
      loc.children = [];
    }
    return findLocation(loc.children, depth - 1);
  }

  headings.map(function(i, ele) {
    var $ele = $(ele);
    var text = $ele.text().trim();
    if (!text) return;
    var slug = opts.slugger(text, { cache: slugs });
    var node = {
      text: text,
      link: slug,
      level: +ele.name.slice(1) - base,
      $ele: $ele
    };

    var location = findLocation(navigation, node.level);
    location.push(node);
  });

  /**
   * Build the HTML for side navigation.
   */

  function buildHTML(navigation, first, sParentLink) {
    return '<ul class="nav' + (first ? ' sidenav' : '') + '">' + navigation.map(function(loc) {

      if (!loc || !loc.link) return '';
      loc.link = (opts.parentLink && sParentLink ? sParentLink + '-' : '') + loc.link;
      loc.$ele.attr('id', loc.link);

      return '<li><a href="#' + loc.link + '">' + escape(loc.text) + '</a>' + (loc.children ? buildHTML(loc.children, false, loc.link) : '') + '</li>';
    }).join('\n') + '</ul>';
  }

  function addID(navigation) {
    navigation.forEach(function(loc) {
      if (!loc || !loc.link) return;
      loc.$ele.attr('id', loc.link);
      if (loc.children) addID(loc.children);
    });
  }

  if (headings.length < opts.minLength) {
    if (opts.addID) {
      addID(navigation);
    }
    else {
      if (typeof strOrObj === 'string') {
        return $.html();
      } else {
        return $;
      }
    }
  } else {
    $(opts.id).append(opts.header);
    $(opts.id).append(buildHTML(navigation, true));
  }

  headings.map(function(i, ele) {
    var $ele = $(ele);
    var id = $ele.attr('id');

    // Anchor template
    $(this).append(anchorTemplate(id, opts));
    if ($(this).prev().children().hasClass('source-link')) {
      var sourceLink = $(this).prev().children('.source-link');
      $(this).append(sourceLink);
    }
  });

  if (typeof strOrObj === 'string') {
    return $.html();
  } else {
    return $;
  }
};

function anchorTemplate(id, options) {
  if (options.anchors === false) {
    return '';
  }

  if (typeof options.anchorTemplate === 'function') {
    return options.anchorTemplate(id);
  }

  return '<a href="#' + id + '" name="' + id + '" class="anchor">\n'
  + '  <span class="anchor-target" id="' + id + '"></span>\n'
  + '  <span class="glyphicon glyphicon-link"></span>\n'
  + '</a>';
}
