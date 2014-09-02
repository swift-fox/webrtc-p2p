/*
ondatachannel
onmessage:当接收到datachannel信息时触发，function(message)
send:通过datachannel发送信息

onaddstream:当接收到远程流时触发，function(stream)
onremovestream:当远程流取消发布时触发，function(stream)
addStream(stream):发布一个流
removeStream(stream):取消发布一个流
*/
//datachannel buffer, readyState

function RTCClient(serverURL, iceServers, onConnectHandler) {
    this.peers = new Array();
    this.streams = new Object();
    this.dataChannels = new Object();
    this.RTCConfig = iceServers;

    this.socket = new WebSocket(serverURL);
    this.socket.onopen = function () { log("Connected"); }//debug
    this.socket.onclose = function () { log("Disconnected"); }//debug
    this.socket.onmessage = function (e) {
        var resp = JSON.parse(e.data);
        if (resp.advice) {
            var peer = this.getPeerById(resp.advice.id);
            var action = resp.advice.action;

            if (action == RTCClient.CONNECT && peer === undefined) {
                this.addPeer(new Peer(resp.advice.id, this));
log("Connect to " + resp.advice.id);//debug
            }
            else if (action == RTCClient.DISCONNECT && peer !== undefined) {
                this.removePeer(peer);
log("Disconnect from " + resp.advice.id);//debug
            }
        } else if (resp.from) {
            var peer = this.getPeerById(resp.from);
            if(peer)
                peer.onRTCSignal(resp.msg);
        } else if (resp.id) {
            this.id = resp.id;
            if (typeof (onConnectHandler) == "function")
                onConnectHandler(this.id);
        }
    }.bind(this);
}

RTCClient.prototype.getPeerById = function (peerId) {
    for (var i in this.peers)
        if (this.peers[i].id == peerId)
            return this.peers[i];
}

RTCClient.prototype.addPeer = function (peer) {
    Object.keys(this.streams).forEach(function (streamId) {//
        peer.addStream(this.streams[streamId].stream);
    }, this);
    Object.keys(this.dataChannels).forEach(function (label) {//
        peer.createDataChannel(label);
    }, this);
    this.peers.push(peer);
}

RTCClient.prototype.removePeer = function (peer) {////////////////////
    peer.conn.getRemoteStreams().forEach(function (stream) {
        this.removeStream(stream);
    }, this);
    peer.conn.close();
    this.peers.remove(peer);
}

RTCClient.prototype.addStream = function (stream, bubble) {
    this.streams[stream.id] = new Stream(stream, this);
    if (bubble && typeof (this.onaddstream) == "function")
        this.onaddstream(stream);
}

RTCClient.prototype.removeStream = function (stream, bubble) {
    this.streams[stream.id].close();
    if (bubble && typeof(this.onremovestream) == "function")
        this.onremovestream(stream);
}

RTCClient.prototype.createDataChannel = function (label, bubble) {
    if (this.dataChannels[label] === undefined)
        this.dataChannels[label] = new DataChannel(label, this);

    if (bubble && typeof (this.ondatachannel) == "function")
        this.ondatachannel(this.dataChannels[label]);

    return this.dataChannels[label];
}

RTCClient.prototype.onDataChannelMessage = function (label, data, sourcePeer) {
    this.dataChannels[label].send(data, sourcePeer);
    this.dataChannels[label].onmessage(data);
}

RTCClient.prototype.closeDataChannel = function (label) {
    this.dataChannels[label].close();
}

RTCClient.prototype.wsSend = function (objMessage) {
    if (this.socket.readyState == WebSocket.OPEN) {
        this.socket.send(JSON.stringify(objMessage));
        return true;
    } else
        return false;
}

RTCClient.UNKNOWN = RTCClient.DISCONNECT = -1;
RTCClient.CONNECT = 0;
RTCClient.ERROR = 2;
RTCClient.CONNECTED = 3;
RTCClient.CONNECTING = 4;

function Peer(id, client) {
    this.id = id;
    this.state = RTCClient.UNKNOWN;
    this.client = client;
    this.dataChannels = new Object();
    var RTCPeerConnection = webkitRTCPeerConnection;
    this.conn = new RTCPeerConnection(client.RTCConfig);

    this.conn.onicecandidate = function (e) {
        if (e.candidate)
            this.sendViaServer(e.candidate);
    }.bind(this);

    this.conn.onnegotiationneeded = function (e) {
        if (this.state != RTCClient.CONNECTING) {
            this.state = RTCClient.CONNECTING;
log("[" + this.id + "] create offer");
            this.conn.createOffer(function (offer) {
log("[" + this.id + "] create offer success");
log("[" + this.id + "] set local offer");
                this.conn.setLocalDescription(offer, function () {
log("[" + this.id + "] set local offer success");
log("[" + this.id + "] send offer");
                    this.sendViaServer(offer);
                }.bind(this), log);
            }.bind(this), log);
        }
    }.bind(this);

    this.conn.onaddstream = function (e) {
        client.addStream(e.stream, true);
    }

    this.conn.onremovestream = function (e) {
        client.removeStream(e.stream, true);
log("REMOVE---------------------------");
    }

    this.conn.ondatachannel = function (e) {
        this.dataChannels[e.channel.label] = e.channel;
        client.createDataChannel(e.channel.label, true);
    }.bind(this);
}

