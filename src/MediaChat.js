import "./MediaChat.css"
import { useContext } from "react";
import { ThemeContext } from './ThemeContext';
import { isThemeDark } from "./Utilities";
export const MediaChat = ({item, streamSubIndex=0, width = 426, height = 24, useLiveStream=true, trimHeight=false, updateChatPref, chatPref, showExpandMinim}) => {
  const { theme } = useContext(ThemeContext);
  const isDark = isThemeDark(theme)
  // const isDark = false
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
    return TwitchEmbed({isDark, width, height, channel: item.streamInfo.forTheatre, setKey:item.bracketInfo.setKey, streamSubIndex, trimHeight, updateChatPref, chatPref, showExpandMinim})    
  } else if (item.streamInfo.streamSource === "YOUTUBE" && null != streamUrlInfo.videoId) {
    return YoutubeEmbed({width, height, videoId:streamUrlInfo.videoId, setKey:item.bracketInfo.setKey, streamSubIndex, trimHeight, updateChatPref, chatPref, showExpandMinim})
    // return YoutubeEmbedPrev({url: getEmbedUrl(item.streamInfo.streamUrls[streamSubIndex].videoId), width, height})
  } else {  
    return BlankEmbed({width, height})
  }
}

const BlankEmbed = ({width, height}) => {
  return null
}
const TwitchEmbed = ({isDark, width, height, channel, setKey, streamSubIndex, trimHeight, updateChatPref, chatPref, showExpandMinim}) => {
  const darkClassStr = isDark ? "darkpopout&" : ""
  const src = `https://www.twitch.tv/embed/${channel}/chat?${darkClassStr}parent=${window.location.hostname}`
  const expanded = chatPref?.expanded ?? false
  var coverTop = trimHeight ? 140 : 0
  var coverBottom = trimHeight ? 52 : 0
  // const heightAdj = height + 4
  const iframeWidth = width
  const iframeHeight = height + coverTop + coverBottom
  if (trimHeight && !expanded) {
    coverTop = iframeHeight+100
    coverBottom = -52
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


const YoutubeEmbed = ({width, height, videoId, setKey, streamSubIndex, trimHeight, updateChatPref, chatPref, showExpandMinim }) => {
  const src = `https://www.youtube.com/live_chat?v=${videoId}&embed_domain=${`${window.location.hostname}`}`
  const expanded = chatPref?.expanded ?? false
  var coverTop = trimHeight ? 140 : 0
  var coverBottom = trimHeight ? 0 : 0
  const iframeWidth = width
  const iframeHeight = height + coverTop + coverBottom
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
  if (expanded) {
    return (
      <div className="expandChatHolder" onClick={() => updateChatPref(!expanded)}>
        <div className="expandChatText">
        <ChevronUp width="20px" height="30px" color="#cccccc"/>
        <ChatBubble width="30px" height="30px" color="#cccccc" color2="01010100"/>
        </div>
      </div>
    )
  } else {
    return (
      <div className="expandChatHolder" onClick={() => updateChatPref(!expanded)}>
        <div className="expandChatText">
          <ChevronDown width="20px" height="30px" color="#cccccc"/>
          <ChatBubble width="30px" height="30px" color="#cccccc" color2="01010100"/>
        </div>
      </div>
    ) 
  }

  const text = expanded ? "⌃ minimize chat" : "⌄ maximize chat"
  return (
    <div className="expandChatHolder" onClick={() => updateChatPref(!expanded)}>
      <div className="expandChatText">{text}</div>
    </div>
  )
}

const ChevronUp = ({width, height, color}) => {
  return <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 448 448"><path fillOpacity="1" fill={color}  strokeWidth="32" strokeLinecap="butt" strokeLinejoin="miter" strokeMiterlimit="4" strokeDasharray="none" d="m384 871.925-37.46 36.437L224 789.17 101.46 908.362 64 871.925l37.426-36.403.034.033L224 716.362l122.54 119.193.034-.033z" transform="translate(0 -604.362)"/></svg>
}

const ChevronDown = ({width, height, color}) => {
  return <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 448 448"><path fillOpacity="1" fill={color} strokeWidth="32" strokeLinecap="butt" strokeLinejoin="miter" strokeMiterlimit="4" strokeDasharray="none" d="m384 784.8-37.46-36.438L224 867.555 101.46 748.362 64 784.8l37.426 36.404.034-.034L224 940.362 346.54 821.17l.034.034z" transform="translate(0 -604.362)"/></svg>
}

const ChatBubble = ({width, height, color, color2}) => {
  return <svg width={width} height={height} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><circle cx="16" cy="16" r="16" fill={color2}/><path fill={color} d="M16.28 23.325a11.5 11.5 0 0 0 2.084-.34 5.7 5.7 0 0 0 2.602.17 1 1 0 0 1 .104-.008c.31 0 .717.18 1.31.56v-.625a.61.61 0 0 1 .311-.531q.388-.22.717-.499c.864-.732 1.352-1.708 1.352-2.742q-.002-.522-.159-1.006.393-.732.627-1.53A4.6 4.6 0 0 1 26 19.31c0 1.405-.654 2.715-1.785 3.673a6 6 0 0 1-.595.442v1.461c0 .503-.58.792-.989.493a15 15 0 0 0-1.2-.81 3 3 0 0 0-.368-.187q-.511.077-1.039.077c-1.412 0-2.716-.423-3.743-1.134zm-7.466-2.922C7.03 18.89 6 16.829 6 14.62c0-4.513 4.258-8.12 9.457-8.12s9.458 3.607 9.458 8.12c0 4.514-4.259 8.121-9.458 8.121q-.878 0-1.728-.135c-.245.058-1.224.64-2.635 1.67-.511.374-1.236.013-1.236-.616v-2.492a9 9 0 0 1-1.044-.765m4.949.666q.065 0 .13.01c.51.086 1.034.13 1.564.13 4.392 0 7.907-2.978 7.907-6.589 0-3.61-3.515-6.588-7.907-6.588-4.39 0-7.907 2.978-7.907 6.588 0 1.746.821 3.39 2.273 4.62q.55.464 1.196.832c.241.136.39.39.39.664v1.437c1.116-.749 1.85-1.104 2.354-1.104m-2.337-4.916c-.685 0-1.24-.55-1.24-1.226 0-.677.555-1.226 1.24-1.226s1.24.549 1.24 1.226-.555 1.226-1.24 1.226m4.031 0c-.685 0-1.24-.55-1.24-1.226 0-.677.555-1.226 1.24-1.226s1.24.549 1.24 1.226-.555 1.226-1.24 1.226m4.031 0c-.685 0-1.24-.55-1.24-1.226 0-.677.555-1.226 1.24-1.226s1.24.549 1.24 1.226-.555 1.226-1.24 1.226"/></g></svg>
}

const BracketIcon = ({width, height, color}) => {
  return <svg width={width} height={height} viewBox="0 0 76 76" xmlns="http://www.w3.org/2000/svg" version="1.1" baseProfile="full" enableBackground="new 0 0 76.00 76.00">
    <path fill={color} fillOpacity="1" strokeWidth="0.2" strokeLinejoin="round" d="M 23.75,60.1667L 23.75,53.8333L 31.6667,53.8333L 31.6666,47.5L 23.75,47.5L 23.75,41.1667L 38,41.1667L 38,47.5L 44.3333,47.5L 44.3333,28.5L 38,28.5L 38,34.8333L 23.75,34.8333L 23.75,28.5L 31.6667,28.5L 31.6666,22.1666L 23.75,22.1667L 23.75,15.8333L 38,15.8333L 38,22.1666L 50.6666,22.1667L 50.6666,34.8333L 58.5833,34.8333L 58.5833,41.1667L 50.6666,41.1667L 50.6666,53.8333L 38,53.8333L 38,60.1667L 23.75,60.1667 Z "/>
  </svg>
}