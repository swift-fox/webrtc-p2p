var WebSocketServer = require('ws').Server;

if (require.main === module) {
    var server = new WebSocketServer({ port: 8080 });
    server.on('connection', onConn);
} else {
    module.exports = function (httpserver) {
        var server = new WebSocketServer({ server: httpserver });
        server.on('connection', onConn);
    };
}

log("WebRTC Server start");

var groups = new Array();
var clients = new Array();
var uuid = require('node-uuid');

function onConn(socket){
    var group_id = socket.upgradeReq.url.split("/",2)[1];
    getGroupById(group_id).addClient(new Client(socket));
}

function getGroupById(id) {
    for (var i in groups) {
        if (groups[i].id == id)
            return groups[i];
    }

    var group = new Group(id);
    groups.push(group);
    return group;
};

function getClientById(id) {
    for (var i in clients) {
        if (clients[i].id == id)
            return clients[i];
    }
};

function connect(p1, p2) {
log("Connect " + p1.id + " and " + p2.id);//debug
    p1.addPeer(p2);
    p2.addPeer(p1);
}

function findAvailable(start) {
    var list = new Array();
    do {
        if (start.peers.length < 3)   //Max degree
            return start;
        for (var i in start.peers) {
            if (list.indexOf(start.peers[i]) == -1)
                list.push(start.peers[i]);
        }
        start = list.shift();
    } while (start);
}

function log(msg) {
    var now = new Date();
    var y = now.getFullYear();
    var M = now.getMonth() + 1;
    var d = now.getDate();
    var h = now.getHours();
    var m = now.getMinutes();
    var s = now.getSeconds();

    if (M < 10) M = "0" + M;
    if (d < 10) d = "0" + d;
    if (h < 10) h = "0" + h;
    if (m < 10) m = "0" + m;
    if (s < 10) s = "0" + s;

    now = y + "/" + M + "/" + d + " " + h + ":" + m + ":" + s;
    console.log("[" + now + "] " + msg);
}

function Group(id) {
    this.id = id;
}

Group.prototype.addClient = function (client) {
    client.group=this;

    if (this.root) {
        var peer = findAvailable(this.root);
        connect(client, peer);
    } else
        this.root = client;
};

Group.prototype.removeClient = function (client) {
    delete client.group;

    if (this.root == client)
        this.root = client.peers[0];

    client.peers.forEach(function (peer) {
        peer.removePeer(client);
    });

    if (this.root) {
        for (var i = 1; i < client.peers.length; i++) {
            var p1 = findAvailable(client.peers[0]);
            var p2 = findAvailable(client.peers[i]);
            connect(p1, p2);
        }
    }else
        groups.splice(groups.indexOf(this), 1);

    client.peers.length = 0;
};

function Client(socket) {
    this.id = uuid.v4().substr(0, 8);
    this.peers = new Array();
    this.socket = socket;
log('Join: ' + this.id);//debug

    this.socket.onmessage = function (message) {
//log('%s: %s',this.id, message.data);//debug
        var resp = { status: false };
        try {
            var req = JSON.parse(message.data);
            if (req.to) {
                var target = getClientById(req.to);
                if (target) {
                    target.send({ from: this.id, msg: req.msg });
                    resp.status = true;
                }
            }
        } catch (e) {
throw e;//debug
            log("[Error] " + e.message);
            resp.error = e.message;
        }
        this.send(resp);
    }.bind(this);

    this.socket.onclose = function () {
log("Lost: " + this.id);//debug
        if (this.hasOwnProperty("group"))
            this.group.removeClient(this);

        clients.splice(clients.indexOf(this), 1);
    }.bind(this);

    clients.push(this);

    this.send({ id: this.id });
}

Client.prototype.addPeer=function(peer){
    this.peers.push(peer);
    this.send({advice:{id:peer.id,action:Client.CONNECT}});
};

Client.prototype.removePeer=function(peer){
    var i = this.peers.indexOf(peer);
    if (i >= 0)
        this.peers.splice(i, 1);

	this.send({advice:{id:peer.id,action:Client.DISCONNECT}});
};

Client.prototype.send = function (msg) {
    if (this.socket.readyState == this.socket.OPEN)
        this.socket.send(JSON.stringify(msg));
};

Client.DISCONNECT=-1;
Client.CONNECT=0;
