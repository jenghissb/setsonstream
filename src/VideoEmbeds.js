
export function MediaPreview({item, streamSubIndex=0, width = 426, height = 24, useLiveStream=true}) {
  if (item == null || item.streamInfo == undefined) {
    return BlankEmbed({width, height})
  }
  if (item.streamInfo.streamSource === "TWITCH") {
    return TwitchEmbed({channel: item.streamInfo.forTheatre, width, height, useLiveStream})
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

function TwitchEmbed({ channel, width = 426, height = 240, useLiveStream=true }) {
  var src = `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}`;
  if (!useLiveStream) {
    src = `https://www.twitch.tv/videos/2500360733?t=0h4m9s&parent=www.${window.location.hostname}`
  }

  console.log(src)

  // const vodUrl = `https://www.twitch.tv/videos/2500360733?t=0h4m9s&parent=${window.location.hostname}`

  return (
    <iframe
      src={src}
      muted={false}
      width={width}
      height={height}
      allowFullScreen={true}
      parent={"www."+window.location.hostname}
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
