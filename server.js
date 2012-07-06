require.paths.unshift(__dirname + '/lib');
require.paths.unshift(__dirname);

var connect = require('connect'),
  config = require('./config/config'),
  mongo = require('mongodb'),
  Droplet = require('droplet').Droplet,
  cluster = require('cluster');;

var db = new mongo.Db('droplet', new mongo.Server(config.mongo_host, config.mongo_port, {}), {});

db.addListener("error", function(error) {
  console.error("Error connecting to mongo -- perhaps it isn't running?");
});

var server = connect.createServer();

db.open(function(p_db) {
  var droplet = new Droplet();
  droplet.init(db, function() {
    server.use(function(req, res) {
      try {
        droplet.serveRequest(req, res);
      } catch(e) {
        droplet.handleError(req, res, e);
      }
    });
  });
  
  console.log('Tracking server running at http://*:' + config.tracking_port + '/tracking_pixel.gif');
});

cluster(server)
  .use(cluster.logger('log'))
  .use(cluster.stats())
  .use(cluster.pidfiles('pids'))
  .listen(8080);
