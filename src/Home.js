import './Home.css';
  import React, { useState, useEffect, memo, useRef, useCallback } from 'react';
import { LeafMap } from './LeafMapMin.js'
// import { LeafMap } from './LeafMap.js'
import { MediaPreview } from "./VideoEmbeds.js"
import { MediaChat } from "./MediaChat.js"
import { textMatches } from './Utilities.js'
import { GameIds, getDefaultTimeRange, VideoGameInfoById } from './GameInfo.js'
import { FilterView } from './FilterView.js'
import { RewindAndLiveButtons } from './RewindSetButton.js'
import { SearchInputBar, SearchTerms } from "./SearchInputBar.js"
import { renderFilterButton } from './FilterButton.js'
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import pako from 'pako';
import { DataRow } from './DataRow.js';
import { DataRowHybrid } from './DataRowHybrid.js';
import { FilterType } from './FilterTypeButton.js';

export const HomeModes = Object.freeze({
  MAIN: 'MAIN',
  FULLMAP: 'FULLMAP',
  ALLINLIST: 'ALLINLIST',
});

var EmptyFilterInfo = {
  currentGameId: GameIds.SMASH_ULTIMATE,
  filters: {
    [GameIds.SMASH_ULTIMATE]: {
      characters: [], // string[]
    }
  }
}

function getInitialFilter() {
  var filterInfo = JSON.parse(localStorage.getItem('filterInfo'))
  // filterInfo = null
  if (filterInfo == null) {
    filterInfo = {
      currentGameId: GameIds.SMASH_ULTIMATE,
      filters: {
        [GameIds.SMASH_ULTIMATE]: {
          characters: [], // string[] e.g. "ken"
        },
      }
    }
  }
  if (filterInfo.filters[filterInfo.currentGameId] == undefined) {
    filterInfo.filters[filterInfo.currentGameId] = {}
  }
  if (filterInfo.filters[filterInfo.currentGameId].characters == undefined) {
    filterInfo.filters[filterInfo.currentGameId].characters = []
  }
  return filterInfo
}

function compareIntegers(a, b) {
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0; // Preserve original order if values are equal
}

function hasCharacter(item, charName) {
  return (charInfoHasCharacter(item.player1Info.charInfo, charName) || 
    charInfoHasCharacter(item.player2Info.charInfo, charName))
}
function charInfoHasCharacter(charInfo, charName) {
  var hasCharacter = false
  charInfo.forEach(item => {
    if (item.name == charName) {
      hasCharacter = true
    }
  })
  return hasCharacter
}

function checkUrlMatches(urlFilters, item) {
  var itemMatches = false
  urlFilters.twitchMatch.forEach((twitchMatch) => {
    item.streamInfo.streamUrls.forEach(streamUrlInfo => {
      const videoId = streamUrlInfo.videoId
      if (videoId != null && videoId.toLowerCase().indexOf(twitchMatch) >=0) {
        itemMatches = true
      }
    })
  })
  urlFilters.twitchMatchChannel.forEach((twitchMatchChannel) => {
    item.streamInfo.streamUrls.forEach(streamUrlInfo => {
      if (streamUrlInfo.forTheatre.toLowerCase().indexOf(twitchMatchChannel) >=0) {
        itemMatches = true
      }
    })
  })
  urlFilters.youtubeMatch.forEach((youtubeMatch) => {
    item.streamInfo.streamUrls.forEach(streamUrlInfo => {
      const videoId = streamUrlInfo.videoId
      if (videoId != null && videoId.toLowerCase().indexOf(youtubeMatch) >=0) {
        itemMatches = true
      }
    })
  })
  return itemMatches
}

function getUrlFilters(filterInfo) {
  const twitchRegex = `(?:https?:\/\/)?(?:www\.)?twitch\.tv\/videos\/([^?]+)`
  const twitchRegexChannel = `(?:https?:\/\/)?(?:www\.)?twitch\.tv\/([^?]+)`
  const youtubeRegex = `(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com\/(?:watch[?]v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})`
  const urlFilters = {
    twitchMatch: [],
    twitchMatchChannel: [],
    youtubeMatch: [],
  }
  filterInfo.filters[filterInfo.currentGameId]?.searches?.forEach((searchTerm) => {
    if (typeof searchTerm === "string") {
      const twitchMatch = searchTerm.match(twitchRegex)?.[1]
      const twitchMatchChannel = searchTerm.match(twitchRegexChannel)?.[1]
      const youtubeMatch = searchTerm.match(youtubeRegex)?.[1]
      if (twitchMatch != null && twitchMatch.length > 0) {
        urlFilters.twitchMatch.push(twitchMatch)
      } else if (twitchMatchChannel != null && twitchMatchChannel.length > 0) {
        urlFilters.twitchMatchChannel.push(twitchMatchChannel)
      } else if (youtubeMatch != null && youtubeMatch.length > 0) {
        urlFilters.youtubeMatch.push(youtubeMatch)
      }
    }
  })
  return urlFilters
}

