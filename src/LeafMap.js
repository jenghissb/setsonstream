import React, { useRef, useState, useEffect, memo } from "react";
import { Link } from 'react-router-dom';
import './LeafMap.css';
import L from 'leaflet';

import { MapContainer, TileLayer, Marker, Popup, useMapEvents, AttributionControl } from "react-leaflet";
import { divIcon , DivIcon} from 'leaflet';
import "leaflet/dist/leaflet.css";
import { getStartggUserLink, getCharUrl, charEmojiImagePath, schuEmojiImagePath, getLumitierIcon, getLumitierIconStr, getViewersTextFromItem, getStreamUrl } from './Utilities'
import { MediaPreview } from './VideoEmbeds'
import { spreadPoints } from './SpaceLatLon'
import { TimeRangeSlider } from './TimeRangeSlider'
import { getDefaultTimeRange } from './GameInfo'
import { FilterType, renderFilterTypeButton } from './FilterTypeButton'

function renderMinMaxSvg(useFullView) {
  if (useFullView) {
    return <Link className="leafMinMaxSvg" to="/" style={{bottom: "128px", right: "34px"}}>{renderMinimizeSvg()}</Link>
  } else {
    return <Link className="leafMinMaxSvg" to="/fullmap">{renderFullscreenSvg()}</Link>
  }
}

function renderFullscreenSvg() {
  //style={{ width: '100%', height: '100%' }} 
  return <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style={{ filter: 'drop-shadow(0px 0px 3px rgba(0, 0, 0, 0.5))' }}><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
}

function renderMinimizeSvg() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style={{ filter: 'drop-shadow(3px 3px 5px rgba(0, 0, 0, 0.5))' }}><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path></svg>
}

function MapEventHelper({setZoomLevel}) {
  const MapEvents = useMapEvents({
      zoomend: (e) => {
        setZoomLevel(e.target.getZoom());
      },
    });
  return null
}

function getSpreadMetersPerZoom(zoomLevel) {
  var spreadMeters = 1000000
  if (zoomLevel < 1) {
    spreadMeters = 800000
  } else if (zoomLevel < 2) {
    spreadMeters = 300000
  } else if (zoomLevel < 3) {
    spreadMeters = 120000
  } else if (zoomLevel < 4) {
    spreadMeters = 80000
  } else if (zoomLevel < 5) {
    spreadMeters = 40000
  } else if (zoomLevel < 6) {
    spreadMeters = 16000
  } else if (zoomLevel < 7) {
    spreadMeters = 12000
  } else if (zoomLevel < 8) {
    spreadMeters = 10000
  } else if (zoomLevel < 9) {
    spreadMeters = 8000
  } else if (zoomLevel < 10) {
    spreadMeters = 6000
  } else if (zoomLevel < 11) {
    spreadMeters = 5000
  } else if (zoomLevel < 12) {
    spreadMeters = 3000
  } else if (zoomLevel < 13) {
    spreadMeters = 2000
  } else if (zoomLevel < 14) {
    spreadMeters = 1000
  } else if (zoomLevel < 15) {
    spreadMeters = 600
  } else if (zoomLevel < 16) {
    spreadMeters = 350
  } else if (zoomLevel < 17) {
    spreadMeters = 200
  } else if (zoomLevel < 18) {
    spreadMeters = 100
  } else if (zoomLevel < 19) {
    spreadMeters = 50
  } else {
    spreadMeters = 50
  }
  return spreadMeters
}

