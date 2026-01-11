import React, { useRef, useEffect } from 'react';
import { VideoGameInfo, VideoGameInfoById } from './GameInfo.js';

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
    return <span title aria-label={`${lumitier} tier tournament`} style={{background: lumiColor, fontSize: '13px', paddingLeft: '5px', paddingRight: '5px', paddingBottom: '2px' , borderRadius: '6px', border: '1px solid rgb(7, 41, 87)', ...conditionalStyles}}>{lumitier}</span>
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

export function getStreamEmbedUrl(streamInfo, index, preferTimestampedVod=false) {
  const streamUrlInfo = streamInfo.streamUrls[index]
  if (streamInfo.streamSource == 'YOUTUBE') {
    const videoId = streamUrlInfo.videoId
    if (videoId != null) {
      if (preferTimestampedVod && streamUrlInfo.offset != null) {
        return `https://www.youtube.com/embed/${videoId}?start=${streamUrlInfo.offset}s`
      } else {
        return `https://www.youtube.com/embed/${videoId}`
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
        offsetParamText = `&t=${streamUrlInfo.offsetHms}`
      }
      return `https://player.twitch.tv/?video=${videoId}${offsetParamText}&parent=${window.location.hostname}`
    } else {
      return `https://player.twitch.tv/?channel=${streamInfo.forTheatre}&parent=${window.location.hostname}`
    }
  }
}

export function getChannelName(streamInfo) {
  if (streamInfo?.streamSource == 'YOUTUBE') {
    return streamInfo?.streamName ?? " " //streamInfo.ytChannelId
  } else if (streamInfo?.streamSource == 'TWITCH') {
    return streamInfo?.forTheatre
  } else {
    return streamInfo?.channel
  }
}

