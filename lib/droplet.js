var sys = require('sys'),
    fs = require('fs'),
    config = require('../config/config'),
    Buffer = require('buffer').Buffer,
    arrays = require('deps/arrays'),
    querystring = require('querystring');
    
var Droplet = function (db, callback) {
  var trackingPixel = fs.readFileSync(__dirname + "/../images/tracking.gif", 'binary');
  this.pixel = new Buffer(43);
  this.pixel.write(trackingPixel, 'binary', 0);
  this.metrics = [];
  //this.visits_clxn = 'visits';
  //this.clicks_clxn = 'clicks';
  //this.conversions_clxn = 'conversions';
};

Droplet.prototype = {
  init: function (db, callback) {
    this.setupDb(db, function () {
      callback();
    });
  },
  setupDb: function (db, callback) {
    var self = this;
    db.createCollection('visits', function (err, collection) {
      db.collection('visits', function (err, collection) {
        console.log('setupDb: visits');
        self.visits_clxn = collection;
        db.createCollection('clicks', function (err, collection) {
          db.collection('clicks', function (err, collection) {
            console.log('setupDb: clicks');
            self.clicks_clxn = collection;
            db.createCollection('conversions', function (err, collection) {
              db.collection('conversions', function (err, collection) {
                console.log('setupDb: conversions');
                self.conversions_clxn = collection;
                callback();
              });
            });
          });
        });
      });
    });
  },
  serveRequest: function (req, res) {
    console.log('serveRequest: ===Start');
    var env = this.parseQuery(req.url.split('?')[1]);
    env.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    env.timestamp = new Date();
    console.log(env);
    if (req.url.indexOf('/visits') >= 0) {
      this.writePixel(res);
      this.insertVisitData(env);
      console.log('serveRequest: Inserted visit data');
    } else if (req.url.indexOf('/clicks') >= 0) {
      this.writePixel(res);
      this.insertClickData(env);
      console.log('serveRequest: Inserted click data');
    } else if (req.url.indexOf('/conversions') >= 0) {
      this.writePixel(res);
      this.insertConversionData(env);
      console.log('serveRequest: Inserted conversion data');
    } else {
      res.end();
      console.log('serveRequest: No match found');
    }
    console.log('serveRequest: End===');
  },
  insertVisitData: function (env) {
    this.visits_clxn.insertAll([env]);
  },
  insertClickData: function (env) {
    this.clicks_clxn.insertAll([env]);
  },
  insertConversionData: function (env) {
    this.conversions_clxn.insertAll([env]);
  },
  insertData: function (env) {
    //var view = new View(env);
    //env.url_key = view.urlKey;
    //env.product_id = view.productId;
    this.collection.insertAll([env]);
  },
  parseQuery: function (query) {
    var queryString = {};
    (query || "").replace(
    new RegExp("([^?=&]+)(=([^&]*))?", "g"), function ($0, $1, $2, $3) {
      queryString[$1] = querystring.unescape($3.replace(/\+/g, ' '));
    });
    return queryString;
  },
  writePixel: function (res) {
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Disposition': 'inline',
      'Content-Length': '43'
    });
    res.end(this.pixel);
  },
  handleError: function (req, res, e) {
    res.writeHead(500, {});
    res.write("Server error");
    res.end();
    e.stack = e.stack.split('\n');
    e.url = req.url;
    sys.log(JSON.stringify(e, null, 2));
  }
};
exports.Droplet = Droplet;