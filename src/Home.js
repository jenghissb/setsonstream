import './Home.css';
import React, { useState, useEffect } from 'react';
import { LeafMap } from './LeafMap.js'
import { MediaPreview } from "./VideoEmbeds.js"
import { getStartggUserLink, getCharUrl, charEmojiImagePath, schuEmojiImagePath } from './Utilities.js'

export const HomeModes = Object.freeze({
  MAIN: 'MAIN',
  FULLMAP: 'FULLMAP',
  ALLINLIST: 'ALLINLIST',
});

function MainComponent(homeMode) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [streamSubIndex, setStreamSubIndex] = useState(0);
  const [itemIndex, setItemIndex] = useState(0);
  
  var useVideoIn = {
    popup: false,
    list: false,
    panel: true
  }
  if (homeMode == HomeModes.FULLMAP) {
    useVideoIn.popup = true
    useVideoIn.panel = false
  } else if (homeMode == HomeModes.ALLINLIST) {
    useVideoIn.panel = false
    useVideoIn.list = true
  }
  const handleIndexChange = (newIndex) => {
    if (itemIndex != newIndex) {
      setStreamSubIndex(0)
    }
    setItemIndex(newIndex);
  };

  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);

    // Clean up the event listener on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []); // Empty dependency array ensures the effect runs only once on mount


  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://v0-new-project-nxcrs7gtpb7.vercel.app/api/data');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  
  var targetWidth = 854
  var targetHeight = 480
  var width = Math.min(window.innerWidth, targetWidth)
  var height = Math.floor(width*9/16.0)
  if (height > 0.8 * window.innerHeight) {
    height = 0.8*window.innerHeight
    width = Math.floor(height*16.0/9)
  }

  var mainVideoDim = { width, height }

  var displayData = data.data
  if (displayData == null) {
    displayData = []
  }
  var preview = null
  if (useVideoIn.panel == true && displayData.length > 0) {
    preview = <div class="topContainer">{MediaPreview({item: displayData[itemIndex], streamSubIndex, width, height})}</div>
  }
  var noData = null
  
  if (displayData.length < 1) {
    noData = NoData()
  }
  return (
    <div className="overallDiv">
      <div className="flexMapVid">
        {
          Leafy(displayData, handleIndexChange, useVideoIn, width, height, homeMode, streamSubIndex, setStreamSubIndex, mainVideoDim)
        }
        {
          preview
        }
      </div>
      {
        renderLink(displayData)
      }
      { 
        noData
      }
      {
        renderData(displayData, useVideoIn, handleIndexChange, itemIndex, mainVideoDim)
      }
    </div>
  );
}

function Home({homeMode=HomeModes.MAIN}) {
  return (
    <div className="App">
      <header className="App-header">
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
            integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
            crossOrigin=""/>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
            integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
            crossOrigin=""></script>

        {
          MainComponent(homeMode = homeMode)
        }
      </header>
    </div>
  );
}

function renderLink(jsonData) {
  var list = jsonData.map(item => item.streamInfo.forTheatre).filter(item => item !== null).filter((value, index, self) => self.indexOf(value) === index)
  var str = "https://twitchtheater.tv"
  list.forEach(item => {
    str += ("/" + item)
  })
  return <div className="bigLinkHolder"><span className="bigLinkLabel" style={{marginRight: '5px'}}>{"TwitchTheater link: "}</span><a href={str} target="_blank" className="bigLink">{str}</a></div>
}

function renderData(jsonData, useVideoIn, handleIndexChange, itemIndex, mainVideoDim) {
  return <div className="setRows">{
    jsonData.map((item, index) => (
      <div className="set-row-3" index={index}>
        {renderDataRow(item, useVideoIn, handleIndexChange, index, itemIndex == index, mainVideoDim)}
      </div>

    ))}
    </div>
}

