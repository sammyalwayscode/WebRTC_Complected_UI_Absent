import React, { Component } from 'react'
import io from 'socket.io-client'
// import './App.css'

class App extends Component {
  constructor(props) {
    super(props)
    this.localVideoref = React.createRef()
    this.remoteVideoref = React.createRef()

    this.socket = null
    this.candidates = []
  }

  componentDidMount() {


    this.socket = io(
      '/webrtcPeer',
      {
        path: '/webrtc',
        query: {}
      }
    )

    this.socket.on('connection-success', success => {
      console.log(success)
    })

    this.socket.on('offerOrAnswer', (sdp) => {
      this.textref.value = JSON.stringify(sdp)
      this.pc.setRemoteDescription(new RTCSessionDescription(sdp))
    })


    this.socket.on('candidate', (candidate) => {
      //console.log('From Peer...', JSON.stringify(candidate))
      // this.candidates = [...this.candidates, candidate]
      this.pc.addIceCandidate(new RTCIceCandidate(candidate))
    })


    // const pc_config = null

    const pc_config = {
      "iceServers": [
        // {
        //   // urls: 'stun:[STUN-IP]:[PORT]',
        //   // 'credential': '[YOUR CREDENTIAL]',
        //   // 'username': '[USERNAME]'
        // }

        {
          urls: 'stun:stun.l.google.com:19302'
        }
      ]
    }

    this.pc = new RTCPeerConnection(pc_config)

    this.pc.onicecandidate = (e) => {
      if (e.candidate) {
        //console.log(JSON.stringify(e.candidate))
        this.sendToPeer('candidate', e.candidate)
      }
    }

    this.pc.oniceconnectionstatechange = (e) => {
      console.log(e);
    }

    this.pc.onaddstream = (e) => {
      this.remoteVideoref.current.srcObject = e.stream
    }
    // this.pc.onaddstream = (e) => {
    //   this.remoteVideoref.current.srcObject = e.streams[0]
    // }

    const constraints = { video: true }
    const success = (stream) => {
      this.localVideoref.current.srcObject = stream
      this.pc.addStream(stream)
    }
    const failure = (e) => {
      console.log('getUserMedia Error: ', e)
    }
    navigator.mediaDevices.getUserMedia(constraints)
      .then(success)
      .catch(failure)
  }

  sendToPeer = (messageType, payload) => {
    this.socket.emit(messageType, {
      socketID: this.socket.id,
      payload
    })
  }


  createOffer = () => {
    console.log('Offer')
    this.pc.createOffer({ offerToReceiveVideo: 1 })
      .then(sdp => {
        // console.log(JSON.stringify(sdp))
        this.pc.setLocalDescription(sdp)
        this.sendToPeer('offerOrAnswer', sdp)
        // }, e => { })
      })
  }


  setRemoteDescription = () => {
    const desc = JSON.parse(this.textref.value)

    this.pc.setRemoteDescription(new RTCSessionDescription(desc))
  }

  createAnswer = () => {
    console.log('Answer')
    this.pc.createAnswer({ offerToReceiveVideo: 1 })
      .then(sdp => {
        // console.log(JSON.stringify(sdp))
        this.pc.setLocalDescription(sdp)
        this.sendToPeer('offerOrAnswer', sdp)
        // }, e => { })
      })
  }

  addCandidate = () => {
    // const candidate = JSON.parse(this.textref.value)
    // console.log('Adding candidate:', candidate)

    // this.pc.addIceCandidate(new RTCIceCandidate(candidate))


    this.candidates.forEach(candidate => {
      console.log(JSON.stringify(candidate))
      this.pc.addIceCandidate(new RTCIceCandidate(candidate))
    })
  }


  render() {

    return (
      <div >
        <video
          style={{
            width: 240, height: 240, margin: 5, backgroundColor: 'black'
          }}
          ref={this.localVideoref}
          autoPlay>
        </video>

        <video
          style={{
            width: 240, height: 240, margin: 5, backgroundColor: 'black'
          }}
          ref={this.remoteVideoref}
          autoPlay>
        </video>

        <br />
        <button onClick={this.createOffer}>Offer</button>
        <button onClick={this.createAnswer}>Answer</button>
        <br />
        <textarea ref={ref => { this.textref = ref }} />
        {/* <br />
        <button onClick={this.setRemoteDescription}>Set Remote Desc</button>
        <button onClick={this.addCandidate}>Add Candidate</button> */}
      </div>
    )
  }
}

export default App;
