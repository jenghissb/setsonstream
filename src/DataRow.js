import './DataRow.css';
import React, { useState, useEffect, memo, useRef, useCallback } from 'react';
import { MediaPreview } from "./VideoEmbeds.js"
import { charEmojiImagePath, schuEmojiImagePath, getLumitierIcon, getViewersTextFromItem, getStreamUrl, formatDisplayTimestamp, textMatches } from './Utilities.js'
import { RewindAndLiveButtons } from './RewindSetButton.js'
import { DataRowSimple } from './DataRowSimple.js';

export const DataRow = memo(({item, filterInfo, useVideoInList, handleIndexChange, streamSubIndex=0, setStreamSubIndex, selected, mainVideoDim, useLiveStream, setUseLiveStream, showVodsMode, handleTimestampChange, rewindReady}) => {
  return <DataRowSimple {...{item, filterInfo, useVideoInList, handleIndexChange, streamSubIndex, setStreamSubIndex, selected, mainVideoDim, useLiveStream, setUseLiveStream, showVodsMode, handleTimestampChange, rewindReady}} />
  var preview = null
  if (useVideoInList) {
    var scale = 0.97
    preview = MediaPreview({item: item, width: mainVideoDim.width * scale, height: mainVideoDim.height * scale})
  }
  var divClass = "set-row-1"
  if (selected) divClass = divClass + " set-row-1-selected"
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
    tourneyBackgroundUrl = item.bracketInfo.images[1].url
    tourneyIconUrl = item.bracketInfo.images[0].url
  }catch{}
  var viewersText=""
  viewersText = getViewersTextFromItem(item)
  var updateIndexAndSetLive = (newLive) => {
    handleIndexChange(item.bracketInfo.setKey)
    setUseLiveStream(newLive)
  }
  if (item.matchesFilter) {
    divClass = `${divClass} set-row-matches`
  }

  const textGlowClass="textGlow"
  var tourneyTitleClass = "tourneyTitle"
  if (textMatches(filterInfo, item.bracketInfo.tourneyName)) {
    tourneyTitleClass = `${tourneyTitleClass} ${textGlowClass}`
  }
  var player1NameClass = "playerName"
  if (textMatches(filterInfo, item.player1Info.nameWithRomaji)) {
    player1NameClass = `${player1NameClass} ${textGlowClass}`
  }
  var player2NameClass = "playerName"
  if (textMatches(filterInfo, item.player2Info.nameWithRomaji)) {
    player2NameClass = `${player2NameClass} ${textGlowClass}`
  }
  const startedAtText = formatDisplayTimestamp(item.bracketInfo.startedAt)
  var timestampText = `${startedAtText}`
  var liveTextSpan = null
  if (item.bracketInfo.endTimeDetected == null) {
    const liveText = ' LIVE'
    liveTextSpan = <span className='live-text'>{liveText}</span>
  }
  return (
    <div className={divClass} onClick={onClick} style={
      {
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4),  rgba(0, 0, 0, 0.4)), url(${tourneyBackgroundUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center"
        // backgroundImage: "url(https://images.start.gg/images/tournament/801629/image-2c4b8e6351f06631091df62adc53b133.jpg)",
      }
    }>
      <div className="tourney-icon" style={{backgroundImage: `url(${tourneyIconUrl})`, backgroundSize: "cover", backgroundPosition: "center",}} />
      <div className="tourney-timestamp"><span className='t1-stamp'>{timestampText}</span>{liveTextSpan}</div>
      <div className="set-row-2">
        {getLumitierIcon(item.bracketInfo.lumitier, {marginRight:'5px', paddingBottom: '1px', paddingTop: '1px', border: '2px solid #000', color: 'black', fontSize: 'large'})}<span className={tourneyTitleClass}>{item.bracketInfo.tourneyName}</span><br/>
        <span className="tourneyText" style={{ marginRight: '5px' }}>{viewersText}👤 {item.bracketInfo.numEntrants}{"  "}</span><span className="tourneyText">{item.bracketInfo.locationStrWithRomaji}</span><br/>
        <span className="tourneyText">{item.bracketInfo.fullRoundText}</span><br/>
      </div>
      {RewindAndLiveButtons({item, useLiveStream, setUseLiveStream, showVodsMode, shouldShow: selected, handleTimestampChange, rewindReady})}
      {streamButton}
      <div className="set-row-2">
        <a href={item.bracketInfo.phaseGroupUrl} target="_blank" className="bracketLink">{item.bracketInfo.url}</a><br/>
        {item.streamInfo.streamUrls.map((sItem, index) => {
          const streamUrl = getStreamUrl(item.streamInfo, index)
          const streamLink = getStreamUrl(item.streamInfo, index, useLiveStream == false || showVodsMode)
          return <div key={index}><a href={streamLink} target="_blank" className="bracketLink">{streamUrl}</a><br/></div>
        })}
      </div>
      <div className="set-row-4">
        <a href={item.player1Info.entrantUrl} target="_blank" className={player1NameClass}>{item.player1Info.nameWithRomaji}</a> {charEmojis(item.player1Info.charInfo, item.bracketInfo.gameId, "play1_", filterInfo)}<span className='vsText'> vs </span><a href={item.player2Info.entrantUrl} target="_blank"  className={player2NameClass}>{item.player2Info.nameWithRomaji}</a> {charEmojis(item.player2Info.charInfo, item.bracketInfo.gameId, "play2_", filterInfo)}<br/>
      </div>
      <div className="rowPreviewHolder" >
      {
        preview
      } 
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
  var emojiClass = "charemoji"
  if (matchesFilter) {
    emojiClass = "charemojimatches"
  }
  return <img className={emojiClass} key={key} src={charEmojiImagePath(name, gameId)}/>
}
function schuEmojiImage(name, key = "") {
  return <img className="schuemoji" key={key} src={schuEmojiImagePath(name)}/>
}
