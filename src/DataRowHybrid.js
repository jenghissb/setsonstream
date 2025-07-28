import './DataRowHybrid.css';
import React, { useState, useEffect, memo, useRef, useCallback } from 'react';
import { MediaPreview } from "./VideoEmbeds.js"
import { charEmojiImagePath, schuEmojiImagePath, getLumitierIcon, getViewersTextFromItem, getStreamUrl, formatDisplayTimestamp, textMatches, getChannelName } from './Utilities.js'
import { RewindAndLiveButtons } from './RewindSetButton.js'
import { IconStartGg, IconStream } from './BrandIcons.js'

export const DataRowHybrid = memo(({item, filterInfo, useVideoInList, handleIndexChange, streamSubIndex=0, setStreamSubIndex, selected, mainVideoDim, useLiveStream, setUseLiveStream, showVodsMode, handleTimestampChange, rewindReady}) => {
  var preview = null
  var divClass = "drh-set-row-1"
  if (selected) divClass = divClass + " drh-set-row-1-selected"
  var onClick = (e) => {
    const selection = window.getSelection();
    if (selection.toString().length > 0) {
      return; // Exit the function to prevent further click handling
    }
    handleIndexChange(item.bracketInfo.setKey)
  }
  
  const handleStreamIndexButtonClick = (numSubStreams) => {
    setStreamSubIndex((streamSubIndex + 1) % numSubStreams);
  };

  var streamButton = null
  var numSubStreams = item.streamInfo.streamUrls.length
  if (numSubStreams > 1 && selected) {
    streamButton = <button onClick={() => handleStreamIndexButtonClick(numSubStreams)}><span>switch stream</span></button>
  }
  var tourneyBackgroundUrl=null
  var tourneyIconUrl = null
  try {
    if (item.bracketInfo.endTimeDetected == null && item.streamInfo.streamSource != "YOUTUBE") {
      const thumbWidth = 440;
      const thumbHeight = 248;//Math.trunc(thumbWidth*9/16)
      tourneyBackgroundUrl = `https://static-cdn.jtvnw.net/previews-ttv/live_user_${item.streamInfo.forTheatre.toLowerCase().normalize()}-${thumbWidth}x${thumbHeight}.jpg`
    } else {
      tourneyBackgroundUrl = item.bracketInfo.images[1].url
    }
    tourneyIconUrl = item.bracketInfo.images[0].url
  }catch{}
  var viewersText=""
  viewersText = getViewersTextFromItem(item)
  var updateIndexAndSetLive = (newLive) => {
    handleIndexChange(item.bracketInfo.setKey)
    setUseLiveStream(newLive)
  }
  if (item.matchesFilter) {
    divClass = `${divClass} drh-set-row-matches`
  }

  const textGlowClass="drh-textGlow"
  var tourneyTitleClass = "drh-tourneyTitle"
  if (textMatches(filterInfo, item.bracketInfo.tourneyName)) {
    tourneyTitleClass = `${tourneyTitleClass} ${textGlowClass}`
  }
  var player1NameClass = "drh-playerName"
  if (textMatches(filterInfo, item.player1Info.nameWithRomaji)) {
    player1NameClass = `${player1NameClass} ${textGlowClass}`
  }
  var player2NameClass = "drh-playerName"
  if (textMatches(filterInfo, item.player2Info.nameWithRomaji)) {
    player2NameClass = `${player2NameClass} ${textGlowClass}`
  }
  const startedAtText = formatDisplayTimestamp(item.bracketInfo.startedAt)
  var timestampText = `${startedAtText}`
  var liveTextSpan = null
  if (item.bracketInfo.endTimeDetected == null) {
    const liveText = ' LIVE'
    liveTextSpan = <span className='drh-live-text'>{liveText}</span>
  }
  const iconSize = "16px"; //youtube" 20px height
  const iconPaddingVert = "16px";
  const iconPaddingHorz = "8px";
  const iconStyle = {paddingLeft: iconPaddingHorz, paddingRigth: iconPaddingHorz, paddingTop: iconPaddingVert, paddingBottom: iconPaddingVert}
  const opacityStr = selected ? "0.7" : "0.15"
  const streamName = getChannelName(item.streamInfo)
  return (
    <div className="drw-outer">
      <div className={divClass} onClick={onClick} style={
        {
          backgroundImage: `linear-gradient(rgba(0, 0, 0, ${opacityStr}),  rgba(0, 0, 0, ${opacityStr})), url(${tourneyBackgroundUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center"
          // backgroundImage: "url(https://images.start.gg/images/tournament/801629/image-2c4b8e6351f06631091df62adc53b133.jpg)",
        }
      }>
        <div className="drh-tourney-icon" style={{backgroundImage: `url(${tourneyIconUrl})`, backgroundSize: "cover", backgroundPosition: "center",}} />
        <div className="drh-tourney-timestamp"><span className='drh-t1-stamp'>{timestampText}</span>{liveTextSpan}</div>
        <div className="drh-set-row-2">
        {selected && RewindAndLiveButtons({item, useLiveStream, setUseLiveStream, showVodsMode, shouldShow: selected, handleTimestampChange, rewindReady})}
        {streamButton}
        {selected && <div className="drh-set-row-2">
          <div className="drh-icons-row">
            <a href={item.bracketInfo.phaseGroupUrl} target="_blank" className="drh-bracketLink"><div className="drh-icons-row-icon"><IconStartGg width={18} height={18}/></div></a><br/>
            {item.streamInfo.streamUrls.map((sItem, index) => {
              const streamUrl = getStreamUrl(item.streamInfo, index)
              const streamLink = getStreamUrl(item.streamInfo, index, useLiveStream == false || showVodsMode)
              return <div key={index}><a href={streamLink} target="_blank" className="drh-bracketLink"><div className="drh-icons-row-icon-stream"><IconStream streamSource={item.streamInfo.streamSource}/></div></a><br/></div>
            })}
          </div>
        </div> }
        </div>
        <span className="drh-viewersText">{viewersText}👤 {item.bracketInfo.numEntrants}{"  "}</span>
        <span className="drh-locationText">{item.bracketInfo.locationStrWithRomaji}</span><br/>
        <div className="drh-rowPreviewHolder" >
        {
          preview
        } 
        </div>
      </div>
      <div className="drh-under-1">
        <span>
          <span className="drh-title-margin">{getLumitierIcon(item.bracketInfo.lumitier, {marginRight:'5px', paddingBottom: '1px', paddingTop: '1px', border: '2px solid #000', color: 'black', fontSize: 'large'})}<span className={tourneyTitleClass}>{item.bracketInfo.tourneyName}</span></span>
        </span>
        <div className="drh-set-row-4">
          <a href={item.player1Info.entrantUrl} target="_blank" className={player1NameClass}>{item.player1Info.nameWithRomaji}</a> {charEmojis(item.player1Info.charInfo, item.bracketInfo.gameId, "play1_", filterInfo)}<span className='drh-vsText'> vs </span><a href={item.player2Info.entrantUrl} target="_blank"  className={player2NameClass}>{item.player2Info.nameWithRomaji}</a> {charEmojis(item.player2Info.charInfo, item.bracketInfo.gameId, "play2_", filterInfo)}
        </div>
        <span style={{marginTop: "2px"}}>
          <span className="drh-streamNameText">{streamName}</span>
          <span className="drh-roundText"> - {item.bracketInfo.fullRoundText}</span>
        </span>
      </div>
    </div>
  );
})

function charEmojis(charInfo, gameId, prekey, filterInfo) {  
  var emojiArrs = []
  charInfo.forEach((item, index) => {
    emojiArrs.push(charEmojiImage(item.name, gameId, prekey + index + "_", filterInfo))
    if (item.schuEmojiName != null) {
      emojiArrs.push(schuEmojiImage(item.schuEmojiName, prekey + "schu_" + index + "_"))
    }
  })
  return emojiArrs.map((item, subindex) => 
    item
  )
}
function charEmojiImage(name, gameId, key = "", filterInfo) {
  const src = charEmojiImagePath(name, gameId)
  var matchesFilter = false;
  filterInfo?.filters[gameId]?.characters?.forEach(charName => {
    if (charName == name) {
      matchesFilter = true
    }
  })
  var emojiClass = "drh-charemoji"
  if (matchesFilter) {
    emojiClass = "drh-charemojimatches"
  }
  return <img className={emojiClass} key={key} src={charEmojiImagePath(name, gameId)}/>
}
function schuEmojiImage(name, key = "") {
  return <img className="drh-schuemoji" key={key} src={schuEmojiImagePath(name)}/>
}