function itemMatchesFilter(item, filterInfo, urlFilters) {
  var matchesFilter = false
  filterInfo?.filters[filterInfo.currentGameId]?.characters?.forEach(charName => {
    if (hasCharacter(item, charName)) {
      matchesFilter = true
    }
  })
  if (textMatches(filterInfo, item.bracketInfo.tourneyName)) {
    matchesFilter = true
  }
  if (textMatches(filterInfo, item.player1Info.nameWithRomaji)) {
    matchesFilter = true
  }
  if (textMatches(filterInfo, item.player2Info.nameWithRomaji)) {
    matchesFilter = true
  }
  if (item.streamInfo.streamSource == "TWITCH") {
    if (textMatches(filterInfo, item.streamInfo.forTheatre)) {
      matchesFilter = true
    }
  }
  item.streamInfo.streamUrls.forEach(streamUrlInfo => {
    if (textMatches(filterInfo, streamUrlInfo.videoId)) {
      matchesFilter = true
    }
  })
  if (checkUrlMatches(urlFilters, item)) {
      matchesFilter = true
  }
  if (textMatches(filterInfo, item.bracketInfo.url)) {
    matchesFilter = true
  }
  filterInfo?.filters[filterInfo.currentGameId]?.searches?.forEach(searchItem => {
    if (typeof searchItem !== "string" && searchItem.userSlug != null){
      if (searchItem?.userSlug == item?.player1Info?.userSlug) {
        matchesFilter = true
      }
      if (searchItem?.userSlug == item?.player2Info?.userSlug) {
        matchesFilter = true
      }
    }
  })
  return matchesFilter
}

function printNumberOfVods(data) {
  var vodCount = []
  var overall = 0
  Object.keys(data).forEach(gameId => {
    vodCount.push(data[gameId].vods.length)
    overall += data[gameId].vods.length
  })
  console.log(vodCount)
  console.log(overall)
}

function filterInfoHasFiltersForCurrentGame(filterInfo) {
  const gameFilterInfo = filterInfo.filters[filterInfo.currentGameId]
  const hasCharFilters = (gameFilterInfo?.characters ?? []).length > 0
  const hasSearchFilters = (gameFilterInfo?.searches ?? []).length > 0
  return hasCharFilters || hasSearchFilters
}

function getDisplayData(data, filterInfo, showVodsMode) {
  var dataToStart = data[filterInfo.currentGameId].live
  const hasFilters = filterInfoHasFiltersForCurrentGame(filterInfo)
  if (showVodsMode) {
    dataToStart = data[filterInfo.currentGameId].vods
    const timeRange = filterInfo.filters[filterInfo.currentGameId]?.timeRange ?? getDefaultTimeRange(filterInfo.currentGameId)
    if (timeRange != null) {
      const timeStart = Date.now()/1000 + timeRange[0]*24*60*60
      const timeEnd = Date.now()/1000 + timeRange[1]*24*60*60
      const isTimePlus =  timeRange < -7.5
      dataToStart = dataToStart.filter(item => ((isTimePlus || item.bracketInfo.startedAt > timeStart)
         && item.bracketInfo.startedAt < timeEnd + 3500*1.5))
    }
  }
  var sortedData = [...dataToStart].sort((a,b) => {
    return compareIntegers(a.bracketInfo.numEntrants, b.bracketInfo.numEntrants) * -1
  })
  if (showVodsMode) {
    sortedData = [...dataToStart].sort((a,b) => {
      return compareIntegers(a.bracketInfo.startedAt, b.bracketInfo.startedAt) * -1
    })
  }
  if (hasFilters) {
    const urlFilters = getUrlFilters(filterInfo)
    sortedData.forEach(item => {
      item.matchesFilter = itemMatchesFilter(item, filterInfo, urlFilters)
    })
    sortedData = [...sortedData].sort((a,b) => {
      return (a.matchesFilter === b.matchesFilter) ? 0 : (a.matchesFilter ? -1 : 1);
    })
    const filterType = (showVodsMode ? filterInfo.filterType?.vods : filterInfo.filterType?.live) ?? FilterType.HIGHLIGHT
    if (filterType == FilterType.FILTER) {
      sortedData = sortedData.filter((it) => it.matchesFilter)
    }
  }
  return sortedData
}