export function getTourneySlug(bracketInfo) {
  const url = bracketInfo?.url ?? "";
  const prefix = "https://www.start.gg/tournament/"
  if (url.startsWith(prefix))
    return url.slice(prefix.length)
  return ""
  //"https://www.start.gg/tournament/versus-reborn-216"

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

export function checkPropsAreEqual(prevProps, nextProps) {
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

export const textMatches = (filterInfo, text, item, favMap) => {
  if (text == null || text.length == 9) {
    return false
  }
  var matches = false
  var Acheck = false
  filterInfo.filters[filterInfo.currentGameId]?.searches?.forEach((searchTerm) => {
    if (searchTerm.textSearch != null) {
      if (text.toLowerCase().indexOf(searchTerm.textSearch.toLowerCase()) >=0) {
        matches = true
        if (favMap != null && (favMap.get(searchTerm) == undefined || favMap.get(searchTerm).at(-1) != item)) {
          favMap.set(searchTerm, favMap.get(searchTerm)?? [])
          favMap.get(searchTerm).push(item)
        }
      }
    }
  })
  return matches
}

export const tourneyMatches = (filterInfo, item) => {
  var matches = false
  const tourneySlug = getTourneySlug(item.bracketInfo)
  filterInfo.filters[filterInfo.currentGameId]?.searches?.forEach((searchTerm) => {
    if (searchTerm.tourneySlug && searchTerm.tourneySlug == tourneySlug) {
      matches = true
    } else if (searchTerm.textSearch) {
      if (item.bracketInfo.tourneyName.toLowerCase().indexOf(searchTerm.textSearch.toLowerCase()) >=0) {
        matches = true
      }
    }
  })
  return matches
}

export function getCSSVariable(name, element = document.documentElement) {
  return getComputedStyle(element).getPropertyValue(name).trim();
}

export function isDarkMode() {
  return document.documentElement.getAttribute('data-theme') != "light"
}

export function isThemeDark(theme) {
  return theme != "light"
}

export function getPlayerLink(userSlug, gameId) {
  return `/game/${VideoGameInfoById[gameId]?.gameSlug ?? "unknown"}/player/${userSlug}/`
}

export function getGameLink(gameId) {
  return `/game/${VideoGameInfoById[gameId]?.gameSlug ?? "/"}`
}
export function getCharLink(charName, gameId) {
  return `/game/${VideoGameInfoById[gameId]?.gameSlug ?? "unknown"}/char/${charName}/`
}

export function getTourneyLink(tourneySlug="unknown", gameId) {
  return `/game/${VideoGameInfoById[gameId]?.gameSlug ?? "unknown"}/tournament/${tourneySlug}/`
}

export function getChannelLink(channelSlug="unknown", gameId) {
  return `/game/${VideoGameInfoById[gameId]?.gameSlug ?? "unknown"}/channel/${channelSlug}/`
}

export function getSearchLink(textSearch, gameId) {
  return `/game/${VideoGameInfoById[gameId]?.gameSlug ?? "unknown"}/search/${encodeURIComponent(textSearch)}/`
}

export function getItemLink({searchTerm, gameId, setKey, tourneySlug=null}) {
  let url;
  if (searchTerm && gameId) {
    url = getLinkFromSearch(searchTerm, gameId, tourneySlug)
  } else {
    url = window.location.pathname
  }
  if (setKey != null) {
    let cleanedUrl = url.replace(/\/set\/[^/]+\/?$/, '');
    cleanedUrl = cleanedUrl.replace(/\/$/, '');
    url = `${cleanedUrl}/set/${setKey}/`
  }
  if (!url.endsWith("/")) {
    url = url + "/"
  }
  // // const searchParams = new URLSearchParams(window.location.search);
  // if (setKey != null) {
  //   const searchParams = new URLSearchParams()
  //   searchParams.set("setId", setKey);
  //   url = `${url}?${searchParams.toString()}`
  // }
  return url
}

export function getLinkFromSearch(searchTerm, gameId, tourneySlug=null) {
  if (typeof searchTerm === "string") {
    return "/"
  } else if (searchTerm.userSlug != null) {
    return getPlayerLink(searchTerm.userSlug, gameId)
  } else if ((searchTerm.tourneySlug || tourneySlug) != null) {
    return getTourneyLink(searchTerm.tourneySlug || tourneySlug, gameId)
  } else if (searchTerm.channelName != null) {
    return getChannelLink(searchTerm.channelName, gameId)
  } else if (searchTerm.charName != null) {
    return getCharLink(searchTerm.charName, gameId)
  } else if (searchTerm.textSearch != null) {
    return getSearchLink(searchTerm.textSearch, gameId)
  } else if (searchTerm.gameId != null) {
    return getGameLink(searchTerm.gameId, gameId)
  }
  return "/"
}

export function renderHomeIcon({width, height}) {
  return <svg version="1.1" id="homeIcon" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink" 
    viewBox="0 0 32 32" width={width} height={height}>
    <polyline fill="none" stroke="var(--text-main-color-subdue-3" strokeWidth="2" strokeMiterlimit="10" points="3,17 16,4 29,17 "/>
    <polyline fill="none" stroke="var(--text-main-color-subdue-3" strokeWidth="2" strokeMiterlimit="10" points="6,14 6,27 13,27 13,17 19,17 19,27 26,27 
    26,14 "/>
  </svg>
}

export function renderExpandIcon({width="24px", height="24px"}) {
  return <svg xmlns="http://www.w3.org/2000/svg" height={height} width={width} viewBox="0 -960 960 960" fill="var(--text-main-color-subdue-3"><path d="M120-120v-320h80v184l504-504H520v-80h320v320h-80v-184L256-200h184v80H120Z"/></svg>
}

export function renderPlaylistIcon({width="14px", height="14px"}) {
  const color = "var(--text-main-color-subdue-3"
  return <svg width={width} height={height} viewBox="0 0 16 16" version="1.1" xmlns="http://www.w3.org/2000/svg" xlink="http://www.w3.org/1999/xlink">
    <path fill={color} d="M0 0.7h4v2.6h-4v-3z"></path>
    <path fill={color} d="M0 4.7h4v2.6h-4v-3z"></path>
    <path fill={color} d="M0 12.7h4v2.6h-4v-3z"></path>
    <path fill={color} d="M0 8.7h4v2.6h-4v-3z"></path>
    <path fill={color} d="M5 0.7h11v2.6h-11v-3z"></path>
    <path fill={color} d="M5 4.7h11v2.6h-11v-3z"></path>
    <path fill={color} d="M5 12.7h11v2.6h-11v-3z"></path>
    <path fill={color} d="M5 8.7h11v2.6h-11v-3z"></path>
  </svg>
}

function getLastModified(item) {
  var lastMod = item.bracketInfo.startedAt
  if (item.bracketInfo.endTimeDetected) {
    lastMod = item.bracketInfo.endTimeDetected
  }
  if (item.bracketInfo.endTime != null) {
    lastMod = + item.bracketInfo.endTimeDetected + 1
  }
  if (item.bracketInfo.lastMod != null) {
    lastMod = item.bracketInfo.lastMod + 1
  }
  return lastMod
}

export function itemHasUpdated(prevSet, newSet) {
  return (getLastModified(newSet) > getLastModified(prevSet))
}

export function DynamicContainer({ isHeading, children }) {
  return isHeading ? (
    <h1>{children}</h1>
  ) : (
    <div>{children}</div>
  );
}
