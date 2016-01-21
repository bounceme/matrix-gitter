You'll need an oAuth token from [developer.gitter.im](https://developer.gitter.im) and a [Room ID](https://developer.gitter.im/docs/rooms-resource).

npm install matrix-appservice-bridge
npm install request

```
$ TOKEN=<token> ROOM_ID=<room_id> node gitter-stream.js
