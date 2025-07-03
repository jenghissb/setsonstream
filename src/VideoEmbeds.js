
export function MediaPreview({item, streamSubIndex=0, width = 426, height = 24, useLiveStream=true, currentVideoOffset=0}) {
  if (item == null || item.streamInfo == undefined) {
    return BlankEmbed({width, height})
  }
  if (item.streamInfo.streamSource === "TWITCH") {
    var streamUrlInfo = item.streamInfo.streamUrls[0]
    return TwitchEmbed({channel: item.streamInfo.forTheatre, width, height, useLiveStream, videoId:streamUrlInfo.videoId, offsetHms:streamUrlInfo.offsetHms, currentVideoOffset})
  } else if (item.streamInfo.streamSource === "YOUTUBE" && null != item.streamInfo.streamUrls[streamSubIndex].embedUrl) {
    return YoutubeEmbed({url: item.streamInfo.streamUrls[streamSubIndex].embedUrl, width, height})
  } else {
    return BlankEmbed({width, height})
  }
}

function BlankEmbed({width = 426, height = 240 }) {
  const src = `about:blank`;
  return (
    <iframe
      src={src}
      width={width}
      height={height}
      allowFullScreen={true}
      title={`Blank`}
    />
  );
}

function TwitchEmbed({ channel, width = 426, height = 240, useLiveStream=true, videoId, offsetHms, currentVideoOffset=0}) {
  var src = `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}`;
  if (!useLiveStream && videoId != null && offsetHms != null) {
    var initialOffset = hmsStringToSeconds(offsetHms)
    var newOffset = Math.max(0, initialOffset + currentVideoOffset)
    var newOffsetHms = secondsToHmsString(newOffset)
    src = `https://player.twitch.tv/?video=${videoId}&t=${newOffsetHms}&parent=${window.location.hostname}`
  }
  //currentVideoOffset=0
  console.log(src)
  // const vodUrl = `https://www.twitch.tv/videos/2500360733?t=0h4m9s&parent=${window.location.hostname}`

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

function YoutubeEmbed({ url, width = 426, height = 240 }) {
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

function hmsStringToSeconds(hmsString) {
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

function secondsToHmsString(seconds) {
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

