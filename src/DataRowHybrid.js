import './DataRowHybrid.css';
import React, { useState, useEffect, memo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MediaPreview } from "./VideoEmbeds.js"
import { charEmojiImagePath, schuEmojiImagePath, getLumitierIcon, getViewersTextFromItem, getStreamUrl, formatDisplayTimestamp, textMatches, tourneyMatches, getChannelName, getTourneySlug, getPlayerLink, getGameUrlStr, getCharLink, getTourneyLink, getChannelLink, getItemLink, renderPlaylistIcon} from './Utilities.js'
import { RewindAndLiveButtons } from './RewindSetButton.js'
import { IconStartGg, IconStream } from './BrandIcons.js'

export const DataRowHybrid = memo(({showItemMatches=true, catInfo, item, tourneySets, filterInfo, useVideoInList, handleIndexChange, streamSubIndex=0, setStreamSubIndex, selected, mainVideoDim, useLiveStream, setUseLiveStream, showVodsMode, handleTimestampChange, rewindReady}) => {
  var preview = null
  var divClass = "drh-set-row-1"
  if (selected) divClass = divClass + " drh-set-row-1-selected"
  var onClick = (e) => {
    const selection = window.getSelection();
    if (selection.toString().length > 0) {
      return; // Exit the function to prevent further click handling
    }
    handleIndexChange(item.bracketInfo.setKey, catInfo)
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
    tourneyBackgroundUrl = item.bracketInfo.images[1]?.url
    if (item.bracketInfo.endTimeDetected == null) {
      if (item.streamInfo.streamSource == "TWITCH") {
        const thumbWidth = 440;
        const thumbHeight = 248;//Math.trunc(thumbWidth*9/16)
        tourneyBackgroundUrl = `https://static-cdn.jtvnw.net/previews-ttv/live_user_${item.streamInfo.forTheatre.toLowerCase().normalize()}-${thumbWidth}x${thumbHeight}.jpg`
      } else if (item.streamInfo.streamSource == "YOUTUBE") {
        // preview image is just a thumbnail
        // const videoId = item.streamInfo.streamUrls[0].videoId
        // tourneyBackgroundUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
        //tourneyBackgroundUrl = `https://static-cdn.jtvnw.net/previews-ttv/live_user_${item.streamInfo.forTheatre.toLowerCase().normalize()}-${thumbWidth}x${thumbHeight}.jpg`
      }
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
  if (false && tourneyMatches(filterInfo, item)) {
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
  const score = item.bracketInfo.score
  const hasScore = score && score.length == 2 && score[0] != null && score[1] != null
  const score1Class = score && score[0] > score[1] ? "drh-scoreText-green" : "drh-scoreText-normal"
  var score2Class = score && score[1] > score[0] ? "drh-scoreText-green drh-scoreLast" : "drh-scoreText-normal drh-scoreLast"
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
  // const opacityStr = selected ? "0.7" : "0.15"
  const opacityStr = selected ? "0.15" : "0.15"
  const streamName = getChannelName(item.streamInfo)
  // const player1Link = item.player1Info.entrantUrl;
  // const player2Link = item.player2Info.entrantUrl;
  // const player1LinkContainer = <link href={player1Link} target="_blank" className={player1NameClass}>{item.player1Info.nameWithRomaji}</link>
  //<a href={player1Link} target="_blank" className={player1NameClass}>
  const player1Link = getPlayerLink(item.player1Info.userSlug, item.bracketInfo.gameId)
  const player2Link = getPlayerLink(item.player2Info.userSlug, item.bracketInfo.gameId)
  const player1LinkElem = <Link to={player1Link} className={player1NameClass}>{item.player1Info.nameWithRomaji}</Link>
  const player2LinkElem = <Link to={player2Link} className={player2NameClass}>{item.player2Info.nameWithRomaji}</Link>
  const tourneySlug = getTourneySlug(item.bracketInfo)
  const tourneyLink = getTourneyLink(tourneySlug, item.bracketInfo.gameId)
  const channelLink = getChannelLink(streamName, item.bracketInfo.gameId)
  const streamIcon = item.streamInfo.streamIcon
  const numSets = tourneySets && tourneySets.length
  const showNumSets = numSets && numSets > 0
  // console.log("streamIcon", item.streamInfo)

  // searchParams.set("set", page);
  // const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
  const itemLink = getItemLink({searchTerm: catInfo, gameId:item.bracketInfo.gameId, setKey: item.bracketInfo.setKey, tourneySlug: showNumSets? tourneySlug : null})
  const linkElemProps = {
    className: divClass,
    to: itemLink,
    style: {
      backgroundImage: `linear-gradient(rgba(0, 0, 0, ${opacityStr}),  rgba(0, 0, 0, ${opacityStr})), url(${tourneyBackgroundUrl})`,
      backgroundSize: "cover",
      backgroundPosition: "center"
      // backgroundImage: "url(https://images.start.gg/images/tournament/801629/image-2c4b8e6351f06631091df62adc53b133.jpg)",
    }
  }
  const contentInside = <><div className="drh-tourney-icon" style={{backgroundImage: `url(${tourneyIconUrl})`, backgroundSize: "cover", backgroundPosition: "center",}} />
      <div className="drh-tourney-timestamp"><span className='drh-t1-stamp'>{timestampText}</span>{liveTextSpan}</div>
      {
        // showNumSets && <div className="drh-tourney-timestamp"><span className='drh-t1-stamp'>{numSets}</span>{liveTextSpan}</div>
        showNumSets && <span className="drh-playlistText">{renderPlaylistIcon({})}<span style={{marginLeft: "4px"}}>{numSets}</span></span>
      }
      <div className="drh-set-row-2">
      {
        // selected && RewindAndLiveButtons({item, useLiveStream, setUseLiveStream, showVodsMode, shouldShow: selected, handleTimestampChange, rewindReady})
      }
      {/* {streamButton}
      {selected && <div className="drh-set-row-2">
        <div className="drh-icons-row">
          <a href={item.bracketInfo.phaseGroupUrl} target="_blank" className="drh-bracketLink"><div className="drh-icons-row-icon"><IconStartGg width={18} height={18}/></div></a><br/>
          {item.streamInfo.streamUrls.map((sItem, index) => {
            const streamUrl = getStreamUrl(item.streamInfo, index)
            const streamLink = getStreamUrl(item.streamInfo, index, useLiveStream == false || showVodsMode)
            return <div key={index}><a href={streamLink} target="_blank" className="drh-bracketLink"><div className="drh-icons-row-icon-stream"><IconStream streamSource={item.streamInfo.streamSource}/></div></a><br/></div>
          })}
        </div>
      </div> } */}
      </div>
      <span className="drh-viewersText">{viewersText}👤 {item.bracketInfo.numEntrants}{"  "}
      <span className="drh-locationText-2">{item.bracketInfo.locationStrWithRomaji}</span></span>
      {hasScore && <span className="drh-scoreText">
        <span className={score1Class}>{score[0]}</span>
        <span className={score2Class}>{score[1]}</span>
      </span>}
      <br/>
      <div className="drh-rowPreviewHolder" >
      {
        preview
      } 
      </div>
    </>
  
  const linkElem = selected ? <div {...linkElemProps}>{contentInside}</div> : <Link {...linkElemProps}>{contentInside}</Link>


  return (
    <div className="drw-outer">
      {linkElem}
      <div className="drh-under-1">
        <div className="drh-set-row-4">
          {player1LinkElem} {charEmojis(item.player1Info.charInfo, item.bracketInfo.gameId, "play1_", filterInfo)}<span className='drh-vsText'> vs </span>{player2LinkElem} {charEmojis(item.player2Info.charInfo, item.bracketInfo.gameId, "play2_", filterInfo)}
        </div>
        <div className="drh-under-row-2">
          <Link className="drh-under-icon-link" to={channelLink}>{streamIcon && streamIcon.length > 0 && <img className="drh-under-icon" src={streamIcon}/>}</Link>
          <div className="drh-under-info">
            <span>
              <Link className="" to={tourneyLink} style={{textDecoration: "none"}}><span className="drh-title-margin">{getLumitierIcon(item.bracketInfo.lumitier, {marginRight:'5px', paddingBottom: '1px', paddingTop: '1px', border: '2px solid #000', color: 'black', fontSize: 'large'})}<span className={tourneyTitleClass}>{item.bracketInfo.tourneyName}</span></span></Link>
            </span>
            <span style={{marginTop: "2px",   textDecoration: "none"}}>
              <Link className="" to={channelLink} style={{textDecoration: "none"}}><span className="drh-streamNameText">{streamName}</span></Link>
              <span className="drh-roundText"> - {item.bracketInfo.fullRoundText}</span>
            </span>
          </div>
        </div>
      </div>

      {/* <div className="drh-under-row">
        {streamIcon && streamIcon.length > 0 && <img className="drh-under-icon" src={streamIcon}/>}
        <div className="drh-under-info">
          <span>
            <Link className="" to={tourneyLink}><span className="drh-title-margin">{getLumitierIcon(item.bracketInfo.lumitier, {marginRight:'5px', paddingBottom: '1px', paddingTop: '1px', border: '2px solid #000', color: 'black', fontSize: 'large'})}<span className={tourneyTitleClass}>{item.bracketInfo.tourneyName}</span></span></Link>
          </span>
          <div className="drh-set-row-4">
            {player1LinkElem} {charEmojis(item.player1Info.charInfo, item.bracketInfo.gameId, "play1_", filterInfo)}<span className='drh-vsText'> vs </span>{player2LinkElem} {charEmojis(item.player2Info.charInfo, item.bracketInfo.gameId, "play2_", filterInfo)}
          </div>
          <span style={{marginTop: "2px"}}>
            <Link className="" to={channelLink}><span className="drh-streamNameText">{streamName}</span></Link>
            <span className="drh-roundText"> - {item.bracketInfo.fullRoundText}</span>
          </span>
        </div>
      </div> */}
    </div>
  );
})

      // <div className="drh-under-1">
      //   <span>
      //     <Link className="" to={tourneyLink}><span className="drh-title-margin">{getLumitierIcon(item.bracketInfo.lumitier, {marginRight:'5px', paddingBottom: '1px', paddingTop: '1px', border: '2px solid #000', color: 'black', fontSize: 'large'})}<span className={tourneyTitleClass}>{item.bracketInfo.tourneyName}</span></span></Link>
      //   </span>
      //   <div className="drh-set-row-4">
      //     {player1LinkElem} {charEmojis(item.player1Info.charInfo, item.bracketInfo.gameId, "play1_", filterInfo)}<span className='drh-vsText'> vs </span>{player2LinkElem} {charEmojis(item.player2Info.charInfo, item.bracketInfo.gameId, "play2_", filterInfo)}
      //   </div>
      //   <span style={{marginTop: "2px"}}>
      //     <Link className="" to={channelLink}><span className="drh-streamNameText">{streamName}</span></Link>
      //     <span className="drh-roundText"> - {item.bracketInfo.fullRoundText}</span>
      //   </span>
      // </div>

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
  filterInfo?.filters[gameId]?.searches?.forEach(search => {
  // filterInfo?.filters[gameId]?.characters?.forEach(charName => {
    if (search.charName == name) {
      matchesFilter = true
    }
  })
  var emojiClass = "drh-charemoji"
  if (matchesFilter) {
    emojiClass = "drh-charemojimatches"
  }
  // return <img className={emojiClass} key={key} src={charEmojiImagePath(name, gameId)}/>
  return <Link key={key} to={charLink}><img className={emojiClass} src={charEmojiImagePath(name, gameId)}/></Link>
}
function schuEmojiImage(name, key = "") {
  return <img className="drh-schuemoji" key={key} src={schuEmojiImagePath(name)}/>
}
