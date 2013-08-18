/**
 * Module Dependencies
 */

var path = require('path');
var join = path.join;
var home = process.env.HOME;
var _ = exports;

/**
 * Export
 */

_['db path'] = join(home, '/data/'); 
_['script volume'] = join(home, '/scripts/');