Peer.prototype.sendViaServer = function (msg) {
    this.client.wsSend({ to: this.id, msg: msg });
}

Peer.prototype.onRTCSignal = function (msg) {
    if (msg.sdp) {
        var sdp = new RTCSessionDescription(msg);

if (msg.type == "offer") log("get offer:<br/>" + msg.sdp.replace(/\r\n/g,"<br />"));
else log("get answer:<br/>" + msg.sdp.replace(/\r\n/g,"<br />"));

        if (sdp.type == "offer" && this.state != RTCClient.CONNECTING) {
log("[" + this.id + "] get offer");
log("[" + this.id + "] set remote offer");
            this.conn.setRemoteDescription(sdp, function () {
log("[" + this.id + "] set remote offer success");
log("[" + this.id + "] create answer");
                this.conn.createAnswer(function (answer) {
log("[" + this.id + "] create answer success");
log("[" + this.id + "] set local answer");
                    this.conn.setLocalDescription(answer, function () {
log("[" + this.id + "] set local answer success");
                        this.state = RTCClient.CONNECTED;
log("[" + this.id + "] RTC Connected.<br/>----------------------");//debug
                    }.bind(this),log);
log("[" + this.id + "] send answer");
                    this.sendViaServer(answer);
                }.bind(this),log);
            }.bind(this),log);
        } else if (sdp.type == "answer") {
log("[" + this.id + "] get answer");
log("[" + this.id + "] set remote answer");
                this.conn.setRemoteDescription(sdp, function () {
log("[" + this.id + "] set remote answer success");
                    this.state = RTCClient.CONNECTED;
log("[" + this.id + "] RTC Connected.<br/>----------------------");//debug
                }.bind(this),log);
        }
    } else if (msg.candidate) {
log("[" + this.id + "] ICE Candidate: " + msg.sdpMid+" "+msg.candidate);
        this.conn.addIceCandidate(new RTCIceCandidate(msg));
    }
}

Peer.prototype.addStream = function (stream) {
    if (this.conn.getRemoteStreams().indexOf(stream) == -1)
        this.conn.addStream(stream);
}

Peer.prototype.removeStream = function (stream) {
    this.conn.removeStream(stream);
}

Peer.prototype.createDataChannel = function (label) {
    if (this.dataChannels[label] === undefined)
        this.dataChannels[label] = this.conn.createDataChannel(label);

    this.dataChannels[label].onmessage = function (e) {
        this.client.onDataChannelMessage.call(this.client, label, e.data, this);
    }.bind(this);

    this.dataChannels[label].onclose = function () {
        delete this.dataChannels[label];
//        this.client.closeDataChannel(label);
    }.bind(this);
}

Peer.prototype.closeDataChannel = function (label) {
    if (this.dataChannels[label] !== undefined) {
        this.dataChannels[label].close();
        delete this.dataChannels[label];//
    }
}

Peer.prototype.sendDataChannel = function (label, data) {
    this.dataChannels[label].send(data);
}

function Stream(stream, client) {
    this.stream = stream;
    this.client = client;
    this.client.peers.forEach(function (peer) {
        peer.addStream(stream);
    });
}

Stream.prototype.close = function () {
    this.client.peers.forEach(function (peer) {
        peer.removeStream(this.stream);
    }, this);
    delete this.client.streams[this.stream.id];//
}

function DataChannel(label, client) {
    this.label = label;
    this.client = client;
    this.onmessage = function (data) { }
    this.client.peers.forEach(function (peer) {
        peer.createDataChannel(label);
    });
}

DataChannel.prototype.send = function (data, sourcePeer) {
    this.client.peers.forEach(function (peer) {
        if (peer !== sourcePeer)
            peer.sendDataChannel(this.label, data);
    },this);
}

DataChannel.prototype.close = function () {
    this.client.peers.forEach(function (peer) {
        peer.closeDataChannel(this.label);
    }, this);
    delete this.client.dataChannels[this.label];//
}

Array.prototype.remove = function (item) {
    var i;
    i = this.indexOf(item)
    while (i >= 0) {
        this.splice(i, 1);
        i = this.indexOf(item)
    }
}
