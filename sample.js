var http = require('http');
var myServer = http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Hello Node.js\n');
});
myServer.listen(80, "127.0.0.1");
myServer.on('request', function(req,res){
    console.log(req.headers);
});