function displayDataHasItemKey(displayData, itemKey) {
  return displayData.filter(item => item.bracketInfo.setKey == itemKey).length > 0
}

function hasDataForGame(data, gameId, showVodsMode) {
  if (showVodsMode) {
    return data[gameId]?.vods?.length ?? 0 > 0
  } else {
    return data[gameId]?.live?.length ?? 0 > 0
  }
}

function getDataByTourney(displayData) {
  var tourneyById = {}
  displayData.forEach(item => {
    var arr = tourneyById[item.bracketInfo.tourneyId]
    if (arr == undefined) {
      arr = []
    }
    arr.push(item)
    tourneyById[item.bracketInfo.tourneyId] = arr
  })
  return tourneyById
}

function getDropdownSuggestions(data, gameId) {
  var recentData = data[gameId].vods
  recentData = [...recentData].sort((a,b) => {
    return compareIntegers(a.bracketInfo.startedAt, b.bracketInfo.startedAt) * -1
  })
  const usersMap = {}
  recentData.forEach(set => {
    var {userSlug, charInfo, nameWithRomaji} = set.player1Info
    if (userSlug != null) {
      usersMap[userSlug] = { userSlug, charInfo, nameWithRomaji }
    }
    var {userSlug, charInfo, nameWithRomaji} = set.player2Info
    if (userSlug != null) {
      usersMap[userSlug] = { userSlug, charInfo, nameWithRomaji }
    }
  })
  
  return {
    users: Object.values(usersMap)
  }
}

const firebaseConfig = {
  apiKey: "AIzaSyDqeH6lwm1_jGfq2LvSCOtpRqjzOZ0n_pw",
  authDomain: "setsonstream1.firebaseapp.com",
  projectId: "setsonstream1",
  storageBucket: "setsonstream1.firebasestorage.app",
  messagingSenderId: "111757344724",
  appId: "1:111757344724:web:9ceeb07889bf17c6e5e041",
  measurementId: "G-R40CQL1S4W"
};

const firebaseApp = initializeApp(firebaseConfig);
const firebaseDb = getFirestore(firebaseApp);
const analytics = getAnalytics(firebaseApp);

async function fetchBotData(gameId) {
  const docRef = doc(firebaseDb, "data1", "allInfo");
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    console.error("No such document!");
  }
}

