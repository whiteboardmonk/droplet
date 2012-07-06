require.paths.unshift(__dirname + '/lib');
require.paths.unshift(__dirname);

var connect = require('connect'),
  config = require('./config/config'),
  mongo = require('mongodb'),
  Droplet = require('droplet').Droplet;

db = new mongo.Db('droplet', new mongo.Server(config.mongo_host, config.mongo_port, {}), {});

db.addListener("error", function(error) {
  console.log("Error connecting to mongo -- perhaps it isn't running?");
});

db.open(function(p_db) {
  var droplet = new Droplet();
  droplet.init(db, function() {
    var server = connect.createServer(function(req, res) {
      try {
        droplet.serveRequest(req, res);
      } catch(e) {
        droplet.handleError(req, res, e);
      }
    })
    .listen(8080);
  });
  
  console.log('Tracking server running at http://*:' + config.tracking_port + '/tracking_pixel.gif');
});