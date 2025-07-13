import "./MediaChat.css"
export const MediaChat = ({item, streamSubIndex=0, width = 426, height = 24, useLiveStream=true, trimHeight=false, updateChatPref, chatPref}) => {
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
    return TwitchEmbed({width, height, channel: item.streamInfo.forTheatre, setKey:item.bracketInfo.setKey, streamSubIndex, trimHeight, updateChatPref, chatPref})    
  } else if (item.streamInfo.streamSource === "YOUTUBE" && null != streamUrlInfo.videoId) {
    return YoutubeEmbed({width, height, videoId:streamUrlInfo.videoId, setKey:item.bracketInfo.setKey, streamSubIndex, trimHeight, updateChatPref, chatPref})
    // return YoutubeEmbedPrev({url: getEmbedUrl(item.streamInfo.streamUrls[streamSubIndex].videoId), width, height})
  } else {
    return BlankEmbed({width, height})
  }
}

const BlankEmbed = ({width, height}) => {
  return null
}
const TwitchEmbed = ({width, height, channel, setKey, streamSubIndex, trimHeight, updateChatPref, chatPref}) => {
  const src = `https://www.twitch.tv/embed/${channel}/chat?darkpopout&parent=${window.location.hostname}`
  const expanded = chatPref?.expanded ?? true
  var coverTop = trimHeight ? 140 : 0
  var coverBottom = trimHeight ? 46 : 0
  const iframeWidth = width
  const iframeHeight = height + coverTop + coverBottom
  const showExpandMinim = trimHeight == true
  if (trimHeight && !expanded) {
    coverTop = iframeHeight+100
    coverBottom = -46
  }
  return (
    <div className="embedContainer">
      <iframe
        style={{border: "none", marginTop: -coverTop, marginBottom: -coverBottom, width: iframeWidth, height: iframeHeight}}
        src={src}
        height={iframeHeight}
        width={iframeWidth}
        theme={"dark"}
        parent={window.location.hostname}
        />
      {showExpandMinim && <ExpandMinimizeChat expanded={expanded} updateChatPref={updateChatPref} />}
    </div>
  )
}//darkpopout


const YoutubeEmbed = ({width, height, videoId, setKey, streamSubIndex, updateChatPref, chatPref }) => {
  const src = `https://www.youtube.com/live_chat?v=${videoId}&embed_domain=${`${window.location.hostname}`}`
  const expanded = chatPref?.expanded ?? true
  var coverTop = trimHeight ? 140 : 0
  var coverBottom = trimHeight ? 0 : 0
  const iframeWidth = width
  const iframeHeight = height + coverTop + coverBottom
  const showExpandMinim = trimHeight == true
  if (trimHeight && !expanded) {
    coverTop = iframeHeight+100
    coverBottom = -46
  }
  return (
    <div className="embedContainer">
      <iframe
        style={{border: "none", marginTop: -coverTop, marginBottom: -coverBottom, width: iframeWidth, height: iframeHeight}}
        src={src}
        width={width}
        height={height}
        allowFullScreen={true}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        title={`Youtube chat`}
      />
      {showExpandMinim && <ExpandMinimizeChat expanded={expanded} updateChatPref={updateChatPref} />}
    </div>
  );
}

const ExpandMinimizeChat = ({expanded, updateChatPref}) => {
  const text = expanded ? "⌃ minimize chat" : "⌄ maximize chat"
  return (
    <div className="expandChatHolder" onClick={() => updateChatPref(!expanded)}>
      <div className="expandChatText">{text}</div>
    </div>
  )
}