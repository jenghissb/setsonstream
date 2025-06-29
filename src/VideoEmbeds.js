
export function MediaPreview({item, streamSubIndex=0, width = 426, height = 240}) {
  if (item.streamInfo.streamSource === "TWITCH") {
    return TwitchEmbed({channel: item.streamInfo.forTheatre, width, height})
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

function TwitchEmbed({ channel, width = 426, height = 240 }) {
  const src = `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}`;
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
