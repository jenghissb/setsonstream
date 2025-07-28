import React, { useRef, useEffect } from 'react';

export function getStartggUserLink(userSlug) {
  return `https://start.gg/user/${userSlug}`;
}

export function getCharUrl(charInfo, gameId){
  if (charInfo.length > 0) {
    return charEmojiImagePath(charInfo[0].name, gameId)
  } else {
    return process.env.PUBLIC_URL + `/charEmojis/unknownchar.png`
  }
}

export function getInternalImageUrl(subpath) {
  return process.env.PUBLIC_URL + "/" + subpath
}

export function charEmojiImagePath(name, gameId) {
  return process.env.PUBLIC_URL + `/charEmojis/${gameId}/${name}.png`
}

export function schuEmojiImagePath(name) {
  return process.env.PUBLIC_URL + `/scemojis/${name}.png`
}

export function getLumitierIconStr(lumitier) {
  var lumitierIconStr = ''
  if (lumitier != null && lumitier.length > 0) {
    var lumiColor = getLumiColor(lumitier)
    lumitierIconStr = `<span style="background:${lumiColor}; font-size: 13px; padding-left: 5px; padding-right: 5px; padding-bottom: 2px; margin-left: -2px; margin-top: 80px; border-radius: 6px; border: 1px solid rgb(7, 41, 87); color: #fff">${lumitier}</span>`
  }
  return lumitierIconStr
}

export function getLumitierIcon(lumitier, conditionalStyles={}) {
//   lumitier = "C+"
  if (lumitier != null && lumitier.length > 0) {
    var lumiColor = getLumiColor(lumitier)
    return <span style={{background: lumiColor, fontSize: '13px', paddingLeft: '5px', paddingRight: '5px', paddingBottom: '2px' , borderRadius: '6px', border: '1px solid rgb(7, 41, 87)', ...conditionalStyles}}>{lumitier}</span>
  } else {
    return <span/>
  }
}


function getLumiColor(lumitier) {
    var lumiColor;
    //reference:
      // charEmojiImagePathase 'D':
      //   lumiColor = "rgb(119, 195, 223)"; break;
      // case 'C':
      //   lumiColor = "rgb(132, 227, 122)"; break;
      // case 'B':
      //   lumiColor = "rgb(221, 229, 114)"; break;
      // case 'A':
      //   lumiColor = "rgb(220, 166, 103)"; break;
      // case 'S':
      //   lumiColor = "rgb(210, 100, 96)"; break;
      // case 'P':
      //   lumiColor = "rgb(119, 195, 223)"; break;
      // default:
      //   lumiColor = "rgb(8, 83, 181)";
    // lumiColor = "#bdc636"; break;

    switch (lumitier.charAt(0)) {
      case 'D':
        lumiColor = "#77c3df"; break;
      case 'C':
        lumiColor = "#84e37a"; break;
      case 'B':
        lumiColor = "#bdc636"; break;
      case 'A':
        lumiColor = "#dca667"; break;
      case 'S':
        lumiColor = "#d26460"; break;
      case 'P':
        lumiColor = "#77c3df"; break;
      default:
        lumiColor = "#0853b5";
    }
    return lumiColor
}

export function getViewersTextFromItem(item) {
  var viewersText = ""
  var streamUrls = item.streamInfo.streamUrls
  if(streamUrls.length > 0 && streamUrls[0].viewerCount !=null && streamUrls[0].viewerCount > 5) {
    viewersText = `👁️ ${streamUrls[0].viewerCount}  `
  }
  return viewersText
}

export function useOnClickOutside(ref, handler) {
  useEffect(
    () => {
      const listener = (event) => {
        // Do nothing if clicking ref's element or descendent elements
        if (!ref.current || ref.current.contains(event.target)) {
          return;
        }
        handler(event);
      };

      document.addEventListener('mousedown', listener);
      document.addEventListener('touchstart', listener);

      return () => {
        document.removeEventListener('mousedown', listener);
        document.removeEventListener('touchstart', listener);
      };
    },
    [ref, handler] // Re-run if ref or handler changes
  );
}


