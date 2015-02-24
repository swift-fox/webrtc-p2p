webrtc-p2p
==========
Browser-based P2P live media streaming solution. Supports all mainstream mobile and desktop browsers.

**Features**
- Plugin-free. Requires only a modern browser with WebRTC and WebSocket.
- Unlimited number of clients and low server burdens.
- Broadcasts live video from any device.
- Supports interactive streaming. A client can be both the content receiver and publisher.
- Based on peer-to-peer sharing network.

**Applications**
- Network live broadcasting
- Online conference system
- Remote education system

**Current state:** Prototype. Tested on Chrome Canary.

**How to Use**

server.js and webrtc-server.js is the server-side script. Run it with NodeJS.

webrtc-p2p.js is the browser-side script. Create RTCClient object. And its usage is similar to the RTCPeerConnection in WebRTC.

Demos and code example available upon request.
