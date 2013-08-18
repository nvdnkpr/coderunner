/**
 * Module dependencies.
 */

var port = process.argv[2] || 8080;
var express = require('express');
var app = module.exports = express();
var server = require('http').createServer(app);
var Session = require('connect-leveldb2')(express);
var engine = require('engine.io');
var IO = require('io-server');
var config = require('config');

/**
 * Set up engine.io
 */

var es = new engine.Server();

server.on('upgrade', function(req, socket, head) {
  es.handleUpgrade(req, socket, head);
});

es.on('connection', IO);

/**
 * Configuration
 */

app.use(express.favicon());
app.use(express.bodyParser());
app.use('/engine.io', es.handleRequest.bind(es));

app.configure('production', function() {
  app.use(express.compress());
});

app.configure('development', function(){
  app.use(require('build'));
  app.use(express.logger('dev'));
});

app.use(express.static(__dirname + '/build'));

// Needs to be above req.session because of the way sessions work
// See: https://github.com/senchalabs/connect/issues/854
app.use(require('container'));

/**
 * Session support
 */

var dbdir = config('db path');
var session = new Session({
  dbLocation: dbdir + 'sessions',
  ttl : 60 * 60 // 1hr
});

app.use(express.cookieParser());
app.use(express.session({
  store: session,
  secret: 'leveldb sweetness'
}));

// session defaults
app.use(function(req, res, next) {
  if (!req.session.scripts) req.session.scripts = [];
  next();
});

/**
 * Mount
 */

app.use(require('script/api'));
// IO.on('install', require('install'));
IO.on('run', require('run'));
app.use(require('home'));

/**
 * Environment configurations
 */

app.configure('development', function() {
  app.use(express.errorHandler());
});

// TODO: make more user-friendly & log
app.configure('production', function() {
  app.use(function(err, req, res, next) {
    res.redirect('/');
  });
});

/**
 * Listen
 */

server.listen(port, function() {
  console.log('listening on port %s', port);
});

/**
 * Graceful shutdown
 */

function shutdown() {
  console.log('closing...');
  server.close();
  // redis.client.quit();

  // arbitrary 2 seconds
  setTimeout(function() {
    console.log('closed');
    process.exit(0);
  }, 2000);
}

process.on('SIGTERM', shutdown);
process.on('SIGQUIT', shutdown);