export function supportsRewindSet(item) {
  var supportsRewind = false
  if (item == null || item.streamInfo == undefined) {
    // supportsRewind = false
  } else if (item.streamInfo.streamSource === "TWITCH") {
    var streamUrlInfo = item.streamInfo.streamUrls[0]
    if (streamUrlInfo.videoId != null && streamUrlInfo.offsetHms != null) {
      supportsRewind = true
    }
  } else if (item.streamInfo.streamSource === "YOUTUBE" && null != item.streamInfo.streamUrls[0].videoId) {
    var streamUrlInfo = item.streamInfo.streamUrls[0]
    if (streamUrlInfo.videoId != null && streamUrlInfo.offset != null) {
      supportsRewind = true
    }

  } else {
    // supportsRewind = false
  }
  return supportsRewind
}

export function getStreamUrl(streamInfo, index, preferTimestampedVod=false) {
  const streamUrlInfo = streamInfo.streamUrls[index]
  if (streamInfo.streamSource == 'YOUTUBE') {
    const videoId = streamUrlInfo.videoId
    if (videoId != null) {
      if (preferTimestampedVod && streamUrlInfo.offset != null) {
        return `https://www.youtube.com/watch?v=${videoId}?t=${streamUrlInfo.offset}s`
      } else {
        return `https://www.youtube.com/watch?v=${videoId}`
      }
    } else if (streamUrlInfo.streamUrl != null) {
      return streamUrlInfo.streamUrl
    } else {
      const channel = streamInfo.ytChannelId
      return `https://www.youtube.com/${channel}`
    }
  } else if (streamInfo.streamSource == 'TWITCH') {
    const videoId = streamUrlInfo.videoId
    if (preferTimestampedVod && videoId != null) {
      var offsetParamText = ""
      if (streamUrlInfo.offsetHms) {
        offsetParamText = `?t=${streamUrlInfo.offsetHms}`
      }
      return `https://www.twitch.tv/videos/${videoId}${offsetParamText}`
    } else {
      return `https://www.twitch.tv/${streamInfo.forTheatre}`
    }
  }
}

export function getChannelName(streamInfo) {
  if (streamInfo.streamSource == 'YOUTUBE') {
    return streamInfo.streamName ?? " " //streamInfo.ytChannelId
  } else if (streamInfo.streamSource == 'TWITCH') {
    return streamInfo.forTheatre
  } else {
    return streamInfo.channel
  }
}

export function formatDisplayTimestamp(unixTimestamp) {
  const date = new Date(unixTimestamp * 1000); // Convert seconds to milliseconds
  const now = new Date(); // Current local date and time

  // Check if the date is the same day
  const isSameDay = date.getDate() === now.getDate() &&
                    date.getMonth() === now.getMonth() &&
                    date.getFullYear() === now.getFullYear();

  if (isSameDay) {
    // Format as time only (e.g., "10:30 AM")
    // date
    return date.toLocaleTimeString([], { hour: 'numeric', minute: 'numeric' });
  } else {
    // Format as date and time (e.g., "July 7, 2025, 10:30 AM")
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  }
}

function checkPropsAreEqual(prevProps, nextProps) {
  console.log("checkPropsAreEqual")
  Object.keys(nextProps).forEach((key) => {
    if (prevProps[key] == nextProps[key]) {

    } else {
      console.log(key, ", false: ", prevProps[key], nextProps[key])
    }
  })
  Object.keys(nextProps).forEach((key) => {
    if (prevProps[key] != nextProps[key]) return false
  })
  return true
}

export const textMatches = (filterInfo, text) => {
  if (text == null || text.length == 9) {
    return false
  }
  var matches = false
  var Acheck = false
  filterInfo.filters[filterInfo.currentGameId]?.searches?.forEach((searchTerm) => {
    if (typeof searchTerm === "string") {
      if (text.toLowerCase().indexOf(searchTerm.toLowerCase()) >=0) {
        matches = true
      }
    }
  })
  return matches
}