function renderDataRow(item, useVideoIn, handleIndexChange, index, selected, mainVideoDim) {
  var preview = null
  if (useVideoIn.list) {
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
    handleIndexChange(index)
  }
  var tourneyBackgroundUrl=null
  var tourneyIconUrl = null
  try {
    tourneyBackgroundUrl = item.bracketInfo.images[1].url
    tourneyIconUrl = item.bracketInfo.images[0].url
  }catch{}
  return (
    <div className={divClass} main={selected} onClick={onClick} style={
      {
        background: `linear-gradient(rgba(0, 0, 0, 0.4),  rgba(0, 0, 0, 0.4)), url(${tourneyBackgroundUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center"
        // backgroundImage: "url(https://images.start.gg/images/tournament/801629/image-2c4b8e6351f06631091df62adc53b133.jpg)",
      }
    }>
      <div className="tourney-icon" style={{backgroundImage: `url(${tourneyIconUrl})`, backgroundSize: "cover", backgroundPosition: "center",}} />
      <div className="set-row-2">
        <span className="tourneyText">{item.bracketInfo.tourneyName}</span><br/>
        <span className="tourneyText" style={{ marginRight: '5px' }}>👤 {item.bracketInfo.numEntrants}{"  "}</span><span className="tourneyText">{item.bracketInfo.locationStrWithRomaji}</span><br/>
        <span className="tourneyText">{item.bracketInfo.fullRoundText}</span><br/>
        <a href={item.bracketInfo.phaseGroupUrl} target="_blank" className="bracketLink">{item.bracketInfo.url}</a><br/>
        {item.streamInfo.streamUrls.map((sItem, index) => 
          <div ><a href={sItem.streamUrl} target="_blank" className="bracketLink">{sItem.streamUrl}</a><br/></div>
        )}
      </div>
      <div className="set-row-4">
        <a href={item.player1Info.entrantUrl} target="_blank" className="playerName">{item.player1Info.nameWithRomaji}</a> {charEmojis(item.player1Info.charInfo, "play1_")} vs <a href={item.player2Info.entrantUrl} target="_blank"  className="playerName">{item.player2Info.nameWithRomaji}</a> {charEmojis(item.player2Info.charInfo, "play2_")}<br/>
      </div>
      <div class="rowPreviewHolder" >
      {
        preview
      }
      </div>

    </div>
  );
}

function charEmojis(charInfo, prekey) {  
  var emojiArrs = []
  charInfo.forEach((item, index) => {
    emojiArrs.push(charEmojiImage(item.name, prekey + index + "_"))
    if (item.schuEmojiName != null) {
      emojiArrs.push(schuEmojiImage(item.schuEmojiName, prekey + "schu_" + index + "_"))
    }
  })
  return emojiArrs.map((item, subindex) => 
    item
  )
}
function charEmojiImage(name, key = "") {
  return <img className="charemoji" key={key} src={charEmojiImagePath(name)}/>
}
function schuEmojiImage(name, key = "") {
  return <img className="schuemoji" key={key} src={schuEmojiImagePath(name)}/>
}

function BracketEmbed({width = 854, height = 480}) {
  var src = "https://www.start.gg/tournament/ualr-iliad-smash-65/event/ultimate-singles/brackets/2003530/2936329"

  return (
    <iframe
      sandbox="allow-scripts" 
      src={src+"/embed"}
      width={width}
      height={height}
      allowFullScreen={true}
      title={`BracketEmbed ${src}`}
    />
  );

}

function Leafy(data, handleIndexChange, useVideoIn, width, height, homeMode, streamSubIndex, setStreamSubIndex, mainVideoDim) {
  if (homeMode === HomeModes.ALLINLIST) {
    return
  }
  if (data != null)
    return <LeafMap data={data} handleIndexChange={handleIndexChange} useVideoIn={useVideoIn} width={width} height={height} useFullView={homeMode === HomeModes.FULLMAP} streamSubIndex={streamSubIndex} setStreamSubIndex={setStreamSubIndex} mainVideoDim={mainVideoDim}/>
}

function NoData() {
  return <div>
    <span className="app-inform">No set data</span><br/>
    <span className="app-inform">Refresh again later to try again</span><br/>
    <span className="app-inform">Some times of day have no sets sometimes, like after PST hours but before JST hours (pacific ocean is big) </span>
  </div>
}

export default Home;
