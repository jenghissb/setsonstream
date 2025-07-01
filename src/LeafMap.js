import React, { useRef, useState, useEffect } from "react";
import './LeafMap.css';
import L from 'leaflet';

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import { divIcon , DivIcon} from 'leaflet';
import "leaflet/dist/leaflet.css";
import { getStartggUserLink, getCharUrl, charEmojiImagePath, schuEmojiImagePath, getLumitierIcon, getLumitierIconStr, getViewersTextFromItem } from './Utilities'
import { MediaPreview } from './VideoEmbeds'
import { spreadPoints } from './SpaceLatLon'

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

export function LeafMap({data, handleIndexChange, useVideoIn, height=300, width=300, useFullView = false, streamSubIndex, setStreamSubIndex, mainVideoDim}) {
  var initialZoomLevel = 2
  if (width < 700) {
    initialZoomLevel = 0
  }
  if (useFullView) {
    initialZoomLevel += 1
  }
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

  const latitude = 51.505;
  const longitude = -0.09;

  const videoScale = 0.97
  const videoDim = {
    height: mainVideoDim.height * videoScale,
    width: mainVideoDim.width * videoScale
  }

  const videoWidth = videoDim.width;
  const videoHeight = videoDim.height;
  if (useFullView) {
    var height="calc(100dvh - 56px)";
    var width="100vw";
  }
  
  var inputLatLon = data.map(item => ({lat: item.bracketInfo.lat, lon: item.bracketInfo.lon}))
  var spreadMeters = getSpreadMetersPerZoom(zoomLevel)
  var latLons = spreadPoints(inputLatLon, spreadMeters)
 
  return (
    <div style={{backgroundColor: 'blue', justifyContent: "center", height: height, width: width, justifyContent: "center", alignSelf: "center"}}>
      <MapContainer key={mapKey} center={[latitude, longitude]} zoom={initialZoomLevel} ref={mapRef} style={{height: height, width: width, justifyContent: "center"}}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" >OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {
          <MapEventHelper setZoomLevel={setZoomLevel} />
        }
        {
          data.map( (item, index) => {
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
              html: renderMarkerText(item, zoomLevel)
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
                  {renderPopup(item, handleStreamIndexButtonClick, streamSubIndex, useVideoIn, videoDim)}
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
                  {renderPopup(item, handleStreamIndexButtonClick, streamSubIndex, useVideoIn, videoDim)}
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
                  {renderPopup(item, handleStreamIndexButtonClick, streamSubIndex, useVideoIn, videoDim)}
                </Popup>
              </Marker>
            )
            return <div>
              {marker3}
              {marker1}
              {marker2}
            </div>

          }) 
        }
      </MapContainer> 
    </div>
  );
}

function renderPopup(item, handleStreamIndexButtonClick, streamSubIndex, useVideoIn, videoDim) {
  var streamButton = null
  var numSubStreams = item.streamInfo.streamUrls.length
  if (numSubStreams > 1) {
    streamButton = <button onClick={() => handleStreamIndexButtonClick(numSubStreams)}><span>switch stream</span></button>
  }
  var preview = null
  if (useVideoIn.popup == true) {
    preview = MediaPreview({item, streamSubIndex, ...videoDim})
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
        {item.streamInfo.streamUrls.map((sInfo, index) => 
          <div><a href={sInfo.streamUrl} target="_blank" className="leafbracketLink">{sInfo.streamUrl}</a><br/></div>
        )}
        <a href={item.player1Info.entrantUrl} target="_blank" className="leafplayerName">{item.player1Info.nameWithRomaji}</a> {charEmojis(item.player1Info.charInfo, item.bracketInfo.gameId, "leaf_play1_")} vs <a href={item.player2Info.entrantUrl} target="_blank" className="leafplayerName">{item.player2Info.nameWithRomaji}</a> {charEmojis(item.player2Info.charInfo, item.bracketInfo.gameId, "leaf_play2_")}<br/>
      </div>
      {streamButton}
      {
        preview
      }
    </div>
  );
}

function renderMarkerText(item, zoomLevel) {
  var lumitier = item.bracketInfo.lumitier
  // var lumitier = "C+"
  var lumitierIconStr = getLumitierIconStr(lumitier)
  // var shadowColor = "#F9D84999";
  var shadowColor = "#00ffff99";
  var shadowText1 = item.matchesFilter ? "box-shadow: 12px 0px 40px 20px "+shadowColor+"; " : ""
  var shadowText2 = item.matchesFilter ? "box-shadow: 0px -15px 40px 12px "+shadowColor+"; ": ""

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
