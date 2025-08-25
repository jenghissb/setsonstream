import './PlayerPage.css';
import React, { useState, useEffect, memo, useRef, useCallback } from 'react';
import { MediaPreview } from "./VideoEmbeds.js"
import { getStartggUserLink, charEmojiImagePath, schuEmojiImagePath, getLumitierIcon, getViewersTextFromItem, getStreamUrl, formatDisplayTimestamp, textMatches } from './Utilities.js'
import { RewindAndLiveButtons } from './RewindSetButton.js'
import { IconStartGg, IconStream } from './BrandIcons.js'

export const PlayerPage = memo(({filterInfo, mainVideoDim, data, playerInfo}) => {
  var preview = null
  var userSlug = playerInfo.userSlug
  const userName = useState(playerInfo.nameWithRomaji ?? "")
  // console.log("TEST24 playerInfo = ", playerInfo, ", userSlug = ", userSlug)
  // const userName = useState(playerInfo.userName ?? "")
  return <div className="playerPageContainer">
    <div>
      <div className="playerPagePlayerName" >{userName}</div>
      {BracketEmbed({})}
      {UserEmbed({userSlug})}
    </div>
  </div>
})

function BracketEmbed({width = 854, height = 480}) {
  var src = "https://www.start.gg/tournament/ualr-iliad-smash-65/event/ultimate-singles/brackets/2003530/2936329"
  src="https://www.start.gg/tournament/hit-115-in-maesuma-hit-115-in-hirakata/events/singles-tournament/brackets/2019687/2958078"
  return (
    <div className="playerPageBracket" style={{width:width, height: height}}>
    <iframe
      className="playerPageBracketContainer"   
      theme={"dark"}
      parent={window.location.hostname}
      sandbox="allow-scripts allow-same-origin allow-same-site-none-cookies allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
      allow-scripts
      allow-same-site-none-cookies
      // sandbox="allow-scripts allow-same-origin"
      // sandbox="allow-scripts" 
      // src={src}
      src={src+`/embed`}
      width={width}
      height={height+100}
    />
    </div>
  )

}


// function BracketEmbed({width = 854, height = 480}) {
//   var src = "https://www.start.gg/tournament/ualr-iliad-smash-65/event/ultimate-singles/brackets/2003530/2936329"
//   src="https://www.start.gg/tournament/hit-115-in-maesuma-hit-115-in-hirakata/events/singles-tournament/brackets/2019687/2958078"
//   return (
//     <div className="playerPageBracket" style={{width:width, height: height}}>
//     <iframe
//       className="playerPageBracketContainer"   
//       theme={"dark"}
//       parent={window.location.hostname}
//       sandbox="allow-scripts allow-same-origin"
//       allow-same-site-none-cookies
//       // sandbox="allow-scripts allow-same-origin"
//       // sandbox="allow-scripts" 
//       // src={src}
//       src={src+`/embed`}
//       width={width}
//       height={height+100}
//     />
//     </div>
//   )

// }

function UserEmbed({width = 854, height = 480, userSlug}) {
  var src = getStartggUserLink(userSlug)
  // src = "https://www.start.gg/user/5f648011/details"
  src = "https://www.start.gg/user/5f648011/schedule/embed"

  return (
    <iframe
      // sandbox="allow-scripts allow-same-origin"
      src={src+"/embed"}
      width={width}
      height={height}
      allowFullScreen={true}
      title={`BracketEmbed ${src}`}
    />
  );

}
