import React from 'react'

const EMBED_URL = 'https://embed.twitch.tv/embed/v1.js';
export class TwitchPlayer1 extends React.Component {
  componentDidMount() {
    const scriptId = "scripty"
    const embed = new window.Twitch.Player(this.props.targetId, { ...this.props, width:"100%", height:"100%" } );
    // const embed = new window.Twitch.Embed(this.props.targetId, { ...this.props }); 
    // console.log("qualities? = ",embed.getQualities())
    // this.onLoadTimeout = setTimeout(() => {
    //     console.log("qualities? = ",embed.getQualities())
    // }, 4000)
    const onReady = this.props.onReady
    const onProgress = this.props.onProgress
    const initialOffset = this.props.initialOffset
    this.ready = false
    const setupRefMs = Date.now()
    const waitIntervalMs = 5000
    var monitorVideoProgress = () => {
      if (onProgress != null && (Date.now() - setupRefMs) > waitIntervalMs) {
        onProgress(embed.getCurrentTime() - initialOffset)
      }
    }
    this.progressFn = setInterval(monitorVideoProgress, 1000)
    embed.addEventListener(window.Twitch.Embed.VIDEO_READY, () => {
      var player = embed.getPlayer();
      this.player = embed
      if (onReady != null){
        onReady(embed, initialOffset)
      }
    });
    embed.addEventListener(window.Twitch.Embed.SEEK, () => {
      var player = embed.getPlayer();
      if (onProgress != null && (Date.now() - setupRefMs) > waitIntervalMs) {
        onProgress(embed.getCurrentTime() - initialOffset)
      }
    });
  }

  componentWillUnmount() {
    clearTimeout(this.onLoadTimeout)
    clearInterval(this.progressFn)
    var embed = document.getElementById(this.props.targetId)
    if (embed != null) {
      embed.children[0]?.remove()
    }
  }

  render() {
    return (
      <div id={this.props.targetId} style={{backgroundColor: "var(--bg-main)", width: "100%", height: "100%"}} ></div>
    )
    // return (
    //   <div>
    //     <div id={this.props.targetId}></div>
    //   </div>
    // )
  }
}

TwitchPlayer1.defaultProps = {
  targetId: 'twitch-embed-1',
  width: '940',
  height: '480',
  // channel: 'vgbootcamp',
  // video: "1234",
}
