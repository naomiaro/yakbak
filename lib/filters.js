var crypto = require('crypto');
var url = require('url');

var filters = [];

function sort(obj) {
  var ret = {};

  Object.keys(obj).sort().forEach(function (key) {
    ret[key] = obj[key];
  });

  return ret;
}

function addFilter(inFilter) {
  var filter = {};
  filter.url = inFilter.url || /.*/;
  filter.headerFilter = inFilter.headerFilter || function(headers) { return headers; };
  filter.bodyFilter = inFilter.bodyFilter || function(body) { return body; };
  filters.push(filter);
}

function createFilteredString(url, headers, body) {
  var filteredHeaders = headers;
  var filteredBody = body;

  filters.forEach(function(filter) {
    if (filter.url.test(url)) {
      filteredHeaders = filter.headerFilter(filteredHeaders);
      filteredBody = filter.bodyFilter(filteredBody);
    }
  });

  return {
    'body': filteredBody,
    'headers': filteredHeaders
  };
}

function createFilename(req, body) {
  var hash = crypto.createHash('md5');
  var filteredParts = createFilteredString(req.url, req.headers, body);
  var parts = url.parse(req.url, true);

  hash.update(req.httpVersion);
  hash.update(req.method);
  hash.update(parts.pathname);
  hash.update(JSON.stringify(sort(parts.query)));
  hash.update(JSON.stringify(sort(filteredParts['headers'])));
  hash.update(JSON.stringify(sort(filteredParts['body'])));
  hash.update(JSON.stringify(sort(req.trailers)));

  return hash.digest('hex') + '.js';
}

module.exports.addFilter = addFilter;
module.exports.createFilename = createFilename;
