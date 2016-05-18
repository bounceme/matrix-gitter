var bridge;
var ROOM_ID = '!YiuxjYhPLIZGVVkFjT:localhost'; // this room must have join_rules: public
var Cli = require('matrix-appservice-bridge').Cli;
var Bridge = require('matrix-appservice-bridge').Bridge;
var AppServiceRegistration = require('matrix-appservice-bridge').AppServiceRegistration;

var https = require('https');
var roomId = process.env.ROOM_ID;
var token = process.env.TOKEN;
var heartbeat = ' \n';
var options = {
  hostname: 'stream.gitter.im',
  port: 443,
  path: '/v1/rooms/' + roomId + '/chatMessages',
  method: 'GET',
  headers: {'Authorization': 'Bearer ' + token}
};

var req = https.request(options, function(res) {
  res.on('data', function(chunk) {
    var msg = chunk.toString();
    if (msg !== heartbeat) {
      var params = JSON.parse(msg);
      var intent = bridge.getIntent('@gitter' + params.fromUser.username + ':localhost');
      intent.sendText(ROOM_ID, params.text);
    }
  });
});
req.on('error', function(e) {
  console.log('Something went wrong: ' + e.message);
});
req.end();

new Cli({
  registrationPath: 'gitter-registration.yaml',
  generateRegistration: function(reg, callback) {
    reg.setHomeserverToken(AppServiceRegistration.generateToken());
    reg.setAppServiceToken(AppServiceRegistration.generateToken());
    reg.setSenderLocalpart('gitterbot');
    reg.addRegexPattern('users', '@gitter_.*', true);
    callback(reg);
  },
  run: function(port, config) {
    bridge = new Bridge({
      homeserverUrl: 'http://localhost:8008',
      domain: 'localhost',
      registration: 'gitter-registration.yaml',

      controller: {
        onUserQuery: function(queriedUser) {
          return {}; // auto-provision users with no additonal data
        },

        onEvent: function(request, context) {
          var event = request.getData();
          if (event.type !== 'm.room.message' || !event.content || event.room_id !== ROOM_ID) {
            return;
          }

          var postGitter = https.request({
            method: 'POST',
            hostname: 'api.gitter.im',
            path: '/v1/rooms/' + roomId + '/chatMessages',
            headers: {
              'Authorization': 'Bearer ' + token,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          }, function(res) {
            console.log(res.statusCode);
          });
          postGitter.on('error', function(e) {
            console.log('Something went wrong: ' + e.message);
          });
          postGitter.end(JSON.stringify({text: event.content.body}));

        }
      }
    });
    console.log('Matrix-side listening on port %s', port);
    bridge.run(port, config);
  }
}).run();
