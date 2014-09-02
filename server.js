var st = require('st');
var http = require('http');
var https = require('https');
var url = require('url');
var rtc = require('./webrtc-server.js');
var fs = require('fs');

var mount = st({ path: __dirname + '/static', url: '/' });

var server = http.createServer(function (req, res) {
   mount(req, res);
});
rtc(server);
server.listen(8080);

var options = {
  pfx: fs.readFileSync('cert.pfx')
};

server = https.createServer(options, function (req, res) {
   mount(req, res);
});
rtc(server);
server.listen(8443);