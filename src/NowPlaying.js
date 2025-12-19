import './NowPlaying.css';
import React, { useState, useEffect, memo, useRef, useCallback } from 'react';
import { MediaPreview } from "./VideoEmbeds.js"
import { charEmojiImagePath, schuEmojiImagePath, getLumitierIcon, getViewersTextFromItem, getStreamUrl, formatDisplayTimestamp, textMatches, getChannelName, getTourneySlug, getPlayerLink, getGameUrlStr, getCharLink, getTourneyLink, getChannelLink } from './Utilities.js'
import { RewindAndLiveButtons } from './RewindSetButton.js'
import { IconStartGg, IconStream } from './BrandIcons.js'
import { renderFilterButton } from './FilterButton.js'
import { Link } from 'react-router-dom';
import { BracketIcon } from './SubEmbedControls.js'

export const NowPlaying = memo(({isHeader, minimal, extraOnSide, showExtra=true,setShowBracket, setShowFilterModal, item, filterInfo, useVideoInList, handleIndexChange, streamSubIndex=0, setStreamSubIndex, selected, mainVideoDim, useLiveStream, setUseLiveStream, showVodsMode, handleTimestampChange, handlePlayPause, rewindReady}) => {
  const extraInCol = !extraOnSide
  const useBackgroundImage = false
  var preview = null
  var divClass = "nowPlaying-set-row-1"
  if (selected) divClass = divClass + " nowPlaying-set-row-1-selected"
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
    streamButton = <div className="nowPlaying-streamButton" style={{backgroundColor: extraInCol ? "var(--bg-controls)" : "var(--bg-main)"}} onClick={() => handleStreamIndexButtonClick(numSubStreams)}><span>switch stream</span></div>
  }
  var tourneyBackgroundUrl=null
  var tourneyBackgroundUrl2=null
  var tourneyIconUrl = null
  try {
    if (item.bracketInfo.endTimeDetected == null && item.streamInfo.streamSource != "YOUTUBE") {
      const thumbWidth = 440;
      const thumbHeight = 248;//Math.trunc(thumbWidth*9/16)
      tourneyBackgroundUrl = `https://static-cdn.jtvnw.net/previews-ttv/live_user_${item.streamInfo.forTheatre.toLowerCase().normalize()}-${thumbWidth}x${thumbHeight}.jpg`
    } else {
      tourneyBackgroundUrl = item.bracketInfo.images[1]?.url
    }
    tourneyBackgroundUrl2 = item.bracketInfo.images[1]?.url
    tourneyIconUrl = item.bracketInfo.images[0].url
  }catch{}
  var viewersText=""
  viewersText = getViewersTextFromItem(item)
  var updateIndexAndSetLive = (newLive) => {
    handleIndexChange(item.bracketInfo.setKey)
    setUseLiveStream(newLive)
  }
  if (item.matchesFilter) {
    divClass = `${divClass} nowPlaying-set-row-matches`
  }

  const textGlowClass="nowPlaying-textGlow"
  var tourneyTitleClass = "nowPlaying-tourneyTitle"
  if (textMatches(filterInfo, item.bracketInfo.tourneyName)) {
    tourneyTitleClass = `${tourneyTitleClass} ${textGlowClass}`
  }
  var player1NameClass = "nowPlaying-playerName"
  if (textMatches(filterInfo, item.player1Info.nameWithRomaji)) {
    player1NameClass = `${player1NameClass} ${textGlowClass}`
  }
  var player2NameClass = "nowPlaying-playerName"
  if (textMatches(filterInfo, item.player2Info.nameWithRomaji)) {
    player2NameClass = `${player2NameClass} ${textGlowClass}`
  }
  const startedAtText = formatDisplayTimestamp(item.bracketInfo.startedAt)
  const score = item.bracketInfo.score
  const hasScore = score && score.length == 2 && score[0] != null && score[1] != null
  const score1Class = score && score[0] > score[1] ? "nowPlaying-scoreText-green" : "nowPlaying-scoreText-normal"
  var score2Class = score && score[1] > score[0] ? "nowPlaying-scoreText-green nowPlaying-scoreLast" : "nowPlaying-scoreText-normal nowPlaying-scoreLast"
  var timestampText = `${startedAtText}`
  var liveTextSpan = null
  if (item.bracketInfo.endTimeDetected == null) {
    const liveText = ' LIVE'
    liveTextSpan = <span className='nowPlaying-live-text'>{liveText}</span>
  }
  const iconSize = "16px"; //youtube" 20px height
  const iconPaddingVert = "16px";
  const iconPaddingHorz = "8px";
  const iconStyle = {paddingLeft: iconPaddingHorz, paddingRigth: iconPaddingHorz, paddingTop: iconPaddingVert, paddingBottom: iconPaddingVert}
  const opacityStr = selected ? "0.7" : "0.15"
  const streamName = getChannelName(item.streamInfo)
  // const player1Link = item.player1Info.entrantUrl;
  // const player2Link = item.player2Info.entrantUrl;
  // const player1LinkContainer = <a href={player1Link} target="_blank" className={player1NameClass}>{item.player1Info.nameWithRomaji}</a>
  // const player2LinkContainer = <a href={player2Link} target="_blank" className={player2NameClass}>{item.player2Info.nameWithRomaji}</a>
  //<a href={player1Link} target="_blank" className={player1NameClass}>
  const player1Link = getPlayerLink(item.player1Info.userSlug, item.bracketInfo.gameId)
  const player2Link = getPlayerLink(item.player2Info.userSlug, item.bracketInfo.gameId)
  const player1LinkElem = <Link to={player1Link} className={player1NameClass}>{item.player1Info.nameWithRomaji}</Link>
  const player2LinkElem = <Link to={player2Link} className={player2NameClass}>{item.player2Info.nameWithRomaji}</Link>
  const tourneyLink = getTourneyLink(getTourneySlug(item.bracketInfo), item.bracketInfo.gameId)
  const channelLink = getChannelLink(streamName, item.bracketInfo.gameId)
  const streamIcon = item.streamInfo.streamIcon
  //          <a href={item.player1Info.entrantUrl} target="_blank" className={player1NameClass}>{item.player1Info.nameWithRomaji}</a> {charEmojis(item.player1Info.charInfo, item.bracketInfo.gameId, "play1_", filterInfo)}<span className='nowPlaying-vsText'> vs </span><a href={item.player2Info.entrantUrl} target="_blank"  className={player2NameClass}>{item.player2Info.nameWithRomaji}</a> {charEmojis(item.player2Info.charInfo, item.bracketInfo.gameId, "play2_", filterInfo)}

  const backgroundImageStyle = (showExtra && extraInCol && useBackgroundImage) ? {
          backgroundImage: `linear-gradient(rgba(0, 0, 0, ${opacityStr}),  rgba(0, 0, 0, ${opacityStr})), url(${tourneyBackgroundUrl2})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          // filter: "blur(8px)",
          // backgroundImage: "url(https://images.start.gg/images/tournament/801629/image-2c4b8e6351f06631091df62adc53b133.jpg)",
        } : {}
  if (minimal) {
    return (
      <div className="nowPlayingRow">
      <div className="nowPlaying-under-row">
        <div className="nowPlaying-under-info">
          <div className="nowPlaying-set-row-4">
            <div className={player1NameClass}>{item.player1Info.nameWithRomaji}</div><span className='nowPlaying-vsText'> vs </span><div className={player2NameClass}>{item.player2Info.nameWithRomaji}</div>
          </div>
          {/* {RewindAndLiveButtons({item, useLiveStream, setUseLiveStream, showVodsMode, shouldShow: selected, handleTimestampChange, handlePlayPause, rewindReady})} */}
        </div>
      </div>
      </div>   
    ) 
  }
  
  const charArr1 = item.player1Info.charInfo?.map((item, index) => item.name)
  const charString1WithParen = charArr1 != null && charArr1.length > 0 ? ` (${charArr1.join(", ")})` : ""
  const charArr2 = item.player2Info.charInfo?.map((item, index) => item.name)
  const charString2WithParen = charArr2 != null && charArr2.length > 0 ? ` (${charArr2.join(", ")})` : ""
  const headerContents = <>{player1LinkElem} {charEmojis(item.player1Info.charInfo, item.bracketInfo.gameId, "play1_", filterInfo)}<span className='nowPlaying-vsText'> vs </span>{player2LinkElem} {charEmojis(item.player2Info.charInfo, item.bracketInfo.gameId, "play2_", filterInfo)}</>
  const ariaText = `${item.player1Info.nameWithRomaji}${charString1WithParen} vs ${item.player2Info.nameWithRomaji}${charString2WithParen}`
  return (
    <div className="nowPlayingRow" style={backgroundImageStyle}>
    <div className="nowPlaying-under-row" style={extraInCol ? {paddingBottom: "0px"} : {}}>
      <div className="nowPlaying-under-info" style={extraInCol ? {paddingBottom: "0px"} : {}}>
        {isHeader ? <h1 className="nowPlaying-set-row-4" aria-label={ariaText}>
          {headerContents}
        </h1> : <div className="nowPlaying-set-row-4" aria-label={ariaText}>
          {headerContents}
        </div>
        }
        {RewindAndLiveButtons({item, useLiveStream, setUseLiveStream, showVodsMode, shouldShow: selected, handleTimestampChange, handlePlayPause, rewindReady})}
        <div className="nowPlaying-other-under-row">
          <Link className="nowPlaying-under-icon-link" to={channelLink} aria-label={`channel ${streamName}`}>{streamIcon && streamIcon.length > 0 && <img className="nowPlaying-under-icon" src={streamIcon}/>}</Link>
          <div className="nowPlaying-other-under-info">
            <div>
              <Link className="" to={tourneyLink} style={{textDecoration: "none"}}><span className="nowPlaying-title-margin">{getLumitierIcon(item.bracketInfo.lumitier, {marginRight:'5px', paddingBottom: '1px', paddingTop: '1px', border: '2px solid #000', color: 'black', fontSize: 'large'})}<span className={tourneyTitleClass}>{item.bracketInfo.tourneyName}</span></span></Link>
            </div>
            <span style={{marginTop: "2px"}}>
              <Link className="" to={channelLink} style={{textDecoration: "none"}}><span className="nowPlaying-streamNameText">{streamName}</span></Link>
              <span className="nowPlaying-roundText"> - {item.bracketInfo.fullRoundText}</span>
            </span>
          </div>
          {/* {renderFilterButton(filterInfo, () => setShowFilterModal({type: "char", gameId: currentGameId}))} */}
        </div>
        { showExtra && extraInCol &&
            <div className="nowPlaying-segment2-row1">
              <span className="nowPlaying-segment2-viewersText">{viewersText}👤 {item.bracketInfo.numEntrants}{"  "}</span>
              <div className="nowPlaying-segment2-tourney-timestamp"><span className='nowPlaying-t1-stamp'>{timestampText}</span>{liveTextSpan}</div>
              <span className="nowPlaying-segment2-locationText">{item.bracketInfo.locationStrWithRomaji}</span>
            </div>
          
        }
        { showExtra && extraInCol && streamButton}
        { showExtra && extraInCol &&
          <div className="nowPlaying-set-row-2">
            <div className="nowPlaying-icons-row">
              <a href={item.bracketInfo.phaseGroupUrl} target="_blank" className="nowPlaying-bracketLink"><div className="nowPlaying-icons-row-icon"><IconStartGg width={18} height={18}/></div></a>
              {item.streamInfo.streamUrls.map((sItem, index) => {
                const streamUrl = getStreamUrl(item.streamInfo, index)
                const streamLink = getStreamUrl(item.streamInfo, index, useLiveStream == false || showVodsMode)
                return <div key={index}><a href={streamLink} target="_blank" className="nowPlaying-bracketLink"><div className="nowPlaying-icons-row-icon-stream"><IconStream streamSource={item.streamInfo.streamSource}/></div></a></div>
              })}
            </div>
          </div>
        }
        { showExtra && extraInCol && hasScore && <span className="nowPlaying-scoreText">
            <span className={score1Class}>{score[0]}</span>
            <span className={score2Class}>{score[1]}</span>
          </span>
        }        
      </div>
    </div>
    { showExtra && extraOnSide &&
      <div className="nowPlaying-segment2"  style={useBackgroundImage ? {
      backgroundImage: `linear-gradient(rgba(0, 0, 0, ${opacityStr}),  rgba(0, 0, 0, ${opacityStr})), url(${tourneyBackgroundUrl2})`,
      backgroundSize: "cover",
      backgroundPosition: "center"
      // backgroundImage: "url(https://images.start.gg/images/tournament/801629/image-2c4b8e6351f06631091df62adc53b133.jpg)",
    } : {}}>
        <div className="nowPlaying-segment2-row1">
          <span className="nowPlaying-segment2-viewersText">{viewersText}👤 {item.bracketInfo.numEntrants}{"  "}</span>
          <div className="nowPlaying-segment2-tourney-timestamp"><span className='nowPlaying-t1-stamp'>{timestampText}</span>{liveTextSpan}</div>
          <span className="nowPlaying-segment2-locationText">{item.bracketInfo.locationStrWithRomaji}</span>
        </div>
        {streamButton}
        <div className="nowPlaying-set-row-2-a">
          <div className="nowPlaying-icons-row">
            <a href={item.bracketInfo.phaseGroupUrl} target="_blank" className="nowPlaying-bracketLink"><div className="nowPlaying-icons-row-icon"><IconStartGg width={18} height={18}/></div></a>
            {item.streamInfo.streamUrls.map((sItem, index) => {
              const streamUrl = getStreamUrl(item.streamInfo, index)
              const streamLink = getStreamUrl(item.streamInfo, index, useLiveStream == false || showVodsMode)
              return <div key={index}><a href={streamLink} target="_blank" className="nowPlaying-bracketLink"><div className="nowPlaying-icons-row-icon-stream"><IconStream streamSource={item.streamInfo.streamSource}/></div></a></div>
            })}
          </div>
        </div>
        {
          // <div className="nowPlaying-bracketButton" onClick={() => setShowBracket(true)} aria-label="Show bracket" title="Show bracket">
          //   <BracketIcon width={"42px"} height={"42px"} color={"var(--text-main-color-subdue-3"}/>
          // </div>
        }
        {hasScore && <span className="nowPlaying-scoreText">
          <span className={score1Class}>{score[0]}</span>
          <span className={score2Class}>{score[1]}</span>
        </span>}

      </div>
    }
    </div>
  )

  return (
    <div className="nowPlayingRow">
    <div className="nowPlaying-under-1">
      {RewindAndLiveButtons({item, useLiveStream, setUseLiveStream, showVodsMode, shouldShow: selected, handleTimestampChange, rewindReady})}
      <span>
        <span className="nowPlaying-title-margin">{getLumitierIcon(item.bracketInfo.lumitier, {marginRight:'5px', paddingBottom: '1px', paddingTop: '1px', border: '2px solid #000', color: 'black', fontSize: 'large'})}<span className={tourneyTitleClass}>{item.bracketInfo.tourneyName}</span></span>
      </span>
      <div className="nowPlaying-set-row-4">
        <a href={item.player1Info.entrantUrl} target="_blank" className={player1NameClass}>{item.player1Info.nameWithRomaji}</a> {charEmojis(item.player1Info.charInfo, item.bracketInfo.gameId, "play1_", filterInfo)}<span className='nowPlaying-vsText'> vs </span><a href={item.player2Info.entrantUrl} target="_blank"  className={player2NameClass}>{item.player2Info.nameWithRomaji}</a> {charEmojis(item.player2Info.charInfo, item.bracketInfo.gameId, "play2_", filterInfo)}
      </div>
      <span style={{marginTop: "2px"}}>
        <span className="nowPlaying-streamNameText">{streamName}</span>
        <span className="nowPlaying-roundText"> - {item.bracketInfo.fullRoundText}</span>
      </span>
    </div>
    {renderFilterButton(filterInfo, () => setShowFilterModal(null))}
    </div>
  )


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
        <div className="nowPlaying-tourney-icon" style={{backgroundImage: `url(${tourneyIconUrl})`, backgroundSize: "cover", backgroundPosition: "center",}} />
        <div className="nowPlaying-tourney-timestamp"><span className='nowPlaying-t1-stamp'>{timestampText}</span>{liveTextSpan}</div>
        <div className="nowPlaying-set-row-2">
        {selected && RewindAndLiveButtons({item, useLiveStream, setUseLiveStream, showVodsMode, shouldShow: selected, handleTimestampChange, rewindReady})}
        {streamButton}
        {selected && <div className="nowPlaying-set-row-2">
          <div className="nowPlaying-icons-row">
            <a href={item.bracketInfo.phaseGroupUrl} target="_blank" className="nowPlaying-bracketLink"><div className="nowPlaying-icons-row-icon"><IconStartGg width={18} height={18}/></div></a><br/>
            {item.streamInfo.streamUrls.map((sItem, index) => {
              const streamUrl = getStreamUrl(item.streamInfo, index)
              const streamLink = getStreamUrl(item.streamInfo, index, useLiveStream == false || showVodsMode)
              return <div key={index}><a href={streamLink} target="_blank" className="nowPlaying-bracketLink"><div className="nowPlaying-icons-row-icon-stream"><IconStream streamSource={item.streamInfo.streamSource}/></div></a><br/></div>
            })}
          </div>
        </div> }
        </div>
        <span className="nowPlaying-viewersText">{viewersText}👤 {item.bracketInfo.numEntrants}{"  "}</span>
        <span className="nowPlaying-locationText">{item.bracketInfo.locationStrWithRomaji}</span><br/>
        <div className="nowPlaying-rowPreviewHolder" >
        {
          preview
        } 
        </div>
      </div>
      <div className="nowPlaying-under-1">
        <span>
          <span className="nowPlaying-title-margin">{getLumitierIcon(item.bracketInfo.lumitier, {marginRight:'5px', paddingBottom: '1px', paddingTop: '1px', border: '2px solid #000', color: 'black', fontSize: 'large'})}<span className={tourneyTitleClass}>{item.bracketInfo.tourneyName}</span></span>
        </span>
        <div className="nowPlaying-set-row-4">
          <a href={item.player1Info.entrantUrl} target="_blank" className={player1NameClass}>{item.player1Info.nameWithRomaji}</a> {charEmojis(item.player1Info.charInfo, item.bracketInfo.gameId, "play1_", filterInfo)}<span className='nowPlaying-vsText'> vs </span><a href={item.player2Info.entrantUrl} target="_blank"  className={player2NameClass}>{item.player2Info.nameWithRomaji}</a> {charEmojis(item.player2Info.charInfo, item.bracketInfo.gameId, "play2_", filterInfo)}
        </div>
        <span style={{marginTop: "2px"}}>
          <span className="nowPlaying-streamNameText">{streamName}</span>
          <span className="nowPlaying-roundText"> - {item.bracketInfo.fullRoundText}</span>
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
  const charLink = getCharLink(name, gameId)
  var matchesFilter = false;
  filterInfo?.filters[gameId]?.characters?.forEach(charName => {
    if (charName == name) {
      matchesFilter = true
    }
  })
  var emojiClass = "nowPlaying-charemoji"
  if (matchesFilter) {
    emojiClass = "nowPlaying-charemojimatches"
  }
  return <Link className="nowPlaying-charemojiHolder" key={key} to={charLink}><img alt={name} className={emojiClass} key={key} src={charEmojiImagePath(name, gameId)}/></Link>
}
function schuEmojiImage(name, key = "") {
  return <img className="nowPlaying-schuemoji" key={key} src={schuEmojiImagePath(name)}/>
}
