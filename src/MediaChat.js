export const MediaChat = ({item, streamSubIndex=0, width = 426, height = 24, useLiveStream=true, trimHeight=false}) => {
  if (!useLiveStream) {
    return;
  }
  if (item == null || item.streamInfo == undefined) {
    return BlankEmbed({width, height})
  }
  var streamUrlInfo = item.streamInfo.streamUrls[0]
  if (streamSubIndex < item.streamInfo.streamUrls.length) {
    streamUrlInfo = item.streamInfo.streamUrls[streamSubIndex]
  }
  if (item.streamInfo.streamSource === "TWITCH") {
    return TwitchEmbed({width, height, channel: item.streamInfo.forTheatre, setKey:item.bracketInfo.setKey, streamSubIndex, trimHeight})    
  } else if (item.streamInfo.streamSource === "YOUTUBE" && null != streamUrlInfo.videoId) {
    return YoutubeEmbed({width, height, videoId:streamUrlInfo.videoId, setKey:item.bracketInfo.setKey, streamSubIndex, trimHeight})
    // return YoutubeEmbedPrev({url: getEmbedUrl(item.streamInfo.streamUrls[streamSubIndex].videoId), width, height})
  } else {
    return BlankEmbed({width, height})
  }
}

const BlankEmbed = ({width, height}) => {
  return null
}
const TwitchEmbed = ({width, height, channel, setKey, streamSubIndex, trimHeight}) => {
  const src = `https://www.twitch.tv/embed/${channel}/chat?darkpopout&parent=${window.location.hostname}`
  const coverTop = trimHeight ? 140 : 0
  const coverBottom = trimHeight ? 52 : 0
  const iframeWidth = width
  const iframeHeight = height + coverTop + coverBottom
  return (
    <div style={{overflow: "hidden"}}>
      <iframe
        style={{border: "none", marginTop: -coverTop, marginBottom: -coverBottom, width: iframeWidth, height: iframeHeight}}
        src={src}
        height={iframeHeight}
        width={iframeWidth}
        theme={"dark"}
        parent={window.location.hostname}
        />
    </div>
  )
}//darkpopout


const YoutubeEmbed = ({width, height, videoId, setKey, streamSubIndex}) => {
  const src = `https://www.youtube.com/live_chat?v=${videoId}&embed_domain=${`${window.location.hostname}`}`
  const coverTop = 140;
  const iframeWidth = width
  const iframeHeight = height + coverTop

  return (
    <div style={{overflow: "hidden"}}>
      <iframe
        style={{border: "none", marginTop: -coverTop, width: iframeWidth, height: iframeHeight}}
        src={src}
        width={width}
        height={height}
        allowFullScreen={true}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        title={`Youtube chat`}
      />
    </div>
  );
}