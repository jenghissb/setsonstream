export const MediaChat = ({item, streamSubIndex=0, width = 426, height = 24, useLiveStream=true}) => {
  console.log("USELIVESTREAM", useLiveStream)
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
    return TwitchEmbed({width, height, channel: item.streamInfo.forTheatre, setKey:item.bracketInfo.setKey, streamSubIndex})    
  } else if (item.streamInfo.streamSource === "YOUTUBE" && null != streamUrlInfo.videoId) {
    return YoutubeEmbed({width, height, videoId:streamUrlInfo.videoId, setKey:item.bracketInfo.setKey, streamSubIndex})
    // return YoutubeEmbedPrev({url: getEmbedUrl(item.streamInfo.streamUrls[streamSubIndex].videoId), width, height})
  } else {
    return BlankEmbed({width, height})
  }
}

const BlankEmbed = ({width, height}) => {
  return null
}
const TwitchEmbed = ({width, height, channel, setKey, streamSubIndex}) => {
  const src = `https://www.twitch.tv/embed/${channel}?parent=${window.location.hostname}`
  return (
    <iframe
      src={src}
      height={height}
      width={width}
      parent={window.location.hostname}
      />
    
  )
}


const YoutubeEmbed = ({width, height, videoId, setKey, streamSubIndex}) => {
  const src = `https://www.youtube.com/live_chat?v=${videoId}&embed_domain=${`${window.location.hostname}`}`
  return (
    <iframe
      src={src}
      width={width}
      height={height}
      allowFullScreen={true}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      title={`Youtube chat`}
    />
  );
}