export const LeafMap = memo(({data, tourneyById, gameId, filterType, timeRange, topOffset, itemKey, useLiveStream, showVodsMode, handleIndexChange, useVideoInPopup, height=300, width=300, useFullView = false, streamSubIndex, setStreamSubIndex, vidWidth, vidHeight, onTimeRangeChanged}) => {  
  var initialZoomLevel = 2
  if (width < 700) {
    initialZoomLevel = 0
  }
  if (useFullView) {
    initialZoomLevel += 1
  }
  const tourneyIds = Object.keys(tourneyById)
  const tourneys = tourneyIds.map(id => tourneyById[id])
  const showTourneysMode = showVodsMode
  const [zoomLevel, setZoomLevel] = useState(initialZoomLevel);

  const handleStreamIndexButtonClick = (numSubStreams) => {
    setStreamSubIndex((streamSubIndex + 1) % numSubStreams);
  };

  const mapRefReg = useRef(null);
  const mapRefBig = useRef(null);
  var mapRef = mapRefReg
  var mapKey = "Reg"
  if (useFullView) {
    mapRef = mapRefBig
    mapKey = "Big"
  }

  // const latitude = 51.505;
  const latitude = 31.505;
  const longitude = -0.09;

  const videoScale = 0.97
  const videoDim = {
    height: vidHeight * videoScale,
    width: vidWidth * videoScale
  }

  const videoWidth = videoDim.width;
  const videoHeight = videoDim.height;
  var mapContainerWidth = "100%"
  var mapContainerHeight = "100%"
  var marginBottom = "0px"
  if (useFullView) {
    // var height="calc(100dvh - 56px)";
    var height=`calc(100dvh - ${topOffset})`;
    // var height=`calc(100dvh - 120px)`;
    // var height="calc(100dvh - 60px)"
    mapContainerHeight = height
    var width="100vw";
    var marginBottom = "-64px" // needed in full mode because of footer making page taller
  }

  var inputLatLon = []
  var markerData = []
  if (showTourneysMode) {
    inputLatLon = tourneyIds.map(tourneyId => {
      return {
        lat: tourneyById[tourneyId][0].bracketInfo.lat,
        lon: tourneyById[tourneyId][0].bracketInfo.lon
      }
    })
    markerData = tourneys
  } else {
    inputLatLon = data.map(item => ({lat: item.bracketInfo.lat, lon: item.bracketInfo.lon}))
    markerData = data
  }
  var spreadMeters = getSpreadMetersPerZoom(zoomLevel)
  var latLons = spreadPoints(inputLatLon, spreadMeters)
  // attributionControl={"top-right"}
  //addAttribution
  // var A = AttributionControl()
  
  // var A =         <AttributionControl position={"topright"} />
  // A.addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" >OpenStreetMap</a>') //addAttribution
  return (
    <div style={{backgroundColor: 'blue', justifyContent: "center", height: height, width: width, justifyContent: "center", alignSelf: "center",        display:"flex",
    flexDirection: "column",
    alignItems: "center",
    alignContent: "center",
    position: "relative",
    zIndex: 20000,
    marginBottom,
  }}>
    {showVodsMode && <TimeRangeSlider key={`${gameId}_slider}`}{...{height: height, width: width, onChange: onTimeRangeChanged, gameId, initialTimeRange: timeRange}}/>}
    {false && renderFilterTypeButton()}
    {renderMinMaxSvg(useFullView)}
    <div className="attirbutionContainer">
      <div className="attribution2">
        <a className="attributionLink" href="https://leafletjs.com" target="_blank" title="A JavaScript library for interactive maps">
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="12" height="8" viewBox="0 0 12 8" class="attributionFlag">
            <path fill="#4C7BE1" d="M0 0h12v4H0z"></path><path fill="#FFD500" d="M0 4h12v3H0z"></path><path fill="#E0BC00" d="M0 7h12v1H0z"></path>
          </svg> Leaflet</a> <span aria-hidden="true">|</span> © <a className="attributionLink" href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>
      </div>
    </div>

    <MapContainer key={mapKey} center={[latitude, longitude]} zoom={initialZoomLevel} ref={mapRef} style={{height: "100%", width: "100%", justifyContent: "center"}} attributionControl={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" >OpenStreetMap</a>'
        
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      >
        <AttributionControl position="bottomright" prefix=""/>
        
      </TileLayer>
      {
        <MapEventHelper setZoomLevel={setZoomLevel} />
      }
      {
        markerData.map( (item, index) => {
          return <MarkersForItem {...{showTourneysMode, item, index, latLons, zoomLevel, handleIndexChange, itemKey, useLiveStream, showVodsMode, filterType, handleStreamIndexButtonClick, videoWidth, videoHeight, streamSubIndex, useVideoInPopup}}/>
        }) 
      }
    </MapContainer> 
    </div>
  );
})

const MarkersForItem = memo(({showTourneysMode, item, index, latLons, zoomLevel, handleIndexChange, itemKey, useLiveStream, showVodsMode, filterType, handleStreamIndexButtonClick, videoWidth, videoHeight, streamSubIndex, useVideoInPopup}) =>{
  // return <MarkersForSet {...{showTourneysMode, item: item[0], index, latLons, zoomLevel, handleIndexChange, handleStreamIndexButtonClick, videoWidth, videoHeight, streamSubIndex, useVideoInPopup}}/>

  if (showTourneysMode) {
    return <MarkersForTourney {...{showTourneysMode, tourney: item, index, latLons, zoomLevel, handleIndexChange, itemKey, useLiveStream, showVodsMode, filterType, handleStreamIndexButtonClick, videoWidth, videoHeight, streamSubIndex, useVideoInPopup}}/>
  } else {
    return <MarkersForSet {...{showTourneysMode, item, index, latLons, zoomLevel, handleIndexChange, itemKey, useLiveStream, showVodsMode, filterType, handleStreamIndexButtonClick, videoWidth, videoHeight, streamSubIndex, useVideoInPopup}}/>
  }
});


const MarkersForTourney = memo(({tourney, index, latLons, zoomLevel, handleIndexChange, itemKey, useLiveStream, showVodsMode, filterType, handleStreamIndexButtonClick, videoWidth, videoHeight, streamSubIndex, useVideoInPopup}) =>{
  var item = tourney[0]
  var iconUrl = getCharUrl(item.player1Info.charInfo, item.bracketInfo.gameId)
  var iconUrl2 = getCharUrl(item.player2Info.charInfo, item.bracketInfo.gameId)
  var onMarkerClick = () => handleIndexChange(item.bracketInfo.setKey)

  const [isPopupOpen1, setIsPopupOpen1] = useState(false);
  const [isPopupOpen2, setIsPopupOpen2] = useState(false);
  const [isPopupOpen3, setIsPopupOpen3] = useState(false);

  const handleOpenPopup1 = () => setIsPopupOpen1(true);
  const handleOpenPopup2 = () => setIsPopupOpen2(true);
  const handleOpenPopup3 = () => setIsPopupOpen3(true);

  const handleClosePopup1 = () => setIsPopupOpen1(false);
  const handleClosePopup2 = () => setIsPopupOpen2(false);
  const handleClosePopup3 = () => setIsPopupOpen3(false);


  var icon = new L.Icon({
    iconUrl: iconUrl,
    iconSize: [32, 32],
    iconAnchor: [30, 32],
    popupAnchor: [0, -32],
  })
  var icon2 = new L.Icon({
    iconUrl: iconUrl2,
    iconSize: [32, 32],
    iconAnchor: [2, 32],
    popupAnchor: [0, -32],
  })

  var icon3 = new L.DivIcon({
    iconSize: [3, 3],
    html: renderMarkerText(item, zoomLevel, filterType)
  })

  var lat = latLons[index].lat;
  var lon = latLons[index].lon;
  var marker1 = (
    <Marker key={index+"left"} position={[lat, lon]} eventHandlers={{click: onMarkerClick, popupopen: handleOpenPopup1, popupclose: handleClosePopup1}} icon={
      icon
    }>
      <Popup className="leafpopup"
        maxWidth={videoWidth}
        width={videoWidth}
      >
        {isPopupOpen1 && renderPopupForTourney(tourney, handleStreamIndexButtonClick, streamSubIndex, handleIndexChange, itemKey, useLiveStream, showVodsMode, useVideoInPopup, videoWidth, videoHeight, 1)}
      </Popup>
    </Marker>
  )
  var marker2 = (
    <Marker key={index+"right"} position={[lat, lon]} eventHandlers={{click: onMarkerClick, popupopen: handleOpenPopup2, popupclose: handleClosePopup2}} icon={
      icon2
    }>
      <Popup className="leafpopup"
        maxWidth={videoWidth}
        width={videoWidth}
      >
        {isPopupOpen2 &&renderPopupForTourney(tourney, handleStreamIndexButtonClick, streamSubIndex, handleIndexChange, itemKey, useLiveStream, showVodsMode, useVideoInPopup, videoWidth, videoHeight, 2)}
      </Popup>
    </Marker>
  )
  var marker3 = (
    <Marker key={index} position={[lat, lon]} eventHandlers={{click: onMarkerClick, popupopen: handleOpenPopup3, popupclose: handleClosePopup3}} icon={
      icon3
    }> 
      <Popup className="leafpopup"
        maxWidth={videoWidth}
        width={videoWidth}
      >
        {isPopupOpen3 && renderPopupForTourney(tourney, handleStreamIndexButtonClick, streamSubIndex, handleIndexChange, itemKey, useLiveStream, showVodsMode, useVideoInPopup, videoWidth, videoHeight, 3)}
      </Popup>
    </Marker>
  )
  return <div>
    {marker3}
    {marker1}
    {marker2}
  </div>

});

const MarkersForSet = memo(({item, index, latLons, zoomLevel, handleIndexChange, itemKey, useLiveStream, showVodsMode, filterType, handleStreamIndexButtonClick, videoWidth, videoHeight, streamSubIndex, useVideoInPopup}) =>{
  var iconUrl = getCharUrl(item.player1Info.charInfo, item.bracketInfo.gameId)
  var iconUrl2 = getCharUrl(item.player2Info.charInfo, item.bracketInfo.gameId)
  var onMarkerClick = () => handleIndexChange(item.bracketInfo.setKey)
  var icon = new L.Icon({
    iconUrl: iconUrl,
    iconSize: [32, 32],
    iconAnchor: [30, 32],
    popupAnchor: [0, -32],
  })
  var icon2 = new L.Icon({
    iconUrl: iconUrl2,
    iconSize: [32, 32],
    iconAnchor: [2, 32],
    popupAnchor: [0, -32],
  })

  var icon3 = new L.DivIcon({
    iconSize: [3, 3],
    html: renderMarkerText(item, zoomLevel, filterType)
  })

  var lat = latLons[index].lat;
  var lon = latLons[index].lon;
  var marker1 = (
    <Marker key={index+"left"} position={[lat, lon]} eventHandlers={{click: onMarkerClick}} icon={
      icon
    }>
      <Popup className="leafpopup"
        maxWidth={videoWidth}
        width={videoWidth}
      >
        {renderPopup(item, handleStreamIndexButtonClick, streamSubIndex, itemKey, useLiveStream, showVodsMode, useVideoInPopup, videoWidth, videoHeight, 1)}
      </Popup>
    </Marker>
  )
  var marker2 = (
    <Marker key={index+"right"} position={[lat, lon]} eventHandlers={{click: onMarkerClick}} icon={
      icon2
    }>
      <Popup className="leafpopup"
        maxWidth={videoWidth}
        width={videoWidth}
      >
        {renderPopup(item, handleStreamIndexButtonClick, streamSubIndex, itemKey, useLiveStream, showVodsMode, useVideoInPopup, videoWidth, videoHeight, 2)}
      </Popup>
    </Marker>
  )
  var marker3 = (
    <Marker key={index} position={[lat, lon]} eventHandlers={{click: onMarkerClick}} icon={
      icon3
    }>
      <Popup className="leafpopup"
        maxWidth={videoWidth}
        width={videoWidth}
      >
        {renderPopup(item, handleStreamIndexButtonClick, streamSubIndex, itemKey, useLiveStream, showVodsMode, useVideoInPopup, videoWidth, videoHeight, 3)}
      </Popup>
    </Marker>
  )
  return <div>
    {marker3}
    {marker1}
    {marker2}
  </div>

});

function renderPopupForTourney(tourney, handleStreamIndexButtonClick, streamSubIndex, handleIndexChange, itemKey, useLiveStream, showVodsMode, useVideoInPopup, videoWidth, videoHeight, markerIndex) {
  var item = tourney[0]
  var streamButton = null
  var numSubStreams = item.streamInfo.streamUrls.length
  if (numSubStreams > 1) {
    streamButton = <button onClick={() => handleStreamIndexButtonClick(numSubStreams)}><span>switch stream</span></button>
  }
  const targetId = `${item.bracketInfo.tourneyId}_${markerIndex}`
  // define these here handleReady, onProgress
  var preview = null
  if (useVideoInPopup == true) {
    item = tourney.find(it => it.bracketInfo.setKey == itemKey) ?? item
    //MediaPreview({item: previewItem, streamSubIndex, width:vidWidth, height:vidHeight, useLiveStream: useLiveStream && !showVodsMode, handleReady, onProgress})}</div>
    preview = MediaPreview({item, streamSubIndex, useLiveStream: useLiveStream && !showVodsMode, showVodsMode, width: videoWidth, height: videoHeight, targetId})
  }
  var tourneyBackgroundUrl=null
  var tourneyIconUrl = null
  try {
    tourneyBackgroundUrl = item.bracketInfo.images[1].url
    tourneyIconUrl = item.bracketInfo.images[0].url
  }catch{}
  // setSectionStyle = "leafset-set-row"
  var lumitier = item.bracketInfo.lumitier
  // var lumitier = "C+"
  // var lumitierIconStr = getLumitierIconStr(lumitier)
  //getLumitierIcon(lumitier)
  var viewersText = getViewersTextFromItem(item)
  return (
    <div className="leafset-row-1" style={{maxWidth: videoWidth}}> 
      <div className="leafVertConstraint" style={{}}>
        <div className="leafset-set-top-header" style={{
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.67),  rgba(255, 255, 255, 0.67)), url(${tourneyBackgroundUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
        }}>
          <div className="leafHeaderInside">
            <div className="leaf-tourney-icon" style={{backgroundImage: `url(${tourneyIconUrl})`, backgroundSize: "cover", backgroundPosition: "center",}}/>
            <div className="leafsetTourneyInfo">
              <span className="leaftourneyName">{getLumitierIcon(lumitier, {marginRight: '6px'})}{item.bracketInfo.tourneyName}</span><br/>
              <span className="leafEntrants" style={{ marginRight: '3px' }}>{viewersText}👤 {item.bracketInfo.numEntrants}{" "}</span><span className="leafplayerName">{item.bracketInfo.locationStrWithRomaji}</span><br/>
            </div>
          </div>
        </div>
        {tourney.map(item =>  {
          var setRowStyle = "leafset-set-row"
          if (item.bracketInfo.setKey == itemKey) {
            setRowStyle = "leafset-set-row-selected"
          }
          return <div className={setRowStyle} style={{
            background: `linear-gradient(rgba(255, 255, 255, 0.8),  rgba(255, 255, 255, 0.8)), url(${tourneyBackgroundUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center", 
            marginTop: "2px"
          }} onClick={() => handleIndexChange(item.bracketInfo.setKey)}> 
            <span className="leafplayerName">{item.bracketInfo.fullRoundText}</span><br/>
            <a href={item.bracketInfo.url} target="_blank" className="leafbracketLink">{item.bracketInfo.url}</a><br/>
            {item.streamInfo.streamUrls.map((sInfo, index) => {
              const streamUrl = getStreamUrl(item.streamInfo, index)
              return <div><a href={streamUrl} target="_blank" className="leafbracketLink">{streamUrl}</a><br/></div>
            })}
            <a href={item.player1Info.entrantUrl} target="_blank" className="leafplayerName">{item.player1Info.nameWithRomaji}</a> {charEmojis(item.player1Info.charInfo, item.bracketInfo.gameId, "leaf_play1_")} vs <a href={item.player2Info.entrantUrl} target="_blank" className="leafplayerName">{item.player2Info.nameWithRomaji}</a> {charEmojis(item.player2Info.charInfo, item.bracketInfo.gameId, "leaf_play2_")}<br/>
            </div>
          }
        )}
      </div>
      {streamButton}
      {
        preview
      }
    </div>
  );
}

function renderPopup(item, handleStreamIndexButtonClick, streamSubIndex, itemKey, useLiveStream, showVodsMode, useVideoInPopup, videoWidth, videoHeight, markerIndex) {
  var streamButton = null
  var numSubStreams = item.streamInfo.streamUrls.length
  if (numSubStreams > 1) {
    streamButton = <button onClick={() => handleStreamIndexButtonClick(numSubStreams)}><span>switch stream</span></button>
  }
  const targetId = `${item.bracketInfo.setKey}_${markerIndex}`
  var preview = null
  if (useVideoInPopup == true) {
    preview = MediaPreview({item, streamSubIndex, width: videoWidth, height: videoHeight, targetId})
  }
  var tourneyBackgroundUrl=null
  var tourneyIconUrl = null
  try {
    tourneyBackgroundUrl = item.bracketInfo.images[1].url
    tourneyIconUrl = item.bracketInfo.images[0].url
  }catch{}
  var infoSectionStyle = "leafset-row-sub-with-vid"
  if (preview == null) {
    infoSectionStyle = "leafset-row-sub"
  }
  var lumitier = item.bracketInfo.lumitier
  // var lumitier = "C+"
  // var lumitierIconStr = getLumitierIconStr(lumitier)
  //getLumitierIcon(lumitier)
  var viewersText = getViewersTextFromItem(item)
  return (
    <div className="leafset-row-1"> 
      <div className={infoSectionStyle} style={
      {
        background: `linear-gradient(rgba(255, 255, 255, 0.8),  rgba(255, 255, 255, 0.8)), url(${tourneyBackgroundUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center"
      }
    }>
        <span className="leaftourneyName">{getLumitierIcon(lumitier, {marginRight: '6px'})}{item.bracketInfo.tourneyName}</span><br/>
        <span className="leafEntrants" style={{ marginRight: '3px' }}>{viewersText}👤 {item.bracketInfo.numEntrants}{" "}</span><span className="leafplayerName">{item.bracketInfo.locationStrWithRomaji}</span><br/>
        <span className="leafplayerName">{item.bracketInfo.fullRoundText}</span><br/>
        <a href={item.bracketInfo.url} target="_blank" className="leafbracketLink">{item.bracketInfo.url}</a><br/>
        {item.streamInfo.streamUrls.map((sInfo, index) => {
          const streamUrl = getStreamUrl(item.streamInfo, index)
          return <div><a href={streamUrl} target="_blank" className="leafbracketLink">{streamUrl}</a><br/></div>
        })}
        <a href={item.player1Info.entrantUrl} target="_blank" className="leafplayerName">{item.player1Info.nameWithRomaji}</a> {charEmojis(item.player1Info.charInfo, item.bracketInfo.gameId, "leaf_play1_")} vs <a href={item.player2Info.entrantUrl} target="_blank" className="leafplayerName">{item.player2Info.nameWithRomaji}</a> {charEmojis(item.player2Info.charInfo, item.bracketInfo.gameId, "leaf_play2_")}<br/>
      </div>
      {streamButton}
      {
        preview
      }
    </div>
  );
}


function renderMarkerText(item, zoomLevel, filterType) {
  var lumitier = item.bracketInfo.lumitier
  // var lumitier = "C+"
  var lumitierIconStr = getLumitierIconStr(lumitier)
  // var shadowColor = "#F9D84999";
  var shadowColor = "#00ffff99";
  var shadowText1 = (item.matchesFilter && filterType == FilterType.HIGHLIGHT) ? "box-shadow: 12px 0px 40px 20px "+shadowColor+"; " : ""
  var shadowText2 = (item.matchesFilter && filterType == FilterType.HIGHLIGHT) ? "box-shadow: 0px -15px 40px 12px "+shadowColor+"; ": ""

  var txt = `<div style="color: black; line-height:1.2;margin-left: -150px; margin-top: -2px; font-size: 10px; font-weight: bold; width:300px; flex; align-items: center; justify-content: center; position: relative;">
    <div style="z-index: 1; margin-bottom: -2px; position: relative; ">
      <span style="font-size: 16px;font-weight: bolder; background: #fff; padding-top:1px; padding-left:2px; padding-right:2px; border-top-left-radius:4px; border-top-right-radius:4px; border: 1px solid gray; border-bottom: 0;">👤${item.bracketInfo.numEntrants}</span>${lumitierIconStr}</br>
    </div>
    <div style=" background: white; width: fit-content; display: inline-block; padding-left: 4px; padding-right: 4px; padding-top: 4px; padding-bottom:4px; border-radius:10px; border: 1px solid gray; ${shadowText2}">
      <span >
        <span style="background: white">${item.bracketInfo.tourneyName}, ${item.bracketInfo.fullRoundText}</span>
        <br/>
        <span style="font-size: 12px;font-weight: bolder;">${item.player1Info.nameWithRomaji}</span> vs <span style="font-size: 12px;font-weight: bolder;">${item.player2Info.nameWithRomaji}</span><br/>
      </span>
    </div>
  </div>`

  if (zoomLevel < 4) {
    txt = `<div style="color: black; line-height:1.2;margin-left: -150px; margin-top: -2px; font-size: 16px; font-weight: bold; width:300px"><div><span style="font-size: 16px;font-weight: bolder; background: #ffffffff; padding-bottom:1px; padding-top:1px; padding-left:2px; padding-right:2px; border-radius:4px; border: 1px solid gray; ${shadowText1}">👤${item.bracketInfo.numEntrants}</span>${lumitierIconStr}</div></div>`
  }
  return txt
}

function charEmojis(charInfo, gameId, prekey) {
  var emojiArrs = []
  charInfo.forEach((item, index) => {
    emojiArrs.push(charEmojiImage(item.name, gameId, prekey + index + "_"))
    if (item.schuEmojiName != null) {
      emojiArrs.push(schuEmojiImage(item.schuEmojiName, prekey + "schu_" + index + "_"))
    }
  })
  return emojiArrs.map((item, subindex) => 
    item
  )
}

function charEmojiImage(name, gameId, key = "") {
  return <img className="leafcharemoji" key={key} src={charEmojiImagePath(name, gameId)}/>
}
function schuEmojiImage(name, key = "") {
  return <img className="leafschuemoji" key={key} src={schuEmojiImagePath(name)}/>
}