function decompressDataFromFetch(compressedDataBase64) {
    const binaryString = atob(compressedDataBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // 2. Decompress the Uint8Array using pako
    const decompressedBytes = pako.inflate(bytes);

    // 3. Convert the decompressed bytes back to a UTF-8 string
    const decompressedText = new TextDecoder('utf-8').decode(decompressedBytes);
    return decompressedText
}

function getInitialShowVodsMode(currentGameId, data ) {
  if (data == null) {
    return false
  } else {
    return (data[currentGameId]?.live?.length ?? 0) == 0
  }
}

function MainComponent(homeMode) {
  // localStorage.removeItem("filterInfo"))
  // return
  // const [showVodsMode, setShowVodsMode] = useState(false);
  const [filterInfo, setFilterInfo] = useState(getInitialFilter());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [streamSubIndex, setStreamSubIndex] = useState(0);
  const [useLiveStream, setUseLiveStream] = useState(true);
  const [currentItemKey, setCurrentItemKey] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [currentVideoOffset, setCurrentVideoOffset] = useState(0); 
  const [currentPlayer, setCurrentPlayer] = useState(null); 
  const [rewindRef, setRewindRef] = useState(null); 
  // const [currentTimest, setCurrentItemKey] = useState(null);
  const [controlsOn, setControlsOn] = useState(false); 

  const currentGameId = filterInfo.currentGameId
  // const showVodsMode = filterInfo.showVodsMode || false
  const showVodsMode = filterInfo.showVodsMode ?? getInitialShowVodsMode(currentGameId, data)

  const currentItemKeyRef = useRef(currentItemKey);
  const currentPlayerRef = useRef(currentPlayer);
  // const rewindRefRef = useRef(rewindRef);
  const rewindRefRef = useRef(null);
  const rewindRefRefMap = useRef(null);

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
  const handleIndexChange = useCallback((newSetKey) => {
    if (currentItemKeyRef.current != newSetKey) {
      setStreamSubIndex(0)
      if (currentItemKeyRef.current != null) {
        setUseLiveStream(true)
      }
    }
    currentItemKeyRef.current = newSetKey
    setCurrentItemKey(newSetKey)
  }, []);

  const updateCurrentGame = (newGameId) => {
    var gameChanged = (newGameId != filterInfo.currentGameId)
    var newFilter = filterInfo.filters[newGameId] ?? {}
    var newFilterInfo = {
      ...filterInfo,
      filters: {...filterInfo.filters},
      currentGameId: newGameId,
    };
    newFilterInfo.filters[newGameId] = newFilter

    localStorage.setItem("filterInfo", JSON.stringify(newFilterInfo));
    setFilterInfo(newFilterInfo)
    if (gameChanged) {
      currentItemKeyRef.current = null
      setCurrentItemKey(null)
      setUseLiveStream(true)
    }
  }

  const toggleCharacter = (charName, gameId) => {
    var newFilters = {...filterInfo.filters}
    if (newFilters[gameId] == undefined) {
      newFilters[gameId] = {}
    }
    var characters = newFilters[gameId]?.characters ?? []
    var newCharacters = []
    if (characters.indexOf(charName) > -1) {
      newCharacters = characters.filter(item => item != charName)
    } else {
      newCharacters = [...characters, charName]
    }
    newFilters[gameId].characters = newCharacters

    var newFilterInfo = {...filterInfo, filters: newFilters}

    localStorage.setItem("filterInfo", JSON.stringify(newFilterInfo));
    setFilterInfo(newFilterInfo)
  }

  const addSearchTerm = (searchTerm) => {
    if (typeof searchTerm === "string") {
      searchTerm = searchTerm.trim()
    }
    const gameId = filterInfo.currentGameId

    var newFilters = {...filterInfo.filters}
    if (newFilters[gameId] == undefined) {
      newFilters[gameId] = {}
    }
    var searches = newFilters[gameId]?.searches ?? [] 
    var newSearches = []
    if (searches.indexOf(searchTerm) > -1) {
      newSearches = searches
    } else {
      newSearches = [...searches, searchTerm]
    }
    newFilters[gameId].searches = newSearches
    var newFilterInfo = {...filterInfo, filters: newFilters}

    localStorage.setItem("filterInfo", JSON.stringify(newFilterInfo));
    setFilterInfo(newFilterInfo)
  }

  
  const removeSearchTerm = (searchTerm) => {
    const gameId = filterInfo.currentGameId

    var newFilters = {...filterInfo.filters}
    if (newFilters[gameId] == undefined) {
      newFilters[gameId] = {}
    }
    var searches = newFilters[gameId]?.searches ?? [] 
    var newSearches =   []
    if (searches.indexOf(searchTerm) > -1) {
      newSearches = searches.filter(item => item != searchTerm)
    } else {
      newSearches = searches.filter(item => 
        item.userSlug != null && item.userSlug != searchTerm.userSlug)
    }
    newFilters[gameId].searches = newSearches
    var newFilterInfo = {...filterInfo, filters: newFilters}

    localStorage.setItem("filterInfo", JSON.stringify(newFilterInfo));
    setFilterInfo(newFilterInfo)
  }

  const changeFilterType = (value) => {    
    var newFilterTypeObj = {}
    var currentFilterInfo = filterInfo?.filterType ?? {}
    var newFilterTypeObj = {...currentFilterInfo }
    if (showVodsMode) {
      newFilterTypeObj["vods"] = value
    } else {
      newFilterTypeObj["live"] = value
    }
    var newFilterInfo = {...filterInfo, filterType: newFilterTypeObj}

    localStorage.setItem("filterInfo", JSON.stringify(newFilterInfo));
    setFilterInfo(newFilterInfo)
  }

  const onTimeRangeChanged = (value) => {
    const gameId = filterInfo.currentGameId
    
    var newFilters = {...filterInfo.filters}
    if (newFilters[gameId] == undefined) {
      newFilters[gameId] = {}
    }
    newFilters[gameId] = {...newFilters[gameId], timeRange: value}
    var newFilterInfo = {...filterInfo, filters: newFilters}

    localStorage.setItem("filterInfo", JSON.stringify(newFilterInfo));
    setFilterInfo(newFilterInfo)
  }

  const setShowVodsMode = (value) => {
    var newFilterInfo = {...filterInfo, showVodsMode: value}
    localStorage.setItem("filterInfo", JSON.stringify(newFilterInfo));
    setFilterInfo(newFilterInfo)
  }

  const updateChatPref = (expanded) => {
    var newFilterInfo = {...filterInfo, chat: {...(filterInfo.chat ?? {}), expanded}}
    localStorage.setItem("filterInfo", JSON.stringify(newFilterInfo));
    setFilterInfo(newFilterInfo)
  }


  const onSearch = (searchTerm) => {
    if (filterInfo.filters[filterInfo.currentGameId]?.searches?.some(searchItem => 
      searchTerm.userSlug != null && searchTerm.userSlug == searchItem.userSlug)) {
      removeSearchTerm(searchTerm)
    } else {
      addSearchTerm(searchTerm)
    }
  }

  const onSearchRemove = (index, searchTerm) => {
    removeSearchTerm(searchTerm)
  }


  const handleTimestampChange = useCallback((newSeconds, rewindAmount=0) => {
    // rewindAmount = -1.0/60
    if (currentPlayerRef.current?.player?.player?.seekTo ?? null != null) {
      // youtube
      const p=currentPlayerRef.current?.player?.player
      if (newSeconds == null && rewindAmount != null) {
        const currentTime = p?.getCurrentTime() ?? 0
        p?.seekTo(currentTime - rewindAmount)
      } else {
          p?.seekTo(newSeconds)
      }
    } else {
      // twitch
      const p = currentPlayerRef.current
      if (newSeconds == null && rewindAmount != null) {
        const currentTime = p?.getCurrentTime() ?? 0
        p?.seek(currentTime - rewindAmount)
      } else {
        p?.seek(newSeconds)
      }
    }
  }, [currentPlayerRef])

  const rewindReady = useCallback((newRewindRef) => {
    rewindRefRef.current = newRewindRef
    // setRewindRef(newRewindRef)
  },[])

  const rewindReadyMap = useCallback((newRewindRef) => {
    rewindRefRefMap.current = newRewindRef
    // setRewindRef(newRewindRef)
  },[])

  const onProgress = (progress) => {
    if (rewindRefRef.current != null) {
      rewindRefRef.current(progress)
    }
    if (rewindRefRefMap.current != null) {
      rewindRefRefMap.current(progress)
    }
  }

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
        const result = await fetchBotData(filterInfo.currentGameId);
        var data = JSON.parse(decompressDataFromFetch(result.info))
        if (data == null) {
          data = {}
        }
        Object.keys(data).forEach((key1) => {
          Object.keys(data[key1]).forEach((key2) => {
            data[key1][key2].forEach(item => {
              item.bracketInfo.setKey = `${item.bracketInfo.setId}`
            })
          })
        })
        setData(data);
        // printNumberOfVods(data)
        // console.log(data)
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  // }, [filterInfo.currentGameId]);

  var gameName = VideoGameInfoById[filterInfo.currentGameId].displayName
  var loadingText = `Loading ${gameName} sets ...`
  var targetWidth = 854
  var targetHeight = 480
  const chatWidth = Math.min(window.innerWidth, 400)
  var width = Math.min(window.innerWidth, targetWidth)
  var height = Math.floor(width*9/16.0)
  if (height > 0.8 * window.innerHeight) {
    height = 0.8*window.innerHeight
    width = Math.floor(height*16.0/9)
  }
  var mainVideoDim = { width, height }


  const topRef = useRef(null);
  const scrollUpRef = useRef(null);
  const headerHeight = 26
  const onChangeGame = (gameInfo) => {
    updateCurrentGame(gameInfo.id)
    const newScrollY = -stickyPos+headerHeight
    if (window.scrollY > newScrollY) {
      window.scrollTo({top: -stickyPos+headerHeight})
    }
  }

  if (loading) {
    if (useVideoIn.panel == true) {
      const vidWidth = `${width}px`
      const vidHeight = `${height}px`
      preview = <div ref={topRef}className="topContainer">{MediaPreview({item: null, streamSubIndex, width:vidWidth, height:vidHeight, useLiveStream: useLiveStream && !showVodsMode, currentVideoOffset, handleReady: null, onProgress: null})}</div>

      return (
        <div className="overallDiv">
          {
            renderLinkRow([], filterInfo, showVodsMode, setShowVodsMode, homeMode == HomeModes.FULLMAP, onSearch, onSearchRemove, changeFilterType, null)
          }
          <div className="stickyContainer" style={{top: stickyPos}}>
          <div className="flexMapVid">
            {
              Leafy([], {}, filterInfo, itemKey, useLiveStream, showVodsMode, handleIndexChange, useVideoIn.popup, width, height, homeMode, streamSubIndex, setStreamSubIndex, mainVideoDim, onTimeRangeChanged, null)
            }
            {
              preview
            }
          </div>
          </div>
          {
            renderLinkRow([], filterInfo, showVodsMode, setShowVodsMode, homeMode != HomeModes.FULLMAP, onSearch, onSearchRemove, changeFilterType, null)
          }
          <p>{loadingText}</p>
          { 
            renderFooterButton(filterInfo, () => setShowFilterModal(true))
          }
          {
            renderFooter(filterInfo, onChangeGame, () => setShowFilterModal(false), showFilterModal, toggleCharacter)
          }
        </div>          
      )
    }
  }

  if (loading) return <p>{loadingText}</p>;
  if (error) return <p>Error: {error.message}</p>;
  
  var displayData = getDisplayData(data, filterInfo, showVodsMode)
  if (displayData == null) {
    displayData = []
  }
  var tourneyById = getDataByTourney(displayData)
  var wouldHaveData = hasDataForGame(data, filterInfo.currentGameId, showVodsMode)
  var itemKey = currentItemKey
  if (displayData.length > 0) {
    if (itemKey == null) {
      itemKey = displayData[0].bracketInfo.setKey
    } else if (!displayDataHasItemKey(displayData, itemKey)) {
      itemKey = displayData[0].bracketInfo.setKey
    }
  }
  var dropdownSuggestions = getDropdownSuggestions(data, filterInfo.currentGameId)

  var preview = null
  
  const handleReady = player => {
    if (null != player) {
      currentPlayerRef.current = player
      setCurrentPlayer(player)
    }
  }

  var mapWidth = width;
  const mapHeight = height;
  var hasChat = useLiveStream == true && !showVodsMode

  var showMapBeside = 2*width <= window.innerWidth
  if (showMapBeside) {
    const widthRemainForChat = window.innerWidth - 2*width
    if (widthRemainForChat < (chatWidth+5) && hasChat)
      mapWidth -= (chatWidth+5 - widthRemainForChat)
  }
  var stickyPos = 0
  if (!showMapBeside) {
    stickyPos -= height
  }

  var showChatBeneath = width > window.innerWidth-2
  var showChatBesideNextLine = false;
  if (!showChatBeneath && !showMapBeside) {
    if (width + chatWidth < window.innerWidth) {
      showChatBesideNextLine = true
      if (hasChat) {
        mapWidth += chatWidth;
      }
    } else {
      showChatBeneath = true
    }
  }
  var chat = null
  if (useVideoIn.panel == true) {
    var previewItem = null
    if (displayData.length > 0) {
      previewItem = displayData.find(it => it.bracketInfo.setKey == itemKey)
    }
    const vidWidth = `${width}px`
    const vidHeight = `${height}px`
    preview = <div className="topContainer">{MediaPreview({item: previewItem, streamSubIndex, width:vidWidth, height:vidHeight, useLiveStream: useLiveStream && !showVodsMode, currentVideoOffset, handleReady, onProgress})}</div>
    if((showMapBeside || showChatBesideNextLine || showChatBeneath) && useLiveStream == true && !showVodsMode) {
      const chatHeight = showChatBeneath ? 140 : height
      chat = MediaChat({width: chatWidth, height: chatHeight, item: previewItem, streamSubIndex, useLiveStream, trimHeight:showChatBeneath, updateChatPref, chatPref: filterInfo.chat, showExpandMinim: showChatBeneath})
    }
  }
  var noData = null
  var afterData = null

  const sayNoMatch = wouldHaveData
  const shouldShowNoData = displayData.length < 1
  const shouldShowNoDataOver = shouldShowNoData && homeMode == HomeModes.FULLMAP
  if (homeMode != HomeModes.FULLMAP) {
    if (shouldShowNoData) {
      noData = NoData(showVodsMode, setShowVodsMode, false, sayNoMatch)
    } else {
      afterData = AfterData(showVodsMode, setShowVodsMode)
    }
  }

  // var showChatBeside = chatWidth+2*width <= window.innerWidth
  // var overallStyle = {}
  // if (homeMode == HomeModes.FULLMAP) {
  //   overallStyle = {height: "100dvh"}
  // }

  return (
    <div className="overallDiv">
      {
        renderLinkRow(displayData, filterInfo, showVodsMode, setShowVodsMode, homeMode == HomeModes.FULLMAP, onSearch, onSearchRemove, changeFilterType, toggleCharacter, dropdownSuggestions)
      }
      <div className="stickyContainer" style={{top: stickyPos}}>
      <div className="flexMapVid">
        {
          Leafy(displayData, tourneyById, filterInfo, itemKey, useLiveStream, showVodsMode, handleIndexChange, useVideoIn.popup, mapWidth, mapHeight, homeMode, streamSubIndex, setStreamSubIndex, mainVideoDim, onTimeRangeChanged, rewindReadyMap, setUseLiveStream, handleTimestampChange, handleReady)
        }
        {
          preview
        }
        {chat}
      </div>
      </div>
      {
        renderLinkRow(displayData, filterInfo, showVodsMode, setShowVodsMode, homeMode != HomeModes.FULLMAP, onSearch, onSearchRemove, changeFilterType, toggleCharacter, dropdownSuggestions)
      }
      { 
        noData
      }
      {
        renderData(displayData, filterInfo, useVideoIn, handleIndexChange, streamSubIndex, setStreamSubIndex, itemKey, width, height, homeMode, useLiveStream, setUseLiveStream, showVodsMode, handleTimestampChange, rewindReady, scrollUpRef)
      }
      {
        afterData
      }
      <div className="bottomOffsetDiv"/>
      { shouldShowNoDataOver && renderNoDataOver(showVodsMode, setShowVodsMode, sayNoMatch)}
      { 
        renderFooterButton(filterInfo, () => setShowFilterModal(true))
      }
      {
        renderFooter(filterInfo, onChangeGame, () => setShowFilterModal(false), showFilterModal, toggleCharacter)
      }
    </div>
  );
}

function renderNoDataOver(showVodsMode, setShowVodsMode, sayNoMatch) {
  return <div className="noDataContainer">
      <div className="noDataHolder">
        {NoData(showVodsMode, setShowVodsMode, true, sayNoMatch)}
      </div>
  </div>
}

function renderFooterButton(filterInfo, onOpen ) {
  return <div className="footerButtonContainer" key="FooterButtonHome">
      <div className="filterButtonHolder">
        {renderFilterButton(filterInfo, onOpen)}
      </div>
  </div>
}

function renderFooter(filterInfo, onGameClick, onClose, showFilterModal, toggleCharacter ) {
  if (!showFilterModal) {
    return
  }
  return (
    <div className="fullFooter">
      <div className="footerOutside" onClick={onClose}/>
      <div className="footerContent">
      {FilterView(filterInfo, onGameClick, onClose, toggleCharacter)}
      </div>
    </div>
  )
}

function Home({homeMode=HomeModes.MAIN}) {
  return (
    <div className="App">
      <div className="App-header">
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
            integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
            crossOrigin=""/>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
            integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
            crossOrigin=""></script>
        {/* <script src="https://player.twitch.tv/js/embed/v1.js"></script> */}
        <script src="https://embed.twitch.tv/embed/v1.js"></script>
        {
          MainComponent(homeMode)
        }
      </div>
    </div>
  );
}

function renderLinkRow(jsonData, filterInfo, showVodsMode, setShowVodsMode, shouldShow, onSearch, onSearchRemove, changeFilterType, toggleCharacter, dropdownSuggestions) {
  if (!shouldShow) {
    return
  }
  const showBelow = window.innerWidth < 450
  const gameFilterInfo = filterInfo.filters[filterInfo.currentGameId]
  const hasCharFilters = (gameFilterInfo?.characters ?? []).length > 0
  var filterType = undefined
  if (showVodsMode) {
    filterType = filterInfo.filterType?.vods
  } else {
    filterType = filterInfo.filterType?.live
  }
  const searchTerms = <SearchTerms searchTerms={gameFilterInfo?.searches} onRemove={onSearchRemove} hasCharFilters={hasCharFilters} filterType={filterType} changeFilterType={changeFilterType} toggleCharacter={toggleCharacter} gameId={filterInfo.currentGameId} charFilters={gameFilterInfo?.characters}/>
  return <div className='linkRowHolder'>
    <div className="linkRow">
      {
        renderLink(jsonData, !showVodsMode)
      }
      <span className="searchAndFilters">
      <SearchInputBar onSearch={onSearch} filterInfo={filterInfo} toggleCharacter={toggleCharacter} suggestionsInfo={dropdownSuggestions}/>
      {!showBelow && searchTerms}
      </span>
      {renderLiveVodToggle(jsonData, showVodsMode, setShowVodsMode)}
    </div>
    {showBelow && searchTerms}
  </div>
}
function renderLiveVodToggle(jsonData, showVodsMode, setShowVodsMode) {
  var classNameLive = "toggleLiveVodCurrent"
  var classNameVod = "toggleLiveVod"
  if (showVodsMode) {
      classNameLive = "toggleLiveVod"
      classNameVod = "toggleLiveVodCurrent"
  }
  return (
    <div className="toggleLiveVodHolder">
      <span className={classNameLive} onClick={() => setShowVodsMode(false)}>Live</span>
      <span className={classNameVod} onClick={() => setShowVodsMode(true)}>Recent</span>
    </div>
  )
}


function renderLink(jsonData, shouldShow) {
  if (!shouldShow) {
    return <div />
  }
  var list = jsonData.map(item => item.streamInfo.forTheatre).filter(item => item !== null).filter((value, index, self) => self.indexOf(value) === index)
  var str = "https://twitchtheater.tv"
  list.forEach(item => {
    str += ("/" + item)
  })
  const numSlash = str.split("/").length
  var numVids = numSlash - 3
  if (list.length == 0)
    return <div />

  return <a target="_blank" href={str} className="bigLinkHolder"><span className="bigLinkLabel" style={{marginRight: '2px'} }>TwitchTheater<br/><span style={{fontSize:"smaller"}}>{`🔗(${numVids})`}</span></span></a>
}

function renderData(jsonData, filterInfo, useVideoIn, handleIndexChange, streamSubIndex, setStreamSubIndex, itemKey, width, height, homeMode, useLiveStream, setUseLiveStream, showVodsMode, handleTimestampChange, rewindReady, scrollUpRef) {
  if (homeMode == HomeModes.FULLMAP) {
    return
  }
  
  var stylename1 = "setRows-flex"
  var stylename2 = "set-row-3-flex"
  if (homeMode == HomeModes.ALLINLIST) {
    stylename1 = "setRows"
    stylename2 = "set-row-3"
  }

  return <div className={stylename1} ref={scrollUpRef}>{  
    jsonData.map((item, index) => {
      const itemStreamSubIndex = (itemKey == item.bracketInfo.setKey) ? streamSubIndex : 0
      //key={`maindata`}
      return <div key={`${item.bracketInfo.setKey}_dataRowItem`} className={stylename2} index={index}>
        <DataRowHybrid {...{item, filterInfo, useVideoInList: useVideoIn.list, handleIndexChange, streamSubIndex: itemStreamSubIndex, setStreamSubIndex, selected: itemKey == item.bracketInfo.setKey, width, height, useLiveStream, setUseLiveStream, showVodsMode, handleTimestampChange, rewindReady,}}/>
      </div>

    })}
  </div>
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

function Leafy(data, tourneyById, filterInfo, itemKey,  useLiveStream, showVodsMode, handleIndexChange, useVideoInPopup, width, height, homeMode, streamSubIndex, setStreamSubIndex, mainVideoDim, onTimeRangeChanged, rewindReady, setUseLiveStream, handleTimestampChange, handleReady) {
  
  if (homeMode === HomeModes.ALLINLIST) {
    return
  }
  const gameId = filterInfo.currentGameId
  const timeRange = filterInfo.filters[gameId].timeRange ?? getDefaultTimeRange(gameId)
  var topOffset = "70px"
  if (window.innerWidth < 450 && (filterInfo.filters[filterInfo.currentGameId]?.searches ?? []).length > 0) {
    topOffset = "100px"
  }
  const filterType = showVodsMode ? filterInfo.filterType?.vods : filterInfo.filterType?.live
  if (data != null)
    return <LeafMap {...{data, tourneyById, itemKey, gameId, filterType, timeRange, topOffset, useLiveStream, showVodsMode, handleIndexChange, useVideoInPopup, width, height, useFullView:homeMode === HomeModes.FULLMAP, streamSubIndex, setStreamSubIndex, vidWidth:mainVideoDim.width, vidHeight:mainVideoDim.height, onTimeRangeChanged, rewindReady, setUseLiveStream, handleTimestampChange, handleReady }}/>
}

function NoData(showVodsMode, setShowVodsMode, overMap, sayNoMatch) {

  var vodPrompt = null
  const textClassName = "app-inform" + (overMap? " app-inform-overMap" : "")
  if (!showVodsMode) {
    var vodPrompt = <span className={textClassName}><br/><p>Try watching <u onClick={() => setShowVodsMode(true)}>Recent sets</u> instead</p></span>
  }
  const firstLineText = sayNoMatch ? "No sets match" : "No sets found"
  return <div>
    <span className={textClassName}>{firstLineText}</span><br/>
    <span className={textClassName}>Refresh again later to try again</span><br/>
    <span className={textClassName}>Some times of day have no sets sometimes, like after PST hours but before JST hours (pacific ocean is big) </span>
    {vodPrompt}
  </div>
}

function AfterData(showVodsMode, setShowVodsMode) {

  if (showVodsMode) {
    return null
  } else {
    return <div>
      <span className="app-inform">Looking for more?</span><br/>
      <span className="app-inform"><p>Try watching <u onClick={() => setShowVodsMode(true)}>Recent sets</u></p></span>
    </div>
  }
}

export default Home;
