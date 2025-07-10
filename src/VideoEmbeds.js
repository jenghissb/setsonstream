import React, { useEffect, useRef, memo } from 'react';
import { useState } from 'react';
import ReactPlayer from 'react-player';
import { TwitchPlayer1 } from './TwitchPlayer1.js'

export function MediaPreview({item, streamSubIndex=0, width = 426, height = 24, useLiveStream=true, currentVideoOffset=0, handleReady, onProgress, targetId=null}) {
  if (item == null || item.streamInfo == undefined) {
    return BlankEmbed({width, height})
  }
  const initialOffset = getStreamTimeOffset(item, streamSubIndex)
  if (item.streamInfo.streamSource === "TWITCH") {
    var streamUrlInfo = item.streamInfo.streamUrls[0]
    var options = {width, height}
    var useVod = !useLiveStream && streamUrlInfo.videoId != null
    var playerKey = ""
    if (useVod){
      options.video = streamUrlInfo.videoId
      playerKey = `${item.bracketInfo.setKey}_${options.video}`
      options.time = streamUrlInfo.offsetHms
    } else {
      // options.height = options.width
      // height: .8*window.innerHeight
      options.channel = item.streamInfo.forTheatre
      playerKey = `${item.bracketInfo.setKey}_${options.channel}`
    }
    if (targetId != null) {
      options.targetId = targetId
    }
    return <TwitchPlayer1 key={playerKey} {...options} initialOffset={initialOffset} onReady={handleReady} onProgress={onProgress}/>
    //return TwitchEmbedBefore({channel: item.streamInfo.forTheatre, width, height, useLiveStream, videoId:streamUrlInfo.videoId, offsetHms:streamUrlInfo.offsetHms, currentVideoOffset})
  } else if (item.streamInfo.streamSource === "YOUTUBE" && null != item.streamInfo.streamUrls[streamSubIndex].videoId) {
    var streamUrlInfo = item.streamInfo.streamUrls[0]
    return YoutubeEmbed({width, height, useLiveStream, videoId:streamUrlInfo.videoId, offset:streamUrlInfo.offset, currentVideoOffset, handleReady, onProgress, setKey:item.bracketInfo.setKey})
    // return YoutubeEmbedPrev({url: getEmbedUrl(item.streamInfo.streamUrls[streamSubIndex].videoId), width, height})
  } else {
    return BlankEmbed({width, height})
  }
}

function YoutubeEmbed({width = 426, height = 240, setKey, useLiveStream=true, videoId, offset, currentVideoOffset=0, handleReady, onProgress}) {
  var url = `https://www.youtube.com/watch?v=${videoId}`;
  var options = {
    youtube: {
      width,
      height,
      videoId,
      parent: [`${window.location.hostname}`]
    }
  }
  var useVod = !useLiveStream && videoId != null

  if (useVod){
    options.youtube.playerVars = {
      start: parseInt(offset)
    }
  }

  const onVideoProgress = (progressInfo) => {
    if (onProgress != null) {
      onProgress(progressInfo.playedSeconds - offset)
    }
  }
  return <ReactPlayer
    key={setKey + useLiveStream}
    url={url} // Replace with your Twitch channel URL
    config={
      options
    }
    controls={true} // Show player controls
    parent={window.location.hostname}
    playing={true}
    width={width}
    height={height}
    onReady={it => {
      if (handleReady != null){
        handleReady(it?.player ?? null)
      }
    }}
    onProgress={onVideoProgress}
      />
}

function getEmbedUrl(videoId) {
  return `https://www.youtube.com/embed/${videoId}`
}

