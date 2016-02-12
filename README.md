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

**How to run the demo**

1. Checkout the code and run startup.bat
2. Open multiple tabs in Chrome with the same URL [http://localhost:8080/webrtc_websocket.html](http://localhost:8080/webrtc_websocket.html)
3. In every tab, input the same number into the group_id box and click JOIN.
4. If succeeds, there should be an ID displayed on the right side.
5. Click cam to publish your camera to all the clients in the same group.
6. You should be able to see your camera video from other tabs.

Note:

1. Please expect glitches. It’s a prototype. And some bugs are of Chrome itself, which is out of my control.
2. If you want to test on machines other than localhost, please modify the URL in line 36 of the static/webrtc_websocket.html into the actual IP of the server
3. You can try the screen capturing feature. But you need to run Chrome a special command line parameter -enable-usermedia-screen-capturing. Please refer to the screenshot in [chromium Issue 372729](https://code.google.com/p/chromium/issues/detail?id=372729#c9). And be sure to close all Chrome windows before restart it to fully apply the parameter.

If it is still not working, please contact me. And I’d be glad to help you out.

I developed a very cool remote desktop plugin based on my library, which could be enabled in the RD panel. But the API I used (NPAPI) was obsoleted by Chrome, it is sadly defunct now.

I didn’t have enough time to do comments on my code. Since the API is similar to the standard WebRTC, I think it won’t be difficult for you to figure it out.

Thank you very much for your interest in my project!