export function MediaPreviewPrevious({item, streamSubIndex=0, width = 426, height = 24, useLiveStream=true, currentVideoOffset=0}) {
  // return BlankEmbed({width, height})
  // if (item == null || item.streamInfo == undefined) {
  //   return BlankEmbed({width, height})
  // }
  // if (item.streamInfo.streamSource === "TWITCH") {
  //   var streamUrlInfo = item.streamInfo.streamUrls[0]
  //   return TwitchEmbedBefore({channel: item.streamInfo.forTheatre, width, height, useLiveStream, videoId:streamUrlInfo.videoId, offsetHms:streamUrlInfo.offsetHms, currentVideoOffset})
  // } else if (item.streamInfo.streamSource === "YOUTUBE" && null != item.streamInfo.streamUrls[streamSubIndex].videoId) {
  //   return YoutubeEmbed({url: getEmbedUrl(item.streamInfo.streamUrls[streamSubIndex].videoId), width, height})
  // } else {
  //   return BlankEmbed({width, height})
  // }
}

function BlankEmbed({width = 426, height = 240 }) {
  const src = `about:blank`;
  return (
    <div
      style={{backgroundColor: "black", width, height}}
    />
  );

  // const src = `about:blank`;
  // return (
  //   <iframe
  //     src={src}
  //     width={width}
  //     height={height}
  //     allowFullScreen={true}
  //     title={`Blank`}
  //   />
  // );
}

export function getStreamTimeOffset(item, streamSubIndex=0) {
  const streamInfo = item.streamInfo
  // const source =
  const streamUrlInfo = streamInfo.streamUrls[streamSubIndex]
  var offset = 0
  if (streamUrlInfo.offset != null) {
    offset = streamUrlInfo.offset
  } else if (streamUrlInfo.offsetHms != null) {
    offset = hmsStringToSeconds(streamUrlInfo.offsetHms)
  } else if (streamUrlInfo.offsetS != null) {
    offset = parseInt(streamUrlInfo.offsetS.slice(0, -1))
  }
  return offset
}

function TwitchEmbedBefore({ channel, width = 426, height = 240, useLiveStream=true, videoId, offsetHms, currentVideoOffset=0}) {
  var src = `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}`;
  if (!useLiveStream && videoId != null && offsetHms != null) {
    var initialOffset = hmsStringToSeconds(offsetHms)
    var newOffset = Math.max(0, initialOffset + currentVideoOffset)
    var newOffsetHms = secondsToHmsString(newOffset)
    src = `https://player.twitch.tv/?video=${videoId}&t=${newOffsetHms}&parent=${window.location.hostname}`
  }

  return (
    <iframe
      src={src}
      muted={false}
      width={width}
      height={height}
      allowFullScreen={true}
      parent={window.location.hostname}
      title={`Twitch stream for ${channel}`}
    />
  );
}

function YoutubeEmbedPrev({ url, width = 426, height = 240 }) {
  const src = url + "?autoplay=1";
  return (
    <iframe
      src={src}
      width={width}
      height={height}
      allowFullScreen={true}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      title={`Youtube stream`}
    />
  );
}

export function hmsStringToSeconds(hmsString) {
  let seconds = 0;
  const regex = /(\d+)h(?:(\d+)m)?(?:(\d+)s)?/; // Regex to match the hms format
  const match = hmsString.match(regex);

  if (match) {
    const hours = parseInt(match[1]) || 0; // Extract hours and convert to integer (default to 0)
    const minutes = parseInt(match[2]) || 0; // Extract minutes and convert to integer (default to 0)
    const secs = parseInt(match[3]) || 0; // Extract seconds and convert to integer (default to 0)

    seconds += hours * 3600; // Convert hours to seconds
    seconds += minutes * 60; // Convert minutes to seconds
    seconds += secs; // Add the seconds
  }

  return seconds;
}

export function secondsToHmsString(seconds) {
  // Calculate hours, minutes, and seconds
  const hours = Math.floor(seconds / 3600); // 1.2.4, 1.5.1
  const minutes = Math.floor((seconds % 3600) / 60); // 1.2.4, 1.5.1
  const remainingSeconds = seconds % 60; // 1.2.4, 1.5.1

  // Format the output string
  let result = "";
  if (hours > 0) {
    result += hours + "h";
  }
  if (minutes > 0) {
    result += minutes + "m";
  }
  if (remainingSeconds > 0) {
    result += remainingSeconds + "s";
  }

  return result || "0s"; // Handle the case of 0 seconds
}

