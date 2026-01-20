import './Home.css';
import { useState, useEffect, useMemo, memo, useRef, useCallback, useContext } from 'react';
import { Helmet } from "react-helmet-async";
import { LeafMap } from './LeafMapMin.js'
import { MediaPreview } from "./VideoEmbeds.js"
import { MediaChat } from "./MediaChat.js"
import { itemHasUpdated, getItemLink, checkPropsAreEqual, isThemeDark, textMatches, getChannelName, getTourneySlug, getLinkFromSearch, getCharUrl, charEmojiImagePath, renderHomeIcon, getCharLink, schuEmojiImagePath, getStreamEmbedUrl, renderExpandIcon } from './Utilities.js'
import { GameIds, getDefaultTimeRange, VideoGameInfo, VideoGameInfoById, VideoGameInfoByGameSlug, charactersAsSuggestionArr, GameKeywords } from './GameInfo.js'
import { FilterView } from './FilterView.js'
import { SearchInputBar, SearchTerms, SearchInputBarWithIcon, renderSearchIcon } from "./SearchInputBar.js"
import { renderFilterButton } from './FilterButton.js'
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import brotliModulePromise from 'brotli-dec-wasm';
import { NowPlaying } from './NowPlaying.js';
import { SubEmbedControls, SubEmbeds } from './SubEmbedControls.js';
import { ThemeContext } from './ThemeContext.js';
import { useParams, Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import Star from "./Star.js";
import { HorizontalVirtualList, AdaptiveVirtualVideoGrid2 } from './AutoVideoGrid.js';
import { renderXButtonTopRight } from './MiscButtons.js'

const OG_THUMB = "https://setsonstream.tv/logoOg.png"

export const HomeTypes = Object.freeze({
  HOME: 'HOME',
  GAME: 'GAME',
  CHARACTER: 'CHARACTER',
  PLAYER: 'PLAYER',
  TOURNAMENT: 'TOURNAMENT',
  CHANNEL: 'CHANNEL',
  SEARCH: 'SEARCH',
});

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

function getBootstrapData() {
  const el = document.getElementById("route-data");
  if (!el) return null;
  try {
    return JSON.parse(el.textContent);
  } catch {
    return null;
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
  Object.keys(filterInfo.filters).forEach(gameKey => {
    const filtersForGame = filterInfo.filters[gameKey]
    if (filtersForGame && filtersForGame.searches != null) {
      filtersForGame.searches = filtersForGame.searches.filter(item => typeof item === 'object')
    }
  })
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

function checkUrlMatches(urlFilters, item, favMap) {
  var itemMatches = false
  urlFilters.twitchMatch.forEach(({twitchMatch, searchTerm}) => {
    item.streamInfo.streamUrls.forEach(streamUrlInfo => {
      const videoId = streamUrlInfo.videoId
      if (videoId != null && videoId.toLowerCase().indexOf(twitchMatch) >=0) {
        itemMatches = true
        if (favMap != null && (favMap.get(searchTerm) == undefined || favMap.get(searchTerm).at(-1) != item)) {
          favMap.set(searchTerm, favMap.get(searchTerm)?? [])
          favMap.get(searchTerm).push(item)
        }
      }
    })
  })
  urlFilters.twitchMatchChannel.forEach(({twitchMatchChannel, searchTerm}) => {
    item.streamInfo.streamUrls.forEach(streamUrlInfo => {
      if (streamUrlInfo.forTheatre.toLowerCase().indexOf(twitchMatchChannel) >=0) {
        itemMatches = true
        if (favMap != null && (favMap.get(searchTerm) == undefined || favMap.get(searchTerm).at(-1) != item)) {
          favMap.set(searchTerm, favMap.get(searchTerm)?? [])
          favMap.get(searchTerm).push(item)
        }
      }
    })
  })
  urlFilters.youtubeMatch.forEach(({youtubeMatch, searchTerm}) => {
    item.streamInfo.streamUrls.forEach(streamUrlInfo => {
      const videoId = streamUrlInfo.videoId
      if (videoId != null && videoId.toLowerCase().indexOf(youtubeMatch) >=0) {
        itemMatches = true
        if (favMap != null && (favMap.get(searchTerm) == undefined || favMap.get(searchTerm).at(-1) != item)) {
          favMap.set(searchTerm, favMap.get(searchTerm)?? [])
          favMap.get(searchTerm).push(item)
        }
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
        urlFilters.twitchMatch.push({twitchMatch, searchTerm})
      } else if (twitchMatchChannel != null && twitchMatchChannel.length > 0) {
        urlFilters.twitchMatchChannel.push({twitchMatchChannel, searchTerm})
      } else if (youtubeMatch != null && youtubeMatch.length > 0) {
        urlFilters.youtubeMatch.push({youtubeMatch, searchTerm})
      }
    }
  })
  return urlFilters
}

function itemMatchesFilter(item, filterInfo, urlFilters, favMap) {
  var matchesFilter = false
  // filterInfo?.filters[filterInfo.currentGameId]?.characters?.forEach(charName => {
  //   if (hasCharacter(item, charName)) {
  //     matchesFilter = true
  //   }
  // })
  if (textMatches(filterInfo, item.bracketInfo.tourneyName, item, favMap)) {
    matchesFilter = true
  }
  if (textMatches(filterInfo, item.player1Info.nameWithRomaji), item, favMap) {
    matchesFilter = true
  }
  if (textMatches(filterInfo, item.player2Info.nameWithRomaji, item, favMap)) {
    matchesFilter = true
  }
  if (item.streamInfo.streamSource == "TWITCH") {
    if (textMatches(filterInfo, item.streamInfo.forTheatre, item, favMap)) {
      matchesFilter = true
    }
  }
  item.streamInfo.streamUrls.forEach(streamUrlInfo => {
    if (textMatches(filterInfo, streamUrlInfo.videoId, item, favMap)) {
      matchesFilter = true
    }
  })
  if (checkUrlMatches(urlFilters, item, favMap)) {
      matchesFilter = true
  }
  if (textMatches(filterInfo, item.bracketInfo.url, item, favMap)) {
    matchesFilter = true
  }
  filterInfo?.filters[filterInfo.currentGameId]?.searches?.forEach(searchItem => {
    if (typeof searchItem !== "string") {
      if (searchItem.userSlug != null) {
        var hasAdded = false
        if (searchItem?.userSlug == item?.player1Info?.userSlug) {
          matchesFilter = true
          if (favMap != null) {
            favMap.set(searchItem, favMap.get(searchItem)?? [])
            favMap.get(searchItem).push(item)
          }
          hasAdded = true
        }
        if (searchItem?.userSlug == item?.player2Info?.userSlug) {
          if (favMap != null) {
            favMap.set(searchItem, favMap.get(searchItem)?? [])
            favMap.get(searchItem).push(item)
          }
          matchesFilter = true
        }
      } else if (searchItem.tourneySlug != null) {
        if (searchItem?.tourneySlug == getTourneySlug(item?.bracketInfo)) {
          if (favMap != null) {
            favMap.set(searchItem, favMap.get(searchItem)?? [])
            favMap.get(searchItem).push(item)
          }
          matchesFilter = true
        }
      } else if (searchItem.channelName != null) {
        if (searchItem?.channelName == getChannelSlug(item?.streamInfo)) {
          if (favMap != null) {
            favMap.set(searchItem, favMap.get(searchItem)?? [])
            favMap.get(searchItem).push(item)
          }
          matchesFilter = true
        }
      } else if (searchItem?.charName != null) {
        if (hasCharacter(item, searchItem?.charName)) {
          if (favMap != null) {
            favMap.set(searchItem, favMap.get(searchItem)?? [])
            favMap.get(searchItem).push(item)
          }
          matchesFilter = true
        }
      }
    }
  })
  return matchesFilter
}

function getChannelSlug(streamInfo) {
  return getChannelName(streamInfo)
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
  const hasSearchFilters = (gameFilterInfo?.searches ?? []).length > 0
  return hasSearchFilters
}

function getRouteFilterInfo(homeType, params) {
  const { gameParam, charParam, playerParam, tourneyParam, channelParam, searchParam } = params
  var routeFilterInfo = null
  switch (homeType) {
    case HomeTypes.CHARACTER: {
      const gameId = VideoGameInfoByGameSlug[gameParam].id
      routeFilterInfo = {
        currentGameId: gameId,
        filters: {
          [gameId]: {
            searches: [{charName: charParam}]
          }
        }
      }
    }
    break;
    case HomeTypes.PLAYER: {
      const gameId = VideoGameInfoByGameSlug[gameParam].id
      routeFilterInfo = {
        currentGameId: gameId,
        filters: {
          [gameId]: {
            searches: [{userSlug: playerParam}]
          }
        }
      }
    }
    break;
    case HomeTypes.CHANNEL: {
      const gameId = VideoGameInfoByGameSlug[gameParam].id
      routeFilterInfo = {
        currentGameId: gameId,
        filters: {
          [gameId]: {
            searches: [{channelName: channelParam}]
          }
        }
      }
    }
    break;
    case HomeTypes.TOURNAMENT: {
      const gameId = VideoGameInfoByGameSlug[gameParam].id
      routeFilterInfo = {
        currentGameId: gameId,
        filters: {
          [gameId]: {
            searches: [{tourneySlug: tourneyParam}]
          }
        }
      }
    }
    break;
    case HomeTypes.SEARCH: {
      const gameId = VideoGameInfoByGameSlug[gameParam].id
      routeFilterInfo = {
        currentGameId: gameId,
        filters: {
          [gameId]: {
            searches: [{textSearch: searchParam}]
          }
        }
      }
    }
    break;
  }
  return routeFilterInfo
}

function getCatFilterInfo(suggestion, gameId) {
  var routeFilterInfo = null
  if (suggestion?.charName != null) {
    routeFilterInfo = {
      currentGameId: gameId,
      filters: {
        [gameId]: {
          searches: [{charName: suggestion.charName}]
        }
      }
    }
  } else if (suggestion?.userSlug != null) {
    routeFilterInfo = {
      currentGameId: gameId,
      filters: {
        [gameId]: {
          searches: [{userSlug: suggestion.userSlug}]
        }
      }
    }
  } else if (suggestion?.channelName != null) {
    routeFilterInfo = {
      currentGameId: gameId,
      filters: {
        [gameId]: {
          searches: [{channelName: suggestion.channelName}]
        }
      }
    }
  } else if (suggestion?.tourneySlug != null) {
    routeFilterInfo = {
      currentGameId: gameId,
      filters: {
        [gameId]: {
          searches: [{tourneySlug: suggestion.tourneySlug}]
        }
      }
    }
  } else if (suggestion?.gameSlug != null) {
    routeFilterInfo = {
      currentGameId: gameId,
      filters: {
        [gameId]: {
          searches: [{gameSlug: suggestion.gameSlug, gameId}]
        }
      }
    }
  } else {
    routeFilterInfo = {
      currentGameId: gameId,
      filters: {
        [gameId]: {
          searches: []
        }
      }
    }
  }
  return routeFilterInfo
}

function getFavoriteSuggestionFromRoute(homeType, params, filterInfo) {
  const { gameParam, charParam, playerParam, tourneyParam, channelParam, searchParam } = params
  var routeFilterInfo = null
  const gameId = VideoGameInfoByGameSlug[gameParam]?.id
  switch (homeType) {
    case HomeTypes.CHARACTER:
      return filterInfo.filters[gameId]?.searches?.find(item => item.charName == charParam)
    case HomeTypes.GAME:
      return filterInfo?.filters[gameId]?.fav == true ? true: undefined
    case HomeTypes.PLAYER:
      return filterInfo.filters[gameId]?.searches?.find(item => item.userSlug == playerParam)
    case HomeTypes.TOURNAMENT:
      return filterInfo?.filters[gameId]?.searches?.find(item => item.tourneySlug == tourneyParam)
    case HomeTypes.CHANNEL:
      return filterInfo?.filters[gameId]?.searches?.find(item => item.channelName == channelParam)
    case HomeTypes.SEARCH:
      return filterInfo?.filters[gameId]?.searches?.find(item => item.textSearch == searchParam)      
    default:
      return null
  }
}

function getDisplayData(homeType, params, data, filterInfo, showVodsMode) {

  const gameId = filterInfo.currentGameId
  const gameInfo = gameId ? VideoGameInfoById[gameId] : null
  const gameSlug = gameInfo?.gameSlug
  var dataToStart = data[filterInfo.currentGameId].live
  const hasFilters = filterInfoHasFiltersForCurrentGame(filterInfo)
  var setMatch = null;
  if (showVodsMode) {
    dataToStart = data[filterInfo.currentGameId].combined
    if (homeType == HomeTypes.GAME) {
      const timeRange = filterInfo.filters[filterInfo.currentGameId]?.timeRange ?? getDefaultTimeRange(filterInfo.currentGameId)
      if (timeRange != null) {
        const timeStart = Date.now()/1000 + timeRange[0]*24*60*60
        const timeEnd = Date.now()/1000 + timeRange[1]*24*60*60
        const isTimePlus =  timeRange < -7.5
        dataToStart = dataToStart.filter(item => ((isTimePlus || item.bracketInfo.startedAt > timeStart)
          && item.bracketInfo.startedAt < timeEnd + 3500*1.5))
      }
    }
  }
  var sortedData = [...dataToStart]
  const routeFilterInfo = getRouteFilterInfo(homeType, params)
  const favMap = new Map()
  const favFilterMap = new Map()

  if (routeFilterInfo != null ) {
    const urlFilters = getUrlFilters(routeFilterInfo)
    sortedData = sortedData.filter(item => itemMatchesFilter(item, routeFilterInfo, urlFilters))
  }
  else if (hasFilters) {
    const urlFilters = getUrlFilters(filterInfo)
    // Search reorder deprecated
    sortedData.forEach(item => {
      const itemDoesMatch = itemMatchesFilter(item, filterInfo, urlFilters, favMap)
    })
  }
  const {tourneyById, tourneyIds} = getDataByTourney(sortedData || [])
  favMap.set({gameId, gameSlug, "type": "tourneys"}, tourneyIds)
  favMap.set({gameId, gameSlug}, sortedData)
  const favkeysOrdered = Array.from(favMap.keys());
  favkeysOrdered.forEach(key => {
    favFilterMap.set(key, getCatFilterInfo(key, gameId))
  })
  if (params?.setParam != null) {
    setMatch = sortedData.find(item => item.bracketInfo.setKey == params?.setParam)
  }
  return {favMap, favkeysOrdered, favFilterMap, setMatch, routeFilterInfo, displayData:sortedData, tourneyById, tourneyIds}
}

function displayDataHasItemKey(displayData, itemKey) {
  return displayData.filter(item => item.bracketInfo.setKey == itemKey).length > 0
}

function hasDataForGame(data, gameId, showVodsMode) {
  if (data == null) {
    return false
  }
  if (showVodsMode) {
    return data[gameId]?.vods?.length ?? 0 > 0
  } else {
    return data[gameId]?.live?.length ?? 0 > 0
  }
}

function getDataByTourney(displayData) {
  var tourneyById = {}
  var keys = new Set()
  displayData.forEach(item => {
    var arr = tourneyById[item.bracketInfo.tourneyId]
    if (arr == undefined) {
      arr = []
    }
    arr.push(item)
    keys.add(item.bracketInfo.tourneyId)
    tourneyById[item.bracketInfo.tourneyId] = arr
  })
  const tourneyIds = [...keys]
  return {tourneyById, tourneyIds}
}

function getDropdownSuggestions(data, gameId) {
  var recentData = (data != null) ? data[gameId].vods : []
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
  const tourneysMap = {}
  recentData.forEach(set => {
    var {tourneyName, locationStrWithRomaji } = set.bracketInfo
    const tourneySlug = getTourneySlug(set.bracketInfo)
    const tourneyIcon = set.bracketInfo.images[0]?.url ?? null
    const shortSlug = set.bracketInfo.shortSlug
    if (tourneySlug != null) {
      tourneysMap[tourneySlug] = { tourneyName, tourneySlug, shortSlug, locationStrWithRomaji, tourneyIcon }
    }
  })
  const streamsMap = {}
  recentData.forEach(set => {
    var { streamIcon} = set.streamInfo
    const streamName = getChannelName(set.streamInfo)
    if (streamName != null) {
      streamsMap[streamName] = { channelName: streamName, streamIcon }
    }
  })
  const gamesMap = {}
  VideoGameInfo.forEach(gameInfo => {
    var {gameSlug, name, displayName, id, images} = gameInfo
    if (id != null) {
      gamesMap[id] = { gameSlug, gameName: name, gameDisplayName: displayName, gameId: id, gameImage: images.at(-1).url }
    }
  })
  
  return {
    users: Object.values(usersMap),
    tourneys: Object.values(tourneysMap),
    streams: Object.values(streamsMap),
    games: Object.values(gamesMap),
    characters: charactersAsSuggestionArr(gameId) ?? []
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

async function fetchBotData(docName="allInfo2") {
  const docRef = doc(firebaseDb, "data1", docName);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    console.error("No such document!");
  }
}

async function decompressDataFromFetch(blob) {
  const brotli = await brotliModulePromise; // load wasm

  // Firestore Blob → Uint8Array
  const bytes = blob.toUint8Array();

  // Decompress with brotli-wasm
  const decompressedBytes = brotli.decompress(bytes);

  // Convert back to string
  const decompressedText = new TextDecoder("utf-8").decode(decompressedBytes);
  return decompressedText
}

async function decompressUpdatesFromFetch(response) {

  const brotli = await brotliModulePromise; // load wasm

  const arrayBuffer = await response.arrayBuffer();

  // Convert ArrayBuffer to Uint8Array for your decompression
  const bytes = new Uint8Array(arrayBuffer);

  // Decompress with brotli-wasm
  const decompressedBytes = brotli.decompress(bytes);

  // Convert back to string
  const decompressedText = new TextDecoder("utf-8").decode(decompressedBytes);
  return decompressedText
}


// let pollInterval;
// const POLL_INTERVAL_MS = 60000; // 1 minute

// function startPolling() {
//   if (document.visibilityState === 'visible' && !pollInterval) {
//     pollInterval = setInterval(fetchData, POLL_INTERVAL_MS);
//   }
// }

// function stopPolling() {
//   if (pollInterval) {
//     clearInterval(pollInterval);
//     pollInterval = null;
//   }
// }

// function fetchData() {
//   console.log('Fetching new data...');
//   // Your fetch() or XHR code here
// }

// // Listen for visibility changes
// document.addEventListener('visibilitychange', () => {
//   if (document.visibilityState === 'hidden') {
//     stopPolling();
//   } else {
//     startPolling();
//   }
// });

// // Start polling when the page is first loaded
// startPolling();

const UPDATES_URL = 'https://r2prox.jenghissb.workers.dev/updates.json';
const POLL_INTERVAL = 30000; // 30 seconds

async function fetchUpdates() {
  try {
    const response = await fetch(UPDATES_URL, {cache: 'no-store'});

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const textData = await decompressUpdatesFromFetch(response)
    const data = JSON.parse(textData)
    console.log('Updates received:', data);

    return data

  } catch (error) {
    console.error('Error fetching updates:', error);
  }
}

// Sort only first N elements in place
function partialSort(arr, n, compareFn) {
  const sorted = arr.slice(0, n).sort(compareFn);
  arr.splice(0, n, ...sorted);
  return arr;
}

function getInitialShowVodsMode(currentGameId, data ) {
  if (data == null) {
    return false
  } else {
    return (data[currentGameId]?.live?.length ?? 0) == 0
  }
}

function getRouteName(homeType, params) {
  const { gameParam, charParam, tourneyParam, channelParam, playerParam, searchParam } = params
  switch(homeType) {
    case HomeTypes.CHARACTER:
      return charParam
    case HomeTypes.GAME:
      return gameParam
    case HomeTypes.PLAYER:
      return playerParam
    case HomeTypes.TOURNAMENT:
      return tourneyParam
    case HomeTypes.CHANNEL:
      return channelParam
    case HomeTypes.SEARCH:
      return searchParam
    default:
      return "Home"
  }
}

function overrideCurrentGame(homeType, params, filterInfo) {
  const { gameParam, charParam, tourneyParam, channelParam, playerParam } = params
  switch(homeType) {
    case HomeTypes.CHARACTER:
    case HomeTypes.GAME:
    case HomeTypes.PLAYER:
    case HomeTypes.TOURNAMENT:
    case HomeTypes.CHANNEL:
    case HomeTypes.SEARCH:
      const gameId = VideoGameInfoByGameSlug[gameParam].id
      filterInfo.currentGameId = gameId
      if (filterInfo.filters == null) {
        filterInfo.filters = {}
      }
      if (filterInfo.filters[gameId] == null) {
        filterInfo.filters[gameId] = {}
      }
    default:
  }
}

function getRouteInfoFromSuggestions(homeType, params, suggestions) {
  const { gameParam, charParam, tourneyParam, channelParam, playerParam, searchParam, setParam } = params
  const gameId = gameParam ? VideoGameInfoByGameSlug[gameParam].id : null
  switch(homeType) {
    case HomeTypes.CHARACTER:
      return suggestions.characters.find(item => item.charName == charParam)
    case HomeTypes.GAME:
      return suggestions.games.find(item => item.gameId == gameId)
    case HomeTypes.PLAYER:
      return suggestions.users.find(item => item.userSlug == playerParam)
    case HomeTypes.TOURNAMENT:
      return suggestions.tourneys.find(item => item.tourneySlug == tourneyParam)
    case HomeTypes.CHANNEL:
      return suggestions.streams.find(item => item.channelName == channelParam)
    case HomeTypes.SEARCH:
      return {textSearch: searchParam}
    default:
      return null
  }
}

function MainComponent({homeMode, homeType, darkMode}) {
  const params = useParams()
  const prevParams = useRef(null)
  const initialFilter = getInitialFilter();  
  const [filterInfo, setFilterInfo] = useState(initialFilter);
  overrideCurrentGame(homeType, params, filterInfo)
  filterInfo.showVodsMode = true
  const showVodsMode = filterInfo.showVodsMode
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
  const [controlsOn, setControlsOn] = useState(false); 
  const [subEmbedToggle, setSubEmbedToggle] = useState(""); 
  const [showLargeBracket, setShowLargeBracket] = useState(false); 
  const currentGameId = filterInfo.currentGameId
  const currentGameIdRef = useRef(currentGameId);
  currentGameIdRef.current = currentGameId
  const currentItemKeyRef = useRef(currentItemKey);
  const currentPlayerRef = useRef(currentPlayer);
  const rewindRefRef = useRef(null);
  const rewindRefRefMap = useRef(null);
  const prevPreviewInfoRef = useRef(null)

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
  var displayConfig = {
    noDisplayData: false,
    noRouteInfo: false,
    onlyTextVideoTitle: false,
    noControls: false,
  }

  const handleIndexChange = () => {}

  if (prevParams.current != params) {
    const newSetKey = params.setParam
    if (currentItemKeyRef.current != newSetKey) {
      setStreamSubIndex(0)
      if (currentItemKeyRef.current != null) {
        setUseLiveStream(true)
      }
      setShowLargeBracket(false)
    }
    currentItemKeyRef.current = newSetKey
    setCurrentItemKey(newSetKey)
  }
  prevParams.current = params

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
    const searches = filterInfo.filters[filterInfo.currentGameId]?.searches
    if (searchTerm.userSlug != null) {
      if (searches?.some(searchItem => 
        searchTerm.userSlug == searchItem.userSlug)
      ) {
        removeSearchTerm(searchTerm)
      } else {
        addSearchTerm(searchTerm)
      }
    } else if (searchTerm.channelName != null) {
      if (searches?.some(searchItem => 
        searchTerm.channelName == searchItem.channelName)
      ) {
        removeSearchTerm(searchTerm)
      } else {
        addSearchTerm(searchTerm)
      }
    } else if (searchTerm.shortSlug != null) {
      if (searches?.some(searchItem => 
        searchTerm.shortSlug == searchItem.shortSlug)
      ) {
        removeSearchTerm(searchTerm)
      } else {
        addSearchTerm(searchTerm)
      }
    } else if (searchTerm.gameSlug != null) {
      if (searches?.some(searchItem => 
        searchTerm.gameSlug == searchItem.gameSlug)
      ) {
        removeSearchTerm(searchTerm)
      } else {
        addSearchTerm(searchTerm)
      }
    } else if (searchTerm.charName != null) {
      if (searches?.some(searchItem => 
        searchTerm.charName == searchItem.charName)
      ) {
        removeSearchTerm(searchTerm)
      } else {
        addSearchTerm(searchTerm)
      }
    } else if (searchTerm.textSearch != null) {
      if (searches?.some(searchItem => 
        searchTerm.textSearch == searchItem.textSearch)
      ) {
        removeSearchTerm(searchTerm)
      } else {
        addSearchTerm(searchTerm)
      }
    }
  }

  const onSearchRemove = (index, searchTerm) => {
    removeSearchTerm(searchTerm)
  }

  const getSearchItemKey = (item) => {
    if (typeof searchItem === "string") {
      return `string_searchItem`
    } else if (item?.userSlug) {
      return `userSlug_${item?.userSlug}`
    } else if (item?.channelName) {
      return `channelName_${item?.channelName}`
    } else if (item?.gameSlug && item?.type == "tourneys") {
      return `gameSlug_${item?.gameSlug}_tourneys`
    } else if (item?.gameSlug) {
      return `gameSlug_${item?.gameSlug}`
    } else if (item?.charName) {
      return `charName_${item?.charName}`
    } else if (item?.tourneySlug) {
      return `tourneySlug_${item?.tourneySlug}`
    } else {
      return
    }
  }

  const recentSeekThresh = 1800
  const recentSeekRef = useRef({})

  const handleTimestampChange = useCallback((newSeconds, rewindAmount=0) => {
    // rewindAmount = -1.0/60
    if (currentPlayerRef.current?.player?.player?.seekTo ?? null != null) {
      // youtube
      const p=currentPlayerRef.current?.player?.player
      if (newSeconds == null && rewindAmount != null) {
        const currentTime = p?.getCurrentTime() ?? 0
        const lastTimeSet = recentSeekRef.current.lastTimeSet
        const timeToUse = (lastTimeSet != null && Date.now() - lastTimeSet < recentSeekThresh) ? recentSeekRef.current.time : currentTime
        const newTime = timeToUse - rewindAmount
        recentSeekRef.current = {time: newTime, lastTimeSet: Date.now()}
        p?.seekTo(newTime)
      } else {
          p?.seekTo(newSeconds)
      }
    } else if (currentPlayerRef.current != null) {
      // twitch
      const p = currentPlayerRef.current
      if (newSeconds == null && rewindAmount != null) {
        const currentTime = p?.getCurrentTime() ?? 0
        const lastTimeSet = recentSeekRef.current.lastTimeSet
        const timeToUse = (lastTimeSet != null && Date.now() - lastTimeSet < recentSeekThresh) ? recentSeekRef.current.time : currentTime
        const newTime = timeToUse - rewindAmount
        recentSeekRef.current = {time: newTime, lastTimeSet: Date.now()}
        p?.seek(newTime)
      } else {
        p?.seek(newSeconds)
      }
    }
  }, [currentPlayerRef])

  const handlePlayPause = useCallback(() => {
    if (currentPlayerRef.current?.player?.player?.getPlayerState != null) {
      // youtube
      const player = currentPlayerRef.current?.player?.player
      const playerState = player.getPlayerState()
      if (playerState == 1 || playerState == 3) {
        player.pauseVideo()
      } else if (playerState == 2 ) {
        player.playVideo()
      }
    } else if (currentPlayerRef.current != null) {
      // twitch
      const player = currentPlayerRef.current
      if (player.isPaused()) {
        player.play()
      } else {
        player.pause()
      }
    }
  }, [currentPlayerRef])

  const handleMuteToggle = useCallback(() => {
    if (currentPlayerRef.current?.player?.player?.getPlayerState != null) {
      // youtube
      const player = currentPlayerRef.current?.player?.player
      if (player.isMuted()) {
        player.unMute()
      } else {
        player.mute()
      }
    } else if (currentPlayerRef.current != null) {
      // twitch
      const player = currentPlayerRef.current
      const muted = player.getMuted()
      player.setMuted(!muted)
    }
  }, [currentPlayerRef])

  const handleVolumeUp = useCallback(() => {
    if (currentPlayerRef.current?.player?.player?.getPlayerState != null) {
      // youtube
      const player = currentPlayerRef.current?.player?.player
      const currentVolume = player.getVolume() || 0
      const newVolume = Math.min(currentVolume + 5, 100)
      player.setVolume(newVolume)
    } else if (currentPlayerRef.current != null) {
      // twitch
      const player = currentPlayerRef.current
      const currentVolume = player.getVolume() || 0
      const newVolume = Math.min(currentVolume + 0.05, 1)
      player.setVolume(newVolume)
    }
  }, [currentPlayerRef])

  const handleVolumeDown = useCallback(() => {
    if (currentPlayerRef.current?.player?.player?.getPlayerState != null) {
      // youtube
      const player = currentPlayerRef.current?.player?.player
      const currentVolume = player.getVolume() || 0
      const newVolume = Math.max(currentVolume - 5, 0)
      player.setVolume(newVolume)
    } else if (currentPlayerRef.current != null) {
      // twitch
      const player = currentPlayerRef.current
      const currentVolume = player.getVolume() || 0
      const newVolume = Math.max(currentVolume - 0.05, 0)
      player.setVolume(newVolume)
    }
  }, [currentPlayerRef])

  const handleQualitySet = useCallback(() => {
    if (currentPlayerRef.current?.player?.player?.getPlayerState != null) {
      // youtube
      // not supported
    } else if (currentPlayerRef.current != null) {
      // twitch
      const player = currentPlayerRef.current
      const qualities = player.getQualities()
      if (qualities) {
        const hqQuality = qualities.find(quality => quality.isDefault)
        hqQuality && player.setQuality(hqQuality.group)
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

  const topRef = useRef(null);
  const scrollUpRef = useRef(null);
  const rightPane = useRef(null);
  const centerPane = useRef(null);

  const navigate = useNavigate();
  const navigateRef = useRef(navigate)
  if (navigateRef.current != navigate) {
    navigateRef.current = navigate
  }
  var handleIndexChangeNav = useCallback(({setKey, gameId}) => {
    const currentNavigate = navigateRef.current
    const itemLink = getItemLink({gameId, setKey})
    currentNavigate(itemLink)
  }, [])

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
        const result = await fetchBotData();
        var data = JSON.parse(await decompressDataFromFetch(result.info))
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
        //merge live and vod
        const liveSet = {}
        Object.keys(data).forEach((key1) => {
          const combined = []
          const gameVids = data[key1]
          
          gameVids.live.sort((a,b) => {
            return compareIntegers(a.bracketInfo.numEntrants, b.bracketInfo.numEntrants) * -1
          })
          gameVids.live.forEach(item => {
            liveSet[item.bracketInfo.setKey] = true
            combined.push(item);
          })
          gameVids.vods.sort((a,b) => {
            return compareIntegers(a.bracketInfo.startedAt, b.bracketInfo.startedAt) * -1
          })
          gameVids.vods.forEach(item => {
            if (!(item.bracketInfo.setKey in liveSet)) {
              combined.push(item);
            }
          })
          gameVids.combined = combined
        })
        setData(data);
        // printNumberOfVods(data)
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    
    let intervalId;
    async function getUpdates() {
      const updates = await fetchUpdates()
      setData(prevData => {
        var didDataChange = false
        let revisedFullData = {...prevData}
        // Merge or replace based on your logic
        Object.keys(updates).forEach((gameId) => {
          var gameDataDidChange = false

          const prevGameCombined = prevData[gameId]["combined"]
          const prevCombinedSmall = prevGameCombined.slice(0, 100)
          const updatesForGame = updates[gameId]
            console.log("updatesForGame, ", updatesForGame)
          const revisedForGame = [...prevGameCombined]
          const newItems = []
          
          updatesForGame.forEach((newSet) => {
            // console.log("updatesForGame set, ", newSet)
            newSet.bracketInfo.setKey = `${newSet.bracketInfo.setId}`
            const prevIndex = prevCombinedSmall.findIndex(item => item?.bracketInfo?.setKey == newSet?.bracketInfo?.setKey)
            const prevItem = prevIndex >= 0 ? prevGameCombined[prevIndex] : null
            // console.log("prevItem, ", prevItem)
            if (prevItem != null) {
              if (itemHasUpdated(prevItem, newSet)) {
                console.log("set updated: newSet", newSet, "prevSet", prevItem)
                gameDataDidChange = true
                revisedForGame[prevIndex] = newSet
              } else {
                console.log("set exists: newSet", newSet, "prevSet", prevItem)
              }
            } else {
              gameDataDidChange = true
              newItems.push(newSet);
              console.log("newSet found: ", newSet)
            }
          })
          if (true ||gameDataDidChange) {
            const revised = [...newItems, ...revisedForGame]
            console.log("isPartialSorting")
            partialSort(revised, 100 + newItems.length, (a,b) => {
              const isLiveComp = a.bracketInfo.endTimeDetected != null ? (b.bracketInfo.endTimeDetected != null ? 0 : 1) : (b.bracketInfo.endTimeDetected != null ? -1 : 0)

              if (isLiveComp != 0) {
                return isLiveComp
              }
              // const numEntrantComp = compareIntegers(a.bracketInfo.numEntrants, b.bracketInfo.numEntrants) * -1
              // return numEntrantComp

              if (a.bracketInfo.endTimeDetected == null) {
                const numEntrantComp = compareIntegers(a.bracketInfo.numEntrants, b.bracketInfo.numEntrants) * -1
                return numEntrantComp
              } else {
                const startedAtComp = compareIntegers(a.bracketInfo.startedAt, b.bracketInfo.startedAt) * -1
                return startedAtComp
              }
              // console.log("isLiveComp", isLiveComp)
              return isLiveComp
              // const numEntrantComp = compareIntegers(a.bracketInfo.numEntrants, b.bracketInfo.numEntrants) * -1
              // const startedAtComp = compareIntegers(a.bracketInfo.startedAt, b.bracketInfo.startedAt) * -1
              // return 
            })
            if (gameId == "1386") {
              console.log("sortDir1a", revised.slice(0,20).map(item => item.bracketInfo.numEntrants))
              console.log("sortDir1b", revised.slice(0,20).map(item => item.bracketInfo.endTimeDetected))
              console.log("sortDir1c", revised.slice(0,20).map(item => item.bracketInfo.setKey))
            }
            // partialSort(revised, 100 + newItems.length, (a,b) => {
            //   const isLiveComp = a.bracketInfo.endTimeDetected != null ? (b.bracketInfo.endTimeDetected != null ? 0 : 1) : (b.bracketInfo.endTimeDetected != null ? -1 : 0)

            //   // console.log("isLiveComp", isLiveComp)
            //   return isLiveComp
            //   // const numEntrantComp = compareIntegers(a.bracketInfo.numEntrants, b.bracketInfo.numEntrants) * -1
            //   // const startedAtComp = compareIntegers(a.bracketInfo.startedAt, b.bracketInfo.startedAt) * -1
            //   // return 
            // })
            // console.log("sortDir2", revised.slice(0,20).map(item => item.bracketInfo.endTimeDetected))
            revisedFullData[gameId] = {...revisedFullData[gameId], combined: revised}
            didDataChange = true
          }
        })
        if (!didDataChange) {
          // console.log("didDataChange false")
          revisedFullData = prevData
        } else {
          // console.log("didDataChange true")
        }
        // intervalId = setInterval(getUpdates, 20000);
        // setTimeout(getUpdates, 8000)
        return revisedFullData;
      });
    }
    // Then poll every 30 seconds
    // setInterval(fetchUpdates, POLL_INTERVAL);
    return () => {
      intervalId && clearInterval(intervalId);
    };

  }, []);


  useEffect(() => {
    const ignoreElemTypes = ["text", "textarea", "email"]
    const ignorePress = () => {
      const activeElemType = document.activeElement.type
      if (activeElemType && ignoreElemTypes.includes(activeElemType)) {
        return true
      }
      return false
    }
    const rewindAmount = 5
    const fastForwardAmount = 5
    document.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowLeft' && !ignorePress()) {
        e.preventDefault();
        handleTimestampChange(null, rewindAmount)
      } else if (e.key === 'ArrowRight' && !ignorePress()) {
        e.preventDefault();
        handleTimestampChange(null, -fastForwardAmount)
      } else if (e.key === ',' && !ignorePress()) {
        e.preventDefault();
        handleTimestampChange(null, 1/60)
      } else if (e.key === '.' && !ignorePress()) {
        e.preventDefault();
        handleTimestampChange(null, -1/60)
      } else if (e.key === ' ' && !ignorePress()) {
        e.preventDefault();
        handlePlayPause()
      } else if (e.key === 'm' && !ignorePress()) {
        e.preventDefault();
        handleMuteToggle()
      } else if (e.key === 'ArrowUp' && !ignorePress()) {
        e.preventDefault();
        handleVolumeUp()
      } else if (e.key === 'ArrowDown' && !ignorePress()) {
        e.preventDefault();
        handleVolumeDown()
      } else if (e.key === 'h' && !ignorePress()) {
        e.preventDefault();
        handleQualitySet()
      }
    });
  }, []);


  var gameName = VideoGameInfoById[filterInfo.currentGameId].displayName
  var loadingText = `Loading ${gameName} sets ...`
  var chatWidth = Math.min(window.innerWidth, 400)
  var sideChatWidth = 340 // 310
  var width = window.innerWidth - sideChatWidth; //Math.min(window.innerWidth, targetWidth)
  if (width <= 600) width = window.innerWidth
  var height = Math.floor(width*9/16.0)
  if (height > 0.8 * window.innerHeight) {
    height = 0.8*window.innerHeight
    width = Math.floor(height*16.0/9)
  }
  var mainVideoDim = { width, height }

  
  const headerHeight = 26
  const onChangeGame = (gameInfo) => {
    updateCurrentGame(gameInfo.id)
    if (showFilterModal?.type === "char") {
      setShowFilterModal({...showFilterModal, gameId: gameInfo.id})
    }
    const newScrollY = -stickyPos+headerHeight
    if (window.scrollY > newScrollY) {
      window.scrollTo({top: -stickyPos+headerHeight})
    }
  }
  const { gameParam, charParam, tourneyParam, channelParam, playerParam, setParam } = params
  useEffect(() => {
    rightPane.current?.scrollTo({top:0})
    centerPane.current?.scrollTo({top:0})
  }, [homeType, gameParam, charParam, tourneyParam, channelParam, playerParam]);

  var bootstrap = useMemo(() => getBootstrapData(), [])
  var bootstrapInfo = bootstrap?.routeInfo
  var displayDataInfo = useMemo(() => {
    if (loading || error) return null
    return getDisplayData(homeType, params, data, filterInfo, showVodsMode)
  }, [homeType, params, data, filterInfo, showVodsMode])

  const displayData = displayDataInfo?.displayData || []
  const favMap = displayDataInfo?.favMap || {}
  const favkeysOrdered = displayDataInfo?.favkeysOrdered || []
  const favFilterMap = displayDataInfo?.favFilterMap || {}
  const routeFilterInfo = displayDataInfo?.routeFilterInfo
  var setMatch = displayDataInfo?.setMatch
  if (setMatch == null && setParam != null && setParam == bootstrapInfo?.setId) {
    setMatch = bootstrapInfo.set
  }
  const tourneyById = displayDataInfo?.tourneyById || {}
  const tourneyIds = displayDataInfo?.tourneyIds || []

  if (displayData == null) {
    displayData = []
  }
  var itemKey = currentItemKey
  if (displayData.length > 0) {
    if (setMatch) {
      // keep key
    } else if (itemKey == null) {
      itemKey = displayData[0].bracketInfo.setKey
    } else if (!displayDataHasItemKey(displayData, itemKey)) {
      itemKey = displayData[0].bracketInfo.setKey
    }
  }

  var dropdownSuggestions = getDropdownSuggestions(data, filterInfo.currentGameId)
  var routeInfo = getRouteInfoFromSuggestions(homeType, params, dropdownSuggestions)
  const useHomeTypeLists = homeType === HomeTypes.HOME //homeType in [HomeTypes.HOME]

  const widthThresh = 600
  const notLowWidth = width > widthThresh
  const needsLandscapeLayout = window.screen.orientation.type.startsWith('landscape') && window.screen.orientation.type.angle != 0 && window.screen.height < 700
  const useLandscapeLayout = needsLandscapeLayout && setParam != null
  const isPortrait = !notLowWidth;
  const isMobileLayout = needsLandscapeLayout || isPortrait
  
  // const showPreviewOnHomePage = !isMobileLayout
  // const showPreviewOnTopicPages = !isMobileLayout
  const showPreviewOutsideOfSetPage = !isMobileLayout
  const useSingleList = !useHomeTypeLists && !useLandscapeLayout
  const hasRightPane = notLowWidth && !useHomeTypeLists
  const showSearchWithRoute = notLowWidth
  const showSubEmbed = !notLowWidth && !useHomeTypeLists
  const titleStyle = hasRightPane ? {zIndex:30004} : {position: "sticky", top: 0, zIndex:30004, background: "var(--bg-main)"}
  if (!showSearchWithRoute) {
    titleStyle.paddingTop = "8px"
  }
  const showExpand = useHomeTypeLists
  if (!hasRightPane) {
    chatWidth = "100%"
  } else {
    chatWidth = sideChatWidth
  }
  const centerWidth = hasRightPane ? window.innerWidth - chatWidth : window.innerWidth

  var showChatBeneath = !hasRightPane;
  var showChatBesideNextLine = false;

  const onPressCharButton = () => setShowFilterModal({type: "char", gameId: currentGameId})
  if (loading && setMatch == null) return <div className="home2threePanes">
        <div className="home2centerPane" ref={centerPane}>
          <div style={titleStyle}>
            {!displayConfig.noRouteInfo && !showSearchWithRoute && <SearchBar {...{navigate: navigate, onSearch: ()=> {}, toggleCharacter: () => {}, dropdownSuggestions: null, filterInfo: filterInfo, onPressCharButton}} /> }
            <div className="home2titleBar">
              {!displayConfig.noRouteInfo && <RouteInfo {...{routeInfo, homeType, setMatch, bootstrapInfo, params, filterInfo, dropdownSuggestions, onFavorite:onSearch, openGameFilter:() => setShowFilterModal({type: "game", gameId: currentGameId})}} />}
              {!displayConfig.noRouteInfo &&  showSearchWithRoute && <SearchBar {...{navigate: navigate, onSearch: ()=> {}, toggleCharacter: () => {}, dropdownSuggestions: null, filterInfo: filterInfo, onPressCharButton}} /> }        
              <div className="emptyDiv"/>
              </div>
            </div>
            <div className="home2LoadingSyle">{loadingText}</div>
          </div>
          { hasRightPane && <div className="home2rightPane" ref={rightPane}/>}
        </div>


  if (error) {
    return <div>Error: {error.message}</div>
  }

  var preview = null
  
  const handleReady = player => {
    if (null != player) {
      currentPlayerRef.current = player
      setCurrentPlayer(player)
    }
  }

  var mapWidth = width;
  var mapHeight = height;
  var hasChat = useLiveStream == true && !showVodsMode

  var showMapBeside = 2*width <= window.innerWidth
  if (showMapBeside) {
    const widthRemainForChat = window.innerWidth - 2*width
    if (widthRemainForChat < (chatWidth+5) && hasChat)
      mapWidth -= (chatWidth+5 - widthRemainForChat)
  }
  var stickyPos = headerHeight

  mapWidth = chatWidth
  mapHeight = "240px"
  var chat = null
  var previewItem = null
  if (useVideoIn.panel == true && (showPreviewOutsideOfSetPage || setParam != null)) { // && notLowWidth
    if (displayData.length > 0) {
      previewItem = displayData.find(it => it.bracketInfo.setKey == itemKey)
    }
    if (previewItem == null && setMatch) {
      previewItem = setMatch
    }
    const prevPreviewInfo = prevPreviewInfoRef.current
    const prevPreviewItem = prevPreviewInfo?.previewItem
    
    const vidWidth = "100%"
    const vidHeight = "100%"
    const previewSupportsLive = previewItem?.bracketInfo?.endTimeDetected == null
    const isSameKey = previewItem != null && previewItem?.bracketInfo?.setKey === prevPreviewItem?.bracketInfo?.setKey
    const wasUsingLive = isSameKey && prevPreviewInfo?.usingLive == true
    let shouldUseLive = useLiveStream && (previewSupportsLive || wasUsingLive)
    prevPreviewInfoRef.current = {
      previewItem,
      usingLive: useLiveStream && shouldUseLive,
    }
    preview = MediaPreview({item: previewItem, streamSubIndex, width:vidWidth, height:vidHeight, useLiveStream: shouldUseLive, currentVideoOffset, handleReady, onProgress})
    if((true || showMapBeside || showChatBesideNextLine || showChatBeneath) && shouldUseLive) {
      const chatHeight = showChatBeneath ? 240 : 350;
      chat = MediaChat({width: chatWidth, height: chatHeight, item: previewItem, streamSubIndex, useLiveStream, trimHeight:true, updateChatPref, chatPref: {expanded: true}, showExpandMinim: false})
    }
  }
  var noData = null
  var afterData = null
  var wouldHaveData = hasDataForGame(data, filterInfo.currentGameId, showVodsMode)
  const sayNoMatch = wouldHaveData && setMatch == null
  const shouldShowNoData = displayData.length < 1 && setMatch == null
  const shouldShowNoDataOver = shouldShowNoData && homeMode == HomeModes.FULLMAP
  if (homeMode != HomeModes.FULLMAP) {
    if (shouldShowNoData) {
      const isBootstrapMatch = bootstrapMatchesCat(bootstrapInfo, homeType, params)
      const bootstrapStr = isBootstrapMatch && getNoDataBootstrapString(homeType, params)
      const bootstrapStr2 = isBootstrapMatch && getNoDataBootstrapString2(homeType, params)
      noData = NoData(showVodsMode, setShowVodsMode, false, sayNoMatch, bootstrapStr, bootstrapStr2)
    } else {
      afterData = AfterData(showVodsMode, setShowVodsMode)
    }
  }
  const itemStreamSubIndex = (previewItem != null && itemKey == previewItem.bracketInfo.setKey) ? streamSubIndex : 0

  const previewStyle = notLowWidth ? 
     {position: "sticky", top: useHomeTypeLists? "48px" : "0px", zIndex:30000, alignSelf: "center"}
   : {position: "sticky", top: (displayConfig.noRouteInfo || useLandscapeLayout) ? "0px" : "104px", zIndex:30000, alignSelf: "center"}
  if (useHomeTypeLists) {
    previewStyle.maxWidth = "min(max(30%, 300px), 500px)"
  }
  if (useLandscapeLayout) {
    // previewStyle.maxWidth = "calc(100dvw - 80px)"
    previewStyle.maxWidth = "calc(100dvw - 80px)"
    previewStyle.maxHeight = "calc(100dvh - 40px)"
  }

  const previewItemTourneySlug = previewItem && getTourneySlug(previewItem.bracketInfo)
  const previewItemLink = previewItem && getItemLink({searchTerm: {tourneySlug: previewItemTourneySlug}, gameId:previewItem.bracketInfo.gameId, setKey: previewItem.bracketInfo.setKey, tourneySlug: previewItemTourneySlug})

  // const subEmbedTypes = chat != null ? [SubEmbeds.CHAT, SubEmbeds.BRACKET, SubEmbeds.MAP] : [SubEmbeds.BRACKET, SubEmbeds.MAP]
  const subEmbedTypes = chat != null ? [SubEmbeds.CHAT, SubEmbeds.MAP] : [SubEmbeds.MAP]
  const subEmbedsExpanded = Object.values(subEmbedTypes).includes(subEmbedToggle)
  const subEmbedHeight = subEmbedsExpanded ? "240px" : "40px"
  const routeName = getRouteName(homeType, params)

  if (hasRightPane) {
    window.scrollTo({top: 0})
  }
  const displayDataFilterInfo = routeFilterInfo || filterInfo
  return (
    <div className="home2overallDiv">
      {/* <ThreePaneLayout /> */}
      <div className="home2threePanes">
        <div className="home2centerPane" ref={centerPane}>
          <div style={titleStyle}>
            {!displayConfig.noRouteInfo && !useLandscapeLayout && !showSearchWithRoute && <SearchBar {...{navigate: navigate, onSearch: ()=> {}, toggleCharacter: () => {}, dropdownSuggestions: dropdownSuggestions, filterInfo: filterInfo, onPressCharButton}} /> }
            <div className="home2titleBar">
              {!displayConfig.noRouteInfo && !useLandscapeLayout && <RouteInfo {...{routeInfo, homeType, setMatch, bootstrapInfo, params, filterInfo, dropdownSuggestions, onFavorite:onSearch, openGameFilter:() => setShowFilterModal({type:"game", gameId: currentGameId})}} />}
              {!displayConfig.noRouteInfo && !useLandscapeLayout && showSearchWithRoute && <SearchBar {...{navigate: navigate, onSearch: ()=> {}, toggleCharacter: () => {}, dropdownSuggestions: dropdownSuggestions, filterInfo: filterInfo, onPressCharButton}} /> }        
              <div className="emptyDiv"/>
            </div>
          </div>
          { preview != null &&
            <div className="home2previewContainer" style={previewStyle}>
              {
                preview
              }
              {
                previewItemLink && showExpand && <div className="home2-previewExpandHolder"><Link to={previewItemLink} className="home2-previewExpandLink">
                  {renderExpandIcon({width: "32px", height: "32px"})}
                </Link></div>
              }
              {
                // previewItem && useLandscapeLayout && <NowPlaying {...{isHeader: setParam != null, minimal: displayConfig.noControls, setShowBracket: setShowLargeBracket, extraOnSide: hasRightPane, showExtra:!useHomeTypeLists, setShowFilterModal: setShowFilterModal, item: previewItem, filterInfo, useVideoInList: useVideoIn.list, handleIndexChange, streamSubIndex: itemStreamSubIndex, setStreamSubIndex, selected: itemKey == previewItem.bracketInfo.setKey, width, height, useLiveStream, setUseLiveStream, showVodsMode, handleTimestampChange, handlePlayPause, rewindReady,}} />             
              }
            </div>
          }
          {
            !useLandscapeLayout && previewItem && <NowPlaying {...{isHeader: setParam != null, minimal: displayConfig.noControls, setShowBracket: setShowLargeBracket, extraOnSide: hasRightPane, showExtra:!useHomeTypeLists, setShowFilterModal: setShowFilterModal, item: previewItem, filterInfo, useVideoInList: useVideoIn.list, handleIndexChange, streamSubIndex: itemStreamSubIndex, setStreamSubIndex, selected: itemKey == previewItem.bracketInfo.setKey, width, height, useLiveStream, setUseLiveStream, showVodsMode, handleTimestampChange, handlePlayPause, rewindReady,}} />
          }
          { 
            noData
          }
          {
            !useLandscapeLayout && hasRightPane && false && previewItem && showLargeBracket && <BracketEmbedAbs centerWidth={centerWidth} src={previewItem.bracketInfo.phaseGroupUrl} sideChatWidth={sideChatWidth} onClose={() => setShowLargeBracket(false)}/>
          }
          {!useLandscapeLayout && !displayConfig.noDisplayData && showSubEmbed && <div className="home2SubEmbeds" style={{height: subEmbedHeight}}>
            <div className="home2SubEmbedChatContainer" style={subEmbedToggle==SubEmbeds.CHAT ? {} : {display: "none"}}>
              {
                chat
              }
            </div>
            {
              subEmbedToggle==SubEmbeds.MAP && <div className="home2SubEmbedControlsContainer">{Leafy(displayData, tourneyById, filterInfo, itemKey, useLiveStream, showVodsMode, handleIndexChangeNav, useVideoIn.popup, "100dvw", mapHeight, homeMode, homeType, streamSubIndex, setStreamSubIndex, mainVideoDim, onTimeRangeChanged, rewindReadyMap, setUseLiveStream, handleTimestampChange, handleReady)
              }</div>
            }
            {
            subEmbedToggle==SubEmbeds.BRACKET && false && previewItem && <div className="home2SubEmbedControlsContainer">
                <BracketEmbed totalWidth={centerWidth} height={240} src={previewItem.bracketInfo.phaseGroupUrl}/>
              </div>
            }
            <div className="home2SubEmbedControlsContainer">
              <SubEmbedControls selectedControlType={subEmbedToggle} onPressControlType={setSubEmbedToggle} controlTypes={subEmbedTypes} />
            </div>
          </div>}
          { 
            !displayConfig.noDisplayData && !hasRightPane && useSingleList && <DataItems {...{useLandscapeLayout: false, parentRef:centerPane, parentRefCurrent:centerPane.current, jsonData:displayData, filterInfo:displayDataFilterInfo, useVideoInList: useVideoIn.list, handleIndexChange, streamSubIndex, setStreamSubIndex, itemKey: setParam != null ? itemKey : null, homeMode, useLiveStream, setUseLiveStream, showVodsMode, handleTimestampChange, rewindReady, scrollUpRef}}/>
          }
          { 
            useHomeTypeLists && favkeysOrdered.length > 0 && favkeysOrdered.map((item, index) => {
              return <div key={getSearchItemKey(item)} style={{position: "relative"}}>
                {HorizontalCatHeader({favSuggestion:item, onFavorite:onSearch, gameId: currentGameId})}
                <DataHorizontal {...{catInfo: item, items:favMap.get(item), tourneyById, filterInfo: favFilterMap.get(item), useVideoInList: useVideoIn.list, handleIndexChange, streamSubIndex, setStreamSubIndex, itemKey, homeMode, useLiveStream, setUseLiveStream, showVodsMode, handleTimestampChange, rewindReady, scrollUpRef}}/>
              </div>
            })
          }

        </div>
        { useLandscapeLayout && <div className="home2landscapePane"><div className="home2landscapePaneInner" ref={rightPane}>
          {
            previewItem && useLandscapeLayout && <NowPlaying {...{isHeader: setParam != null, minimal: displayConfig.noControls, setShowBracket: setShowLargeBracket, extraOnSide: hasRightPane, showExtra:!useHomeTypeLists, setShowFilterModal: setShowFilterModal, item: previewItem, filterInfo, useVideoInList: useVideoIn.list, handleIndexChange, streamSubIndex: itemStreamSubIndex, setStreamSubIndex, selected: itemKey == previewItem.bracketInfo.setKey, width, height, useLiveStream, setUseLiveStream, showVodsMode, handleTimestampChange, handlePlayPause, rewindReady,}} />             
          }

          {!displayConfig.noDisplayData && showSubEmbed && <div className="home2SubEmbeds" style={{height: subEmbedHeight}}>
            <div className="home2SubEmbedChatContainer" style={subEmbedToggle==SubEmbeds.CHAT ? {} : {display: "none"}}>
              {
                chat
              }
            </div>
            {
              subEmbedToggle==SubEmbeds.MAP && <div className="home2SubEmbedControlsContainer">{Leafy(displayData, tourneyById, filterInfo, itemKey, useLiveStream, showVodsMode, handleIndexChangeNav, useVideoIn.popup, "100dvw", mapHeight, homeMode, homeType, streamSubIndex, setStreamSubIndex, mainVideoDim, onTimeRangeChanged, rewindReadyMap, setUseLiveStream, handleTimestampChange, handleReady)
              }</div>
            }
            {
            subEmbedToggle==SubEmbeds.BRACKET && false && previewItem && <div className="home2SubEmbedControlsContainer">
                <BracketEmbed totalWidth={centerWidth} height={240} src={previewItem.bracketInfo.phaseGroupUrl}/>
              </div>
            }
            <div className="home2SubEmbedControlsContainer">
              <SubEmbedControls selectedControlType={subEmbedToggle} onPressControlType={setSubEmbedToggle} controlTypes={subEmbedTypes} />
            </div>
          </div>}
          { 
            // !displayConfig.noDisplayData && useSingleList && <DataItems {...{useLandscapeLayout: true, parentRef:centerPane, parentRefCurrent:centerPane.current, jsonData:displayData, filterInfo:displayDataFilterInfo, useVideoInList: useVideoIn.list, handleIndexChange, streamSubIndex, setStreamSubIndex, itemKey: setParam != null ? itemKey : null, homeMode, useLiveStream, setUseLiveStream, showVodsMode, handleTimestampChange, rewindReady, scrollUpRef}}/>
          }




          {/* {
            useLandscapeLayout && Leafy(displayData, tourneyById, filterInfo, itemKey, useLiveStream, showVodsMode, handleIndexChangeNav, useVideoIn.popup, mapWidth, mapHeight, homeMode, homeType, streamSubIndex, setStreamSubIndex, mainVideoDim, onTimeRangeChanged, rewindReadyMap, setUseLiveStream, handleTimestampChange, handleReady)
          }
          {useLandscapeLayout && chat} */}
          {
            useLandscapeLayout && <DataItems {...{useLandscapeLayout: true, isRightPane: true, parentRef:rightPane, parentRefCurrent:rightPane.current, jsonData:displayData, filterInfo:displayDataFilterInfo, useVideoInList: useVideoIn.list, handleIndexChange, streamSubIndex, setStreamSubIndex, itemKey, homeMode, useLiveStream, setUseLiveStream, showVodsMode, handleTimestampChange, rewindReady, scrollUpRef}}/>
          }
          {
            useLandscapeLayout && useHomeTypeLists && <DataItems {...{useLandscapeLayout: true, isRightPane: true, parentRef:rightPane, parentRefCurrent:rightPane.current, jsonData:displayData, filterInfo:displayDataFilterInfo, useVideoInList: useVideoIn.list, handleIndexChange, streamSubIndex, setStreamSubIndex, itemKey, homeMode, useLiveStream, setUseLiveStream, showVodsMode, handleTimestampChange, rewindReady, scrollUpRef}}/>
          }
          {
            useLandscapeLayout && afterData
          }
          </div></div>
        }
        { false && !displayConfig.noDisplayData && hasRightPane && <div className="home2rightPane" ref={rightPane}>
          {
            hasRightPane && Leafy(displayData, tourneyById, filterInfo, itemKey, useLiveStream, showVodsMode, handleIndexChangeNav, useVideoIn.popup, mapWidth, mapHeight, homeMode, homeType, streamSubIndex, setStreamSubIndex, mainVideoDim, onTimeRangeChanged, rewindReadyMap, setUseLiveStream, handleTimestampChange, handleReady)
          }
          {hasRightPane && chat}
          {
            hasRightPane && useSingleList && <DataItems {...{useLandscapeLayout: false, isRightPane: true, parentRef:rightPane, parentRefCurrent:rightPane.current, jsonData:displayData, filterInfo:displayDataFilterInfo, useVideoInList: useVideoIn.list, handleIndexChange, streamSubIndex, setStreamSubIndex, itemKey, homeMode, useLiveStream, setUseLiveStream, showVodsMode, handleTimestampChange, rewindReady, scrollUpRef}}/>
          }
          {
            hasRightPane && useHomeTypeLists && <DataItems {...{useLandscapeLayout: false, isRightPane: true, parentRef:rightPane, parentRefCurrent:rightPane.current, jsonData:displayData, filterInfo:displayDataFilterInfo, useVideoInList: useVideoIn.list, handleIndexChange, streamSubIndex, setStreamSubIndex, itemKey, homeMode, useLiveStream, setUseLiveStream, showVodsMode, handleTimestampChange, rewindReady, scrollUpRef}}/>
          }
          {
            hasRightPane && afterData
          }
        </div>
        }
      </div>
      <div className="home2bottomOffsetDiv"/>
      { shouldShowNoDataOver && renderNoDataOver(showVodsMode, setShowVodsMode, sayNoMatch)}
      { 
        // renderFooterButton(filterInfo, () => setShowFilterModal({type: "char", gameId: currentGameId}}))
      }
      {
        renderFooter(showFilterModal, onChangeGame, () => setShowFilterModal(null), navigate)
      }

    </div>
  )
}

function renderNoDataOver(showVodsMode, setShowVodsMode, sayNoMatch) {
  return <div className="home2noDataContainer">
      <div className="home2noDataHolder">
        {NoData(showVodsMode, setShowVodsMode, true, sayNoMatch)}
      </div>
  </div>
}

function renderFooterButton(filterInfo, onOpen ) {
  return <div className="home2footerButtonContainer" key="FooterButtonHome">
      <div className="home2filterButtonHolder">
        {renderFilterButton(filterInfo, onOpen)}
      </div>
  </div>
}

function renderFooter(showFilterModal, onGameClick, onClose, navigate) {
  const filterModalGameId = showFilterModal?.gameId
  if (filterModalGameId == null) {
    return
  }
  const filterSetting = showFilterModal?.type
  const toggleCharacter = (charName, gameId) => {
    onClose()
    navigate(getCharLink(charName, gameId))
  }
  return (
    <div className="home2fullFooter">
      <div className="home2footerOutside" onClick={onClose}/>
      <div className="home2footerContent">
      {FilterView(filterModalGameId, onGameClick, onClose, toggleCharacter, filterSetting)}
      </div>
    </div>
  )
}

function Home({homeMode=HomeModes.MAIN, homeType=HomeTypes.HOME, darkMode}) {
  return (
    <div className="home2App">
      <div className="home2App-header">
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
          MainComponent({homeMode, homeType, darkMode})
        }
      </div>
    </div>
  );
}

const SearchBar = ({navigate, _onSearch, toggleCharacter, dropdownSuggestions, filterInfo, onPressCharButton}) => {
  const onSearch = (searchTerm) => {
    navigate(getLinkFromSearch(searchTerm, filterInfo.currentGameId))
  }
  return <SearchInputBarWithIcon onSearch={onSearch} filterInfo={filterInfo} toggleCharacter={toggleCharacter} suggestionsInfo={dropdownSuggestions} isFilterBar={false} onPressCharButton={onPressCharButton}/>
}

function renderLinkRow(jsonData, filterInfo, showVodsMode, setShowVodsMode, shouldShow, onSearch, onSearchRemove, changeFilterType, toggleCharacter, dropdownSuggestions) {
  if (!shouldShow) {
    return
  }
  const showBelow = window.innerWidth < 450
  const gameFilterInfo = filterInfo.filters[filterInfo.currentGameId]
  const hasCharFilters = false
  var filterType = undefined
  if (showVodsMode) {
    filterType = filterInfo.filterType?.vods
  } else {
    filterType = filterInfo.filterType?.live
  }
  const searchTerms = <SearchTerms searchTerms={gameFilterInfo?.searches} onRemove={onSearchRemove} hasCharFilters={hasCharFilters} filterType={filterType} changeFilterType={changeFilterType} toggleCharacter={toggleCharacter} gameId={filterInfo.currentGameId} charFilters={gameFilterInfo?.characters}/>
  return <div className="home2linkRowHolder">
    <div className="home2linkRow">
      {
        renderLink(jsonData, !showVodsMode)
      }
      <span className="home2searchAndFilters">
      <SearchInputBar onSearch={onSearch} filterInfo={filterInfo} toggleCharacter={toggleCharacter} suggestionsInfo={dropdownSuggestions}/>
      {!showBelow && searchTerms}
      </span>
      {renderLiveVodToggle(jsonData, showVodsMode, setShowVodsMode)}
    </div>
    {showBelow && searchTerms}
  </div>
}
function renderLiveVodToggle(jsonData, showVodsMode, setShowVodsMode) {
  var classNameLive = "home2toggleLiveVodCurrent"
  var classNameVod = "home2toggleLiveVod"
  if (showVodsMode) {
      classNameLive = "home2toggleLiveVod"
      classNameVod = "home2toggleLiveVodCurrent"
  }
  return (
    <div className="home2toggleLiveVodHolder">
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

  return <a target="_blank" href={str} className="home2bigLinkHolder"><span className="home2bigLinkLabel" style={{marginRight: '2px'} }>TwitchTheater<br/><span style={{fontSize:"smaller"}}>{`🔗(${numVids})`}</span></span></a>
}

const DataHorizontal = memo(({catInfo, items, tourneyById, filterInfo, useVideoInList, handleIndexChange, streamSubIndex, setStreamSubIndex, itemKey, homeMode, useLiveStream, setUseLiveStream, showVodsMode, handleTimestampChange, rewindReady, scrollUpRef}) => {
  const showItemMatches = catInfo.gameSlug != null
  return <HorizontalVirtualList
    {...{showItemMatches, catInfo, items, tourneyById, filterInfo, useVideoInList, handleIndexChange, streamSubIndex, setStreamSubIndex, itemKey: null, homeMode, useLiveStream, setUseLiveStream, showVodsMode, handleTimestampChange, rewindReady, scrollUpRef}}
  />
})


const DataItems = memo(({isRightPane, useLandscapeLayout, parentRef, jsonData, filterInfo, useVideoInList, handleIndexChange, streamSubIndex, setStreamSubIndex, itemKey, homeMode, useLiveStream, setUseLiveStream, showVodsMode, handleTimestampChange, rewindReady, scrollUpRef}) => {
  if (homeMode == HomeModes.FULLMAP) {
    return
  }

  return <AdaptiveVirtualVideoGrid2
    {...{heightMult: useLandscapeLayout? 1.133 : 1.0, showItemMatches: true, padding: isRightPane? "0px": "4px", parentRef, parentRefCurrent:parentRef.current, items:jsonData, filterInfo, useVideoInList, handleIndexChange, streamSubIndex, setStreamSubIndex, itemKey, homeMode, useLiveStream, setUseLiveStream, showVodsMode, handleTimestampChange, rewindReady, scrollUpRef}}
  />
})

function bootstrapMatchesCat(bootstrapInfo, homeType, params) {
  const { gameParam, charParam, playerParam, tourneyParam, channelParam, searchParam, setParam } = params
  var bootstrapMatches = false
  switch(homeType) {
    case HomeTypes.PLAYER:
      bootstrapMatches = playerParam && playerParam == bootstrapInfo?.userSlug
      break
    case HomeTypes.TOURNAMENT:
      bootstrapMatches = tourneyParam && tourneyParam == bootstrapInfo?.tourneySlug
      break
    case HomeTypes.CHANNEL:
      bootstrapMatches = channelParam && channelParam == bootstrapInfo?.channelName
      break
    default:
  }
  return bootstrapMatches
}

function RouteInfo({homeType, params, setMatch, bootstrapInfo, routeInfo, filterInfo, dropdownSuggestions, onFavorite, openGameFilter}) {
  const routeName = getRouteName(homeType, params)
  const { gameParam, charParam, playerParam, tourneyParam, channelParam, searchParam, setParam } = params
  var iconClass = ""
  var iconSrc = null
  var routeText = ""
  var titleMarginLeft = "6px"
  var supportsStar = false
  const gameSlug = gameParam;
  var gameInfo = gameSlug ? VideoGameInfoByGameSlug[gameSlug] : null
  var gameId = null
  if (homeType === HomeTypes.HOME) {
    gameId = filterInfo.currentGameId
    gameInfo = gameId ? VideoGameInfoById[gameId] : null
  } else {
    gameId = gameSlug ? gameInfo.id : null
  }
  const gameName = gameInfo?.name ?? ""
  const gameIcon = gameInfo?.images?.at(-1)?.url ?? null
  const favSuggestion = getFavoriteSuggestionFromRoute(homeType, params, filterInfo);
  var useBootstrap = false
  switch(homeType) {
    case HomeTypes.PLAYER:
      useBootstrap = playerParam && playerParam == bootstrapInfo?.userSlug
      break
    case HomeTypes.TOURNAMENT:
      useBootstrap = tourneyParam && tourneyParam == bootstrapInfo?.tourneySlug
      break
    case HomeTypes.CHANNEL:
      useBootstrap = channelParam && channelParam == bootstrapInfo?.channelName
      break
    default:
  }
  if (!useBootstrap) {
    bootstrapInfo = null
  }


  const isFavorite = favSuggestion != null;
  var title = ""
  var description = ""
  var showGameSelector = false
  var supportsCharEmoji = false
  var keywords = GameKeywords["1386"]
  if (gameId != null) {
    keywords = GameKeywords[gameId] ?? ""
  }
  var charInfo = null
  var useVideoTags = false
  var ogVideoUrl = null
  var ogVideoThumb = null

  switch(homeType) {
    case HomeTypes.CHARACTER:
      routeText = charParam
      iconClass = "home2RouteCharIcon"
      if (routeInfo != null) {
        iconSrc = charEmojiImagePath(routeInfo.charName, gameId)
      } else {
        routeText = charParam;
      }
      supportsStar = true
      title = `${charParam} - Sets on Stream`
      description = `Watch Live and Recent ${gameInfo?.name} ${charParam} Sets on Stream from Tournaments around the World`
      keywords = `${charParam}, ${keywords}`
      break;
    case HomeTypes.GAME:
      routeText = gameInfo?.name
      routeText = gameInfo?.displayName || gameParam
      supportsStar = false
      title = `${gameInfo?.displayName} - Sets on Stream`
      description = `Watch Live and Recent ${gameInfo?.name} Sets on Stream from Tournaments around the World`
      keywords = `${keywords}`
      break;
    case HomeTypes.PLAYER:
      titleMarginLeft = "0px"
      iconSrc = routeInfo?.icon
      charInfo = routeInfo?.charInfo || favSuggestion?.charInfo || bootstrapInfo?.charInfo
      routeText = (routeInfo?.nameWithRomaji  || favSuggestion?.nameWithRomaji || bootstrapInfo?.nameWithRomaji) ?? playerParam
      title = `${routeText} - Sets on Stream`
      description = `Watch ${routeText}'s Live and Recent ${gameInfo?.name} Sets on Stream from Tournaments`
      supportsStar = true
      supportsCharEmoji = true
      keywords = `${routeInfo?.nameWithRomaji}, ${playerParam}, ${keywords}`
      break;
    case HomeTypes.TOURNAMENT:
      iconSrc = routeInfo?.tourneyIcon || favSuggestion?.tourneyIcon || bootstrapInfo?.tourneyIcon
      iconClass = "home2RouteTourneyIcon"
      routeText = (routeInfo?.tourneyName || favSuggestion?.tourneyName || bootstrapInfo?.tourneyName) ?? tourneyParam
      title = `${routeText} - Sets on Stream`
      description = `Watch Live and Recent ${gameInfo?.name} Sets on Stream happening at Tournament ${routeText}`
      const shortSlug = routeInfo?.shortSlug || favSuggestion?.shortSlug || bootstrapInfo?.shortSlug
      supportsStar = shortSlug != null && shortSlug.length > 0
      keywords = `${routeInfo?.tourneyName}, ${tourneyParam}, ${routeInfo?.tourneySlug}, ${keywords}`
      break;
    case HomeTypes.CHANNEL:
      iconSrc = routeInfo?.streamIcon || favSuggestion?.streamIcon || bootstrapInfo?.streamIcon
      iconClass = "home2RouteChannelIcon"
      routeText = channelParam
      title = `${routeText} - Sets on Stream`
      description = `Watch Live and Recent ${gameInfo?.name} Sets on Stream streaming on ${routeText}`
      keywords = `${channelParam}, channel, ${keywords}`
      supportsStar = true
      break;
    case HomeTypes.SEARCH:
      iconClass = "home2RouteSearchIcon"
      routeText = searchParam
      title = `Search "${searchParam}" - Sets on Stream`
      description = `Search Live and Recent ${gameInfo?.name} Sets on Stream`
      keywords = `search, ${keywords}`
      supportsStar = true
      break;
    case HomeTypes.HOME:
      routeText = "Home"
      title = `Home - Sets on Stream`
      description = `Watch live and recent matches from fighting game tournaments: Smash Ultimate, SF6, Rivals 2, Tekken 8, and more.`
      supportsStar = false
      showGameSelector = true
      break;
    default:
      return "Home"
  }

  if (setParam != null) {
    const item = setMatch
    if (item && item.bracketInfo.setKey == setParam) {
      const setId = item.bracketInfo.setId
      const tourneySlug = getTourneySlug(item.bracketInfo)
      const tourneyIcon = item.bracketInfo.images[0]?.url ?? null
      const player1Name = item.player1Info.nameWithRomaji
      const player2Name = item.player2Info.nameWithRomaji
      const player1Slug = item.player1Info.userSlug
      const player2Slug = item.player2Info.userSlug
      const fullRoundText = item.bracketInfo.fullRoundText
      const tourneyName = item.bracketInfo.tourneyName
      const channelName = getChannelName(item.streamInfo)
      const charNames1 = item.player1Info.charInfo.map(item => item.name).filter(name => name.length > 0)
      const charNames2 = item.player2Info.charInfo.map(item => item.name).filter(name => name.length > 0)
      const charNames = charNames1.concat(charNames2)
      var charKeywordStrs = charNames.join(", ").trim()
      if (charKeywordStrs.length > 0) {
        charKeywordStrs = charKeywordStrs + ", "
      }
      title = `${player1Name} vs ${player2Name}, ${tourneyName} - Sets on Stream`
      description = `Watch ${player1Name} vs ${player2Name} in ${fullRoundText} of ${tourneyName}, streamed by ${channelName}`
      keywords = `${player1Name}, ${player2Name} ${player1Slug}, ${player2Slug}, ${tourneyName}, ${tourneySlug}, ${channelName}, ${setId}, ${charKeywordStrs}${keywords}`
      useVideoTags = true
      ogVideoUrl = getStreamEmbedUrl(item.streamInfo, 0, true)
      const tourneyBackgroundUrl = item.bracketInfo.images[1]?.url
      const tourneyIconUrl = item.bracketInfo.images[0]?.url ?? null
      const setThumb = tourneyBackgroundUrl || tourneyIconUrl || OG_THUMB
      ogVideoThumb = setThumb
    } else if (bootstrapInfo && bootstrapInfo.setId == setParam) {
      const setId = bootstrapInfo.setId
      const tourneySlug = bootstrapInfo.tourneySlug
      const player1Name = bootstrapInfo.player1Name
      const player2Name = bootstrapInfo.player2Name
      const player1Slug = bootstrapInfo.player1Slug
      const player2Slug = bootstrapInfo.player2Slug
      const fullRoundText = bootstrapInfo.fullRoundText
      const tourneyName = bootstrapInfo.tourneyName
      const channelName = bootstrapInfo.channelName
      const setKeywords = bootstrapInfo.setKeywords
      const charKeywordStrs = bootstrapInfo.charKeywordStrs
      title = `${player1Name} vs ${player2Name}, ${tourneyName} - Sets on Stream`
      description = `Watch ${player1Name} vs ${player2Name} in ${fullRoundText} of ${tourneyName}, streamed by ${channelName}`
      keywords = `${player1Name}, ${player2Name} ${player1Slug}, ${player2Slug}, ${tourneyName}, ${tourneySlug}, ${channelName}, ${setId}, ${charKeywordStrs}${keywords}`
    }
  }
  const useH1 = setParam == null
  const innerContents = <>
    <Helmet key={`${homeType}_${routeText}`}>
      <title>{title}</title>
      <meta name="description" content={description} key="description"/>
      <meta name="twitter:title" content={title} key="twittertitle"/>
      <meta name="twitter:description" content={description} key="twitterdescription"/>
      <meta name="keywords" content={keywords} key="keywords"/>
      {useVideoTags && <meta property="og:video" content={ogVideoUrl} data-rh="true"/>}
      {useVideoTags && <meta property="og:video:url" content={ogVideoUrl} data-rh="true"/>}
      {useVideoTags && <meta property="og:video:type" content="text/html" data-rh="true"/>}
      {useVideoTags && <meta property="og:video:width" content="1280" data-rh="true"/>}
      {useVideoTags && <meta property="og:video:height" content="720" data-rh="true"/>}
      {useVideoTags && <meta property="og:image" content={ogVideoThumb} data-rh="true"/>}
      {!useVideoTags && <meta property="og:image" content={OG_THUMB} data-rh="true"/>}
    </Helmet>
    <Link className="home2RouteHomeIcon" to={`/`} aria-label="Home">{renderHomeIcon({width:"100%", height: "100%"})}</Link>
    {gameParam && gameId && <div className="home2DotStyle">•</div>}
    {gameParam && gameId && <Link className="home2RouteGameIcon" aria-label={gameName} to={`/game/${gameSlug}`}><img className="home2RouteGameIcon" src={gameIcon}/></Link>}
    {gameParam && gameId && homeType !== HomeTypes.GAME && <div className="home2DotStyle">•</div>}
    {iconSrc && <img className={iconClass} src={iconSrc}/>}
    {searchParam && <div className={iconClass}>{renderSearchIcon("28px")}</div>}
    <div className="home2RouteTitle" style={{marginLeft: titleMarginLeft}}>{routeText}</div>
    {showGameSelector && <div className="home2RouteGameSelectContainer" aria-label={`game selector (${gameInfo.displayName})`} onClick={openGameFilter}>
      <div className="home2RouteGameSelectIcon"><img className="home2RouteGameSelectIcon" src={gameIcon}/></div>
      <div className="home2RouteTitle">{`${gameInfo.displayName}`}</div>
    </div>}
    {supportsCharEmoji && <div style={{width:"5px"}}/>}{supportsCharEmoji && charInfo && charEmojis(charInfo, gameId, "play1_")}
    {supportsStar && <div className="home2RouteStarIcon"><Star ariaLabel={isFavorite ? "Remove from favorites" : "Favorite for later"} ariaPressed={isFavorite} filled={isFavorite} onToggle={() => onFavorite(routeInfo)} /></div>}
  </>
  return useH1 ? <h1 className="home2RouteRow" aria-text={routeText}>
    {innerContents}
  </h1> : <div className="home2RouteRow">
    {innerContents}
  </div>
}

function HorizontalCatHeader({favSuggestion, onFavorite, gameId}) {
  var iconClass = ""
  var iconSrc = null
  var titleMarginLeft = "6px"
  var routeText = ""
  var supportsStar = false
  const gameInfo = gameId ? VideoGameInfoById[gameId] : null
  const gameSlug = gameInfo?.gameSlug
  const gameIcon = gameInfo?.images?.at(-1)?.url ?? null
  var showGame = false
  const isFavorite = favSuggestion != null;
  var supportsCharEmoji = false
  if (favSuggestion.charName != null) {
    const charName = favSuggestion.charName
    routeText = charName
    iconClass = "home2RouteCharIcon"
    if (charName != null) {
      iconSrc = charEmojiImagePath(charName, gameId)
    }
    supportsStar = true
  } else if (favSuggestion.userSlug != null) {
    iconSrc = favSuggestion?.icon
    titleMarginLeft = "2px"
    routeText = favSuggestion?.nameWithRomaji ?? "player"
    supportsStar = true
    supportsCharEmoji = true
  } else if (favSuggestion.tourneySlug != null) {
    iconSrc = favSuggestion?.tourneyIcon
    iconClass = "home2RouteTourneyIcon"
    routeText = favSuggestion?.tourneyName ?? "tourney"
    const shortSlug = favSuggestion?.shortSlug
    supportsStar = shortSlug != null && shortSlug.length > 0
  } else if (favSuggestion.channelName != null) {
    iconSrc = favSuggestion?.streamIcon
    iconClass = "home2RouteChannelIcon"
    routeText = favSuggestion.channelName
    supportsStar = true
  } else if (favSuggestion.textSearch != null) {
    iconClass = "home2RouteSearchIcon"
    routeText = favSuggestion.textSearch
    supportsStar = true
  } else if (favSuggestion.gameId != null) {
    showGame = true
    if (favSuggestion.type == "tourneys") {
      routeText = `${gameInfo?.displayName} - Recent Tournaments`
    } else {
      routeText = `${gameInfo?.displayName} - Recent Sets`
    }
    supportsStar = false
  }

  return <div className="home2RouteRow" style={{marginLeft: "16px"}}>
    {showGame && gameId && <Link className="home2RouteGameIcon" to={`/game/${gameSlug}`}><img className="home2RouteGameIcon" src={gameIcon}/></Link>}
    {iconSrc && <img className={iconClass} src={iconSrc}/>}
    {favSuggestion.textSearch && <div className={iconClass}>{renderSearchIcon("28px")}</div>}
    <Link className="home2RouteTitle home2RouteTitleCat" to={getLinkFromSearch(favSuggestion, gameId)} style={{marginLeft: titleMarginLeft}}>{routeText}</Link>
    {supportsCharEmoji && <div style={{width:"5px"}}/>}{supportsCharEmoji && charEmojis(favSuggestion.charInfo, gameId, "play1_")}
    {supportsStar && <div className="home2RouteStarIcon"><Star filled={isFavorite} onToggle={() => onFavorite(favSuggestion)} /></div>}
  </div>
}

function BracketEmbedAbs({src, centerWidth, sideChatWidth, onClose}) {
  return <div className="home2BracketContainerAbs" style={{width: Math.min(centerWidth, 676), height: `400px`, right: sideChatWidth}}>
    <BracketEmbed totalWidth={Math.min(centerWidth, 676)} height={400} src={src}/>
    {renderXButtonTopRight(onClose, {backgroundColor: "var(--bg-controls)", margin: "2px", borderRadius: "10px"})}
  </div>
}

function BracketEmbed({totalWidth = 854, height = 480, src}) {
  const width = Math.min(totalWidth, 676)
  const scale = 0.7
  const scaledHeight = height / scale
  const scaledWidth = width / scale
  const { theme } = useContext(ThemeContext);
  const bracketClass = isThemeDark(theme) ? "home2Bracket home2BracketFilter" : "home2Bracket"

  return (
    <div className="home2BracketContainer" style={{width:totalWidth, height: height}}>
      <embed
        id="brack"
        className={bracketClass}
        sandbox="allow-scripts allow-same-origin"
        src={src+`/embed`}
        height={scaledHeight+100}
        width={scaledWidth}
      />
    </div>
  )
}

function Leafy(data, tourneyById, filterInfo, itemKey,  useLiveStream, showVodsMode, handleIndexChangeNav, useVideoInPopup, width, height, homeMode, homeType, streamSubIndex, setStreamSubIndex, mainVideoDim, onTimeRangeChanged, rewindReady, setUseLiveStream, handleTimestampChange, handleReady) {
  
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
  const showTimeScale = homeType === HomeTypes.Home || homeType === HomeTypes.GAME
  if (data != null)
    return <LeafMap {...{data, tourneyById, itemKey, gameId, filterType, timeRange, topOffset, useLiveStream, showVodsMode, handleIndexChangeNav, useVideoInPopup, width, height, useFullView:homeMode === HomeModes.FULLMAP, showTimeScale: showTimeScale, streamSubIndex, setStreamSubIndex, vidWidth:mainVideoDim.width, vidHeight:mainVideoDim.height, onTimeRangeChanged, rewindReady, setUseLiveStream, handleTimestampChange, handleReady }}/>
}

function getNoDataBootstrapString(homeType) {
  switch(homeType) {
    case HomeTypes.PLAYER:
      return "No recent sets found for player, check again in the future"
    case HomeTypes.TOURNAMENT:
      return "Tournament sets expired"
    case HomeTypes.CHANNEL:
      return "No sets found for channel currently, check again in the future"
    default:
      return null
  }
}
function getNoDataBootstrapString2(homeType) {
  switch(homeType) {
    case HomeTypes.PLAYER:
      return "Try searching another player, character, or tournament"
    case HomeTypes.TOURNAMENT:
      return "Try searching another tournament or channel!"
    case HomeTypes.CHANNEL:
      return "Try searching another channel, tournament, or character"
    default:
      return null
  }
}

function NoData(showVodsMode, setShowVodsMode, overMap, sayNoMatch, bootstrapStr, bootstrapStr2) {

  var vodPrompt = null
  const textClassName = "home2app-inform" + (overMap? " home2app-inform-overMap" : "")
  if (!showVodsMode) {
    var vodPrompt = <span className={textClassName}><br/><p>Try watching <u onClick={() => setShowVodsMode(true)}>Recent sets</u> instead</p></span>
  }
  const firstLineText = sayNoMatch ? "No sets match" : "No sets found"
  const secondLineText = bootstrapStr ? bootstrapStr : "Refresh again later to try again"
  const thirdLineText = bootstrapStr2 ? bootstrapStr2 : "Some times of day have no sets sometimes, like after PST hours but before JST hours (pacific ocean is big)"
  return <div>
    <span className={textClassName}>{firstLineText}</span><br/>
    <span className={textClassName}>{secondLineText}</span><br/>
    <span className={textClassName}>{thirdLineText}</span>
    {vodPrompt}
  </div>
}

function AfterData(showVodsMode, setShowVodsMode) {

  if (showVodsMode) {
    return null
  } else {
    return <div>
      <span className="home2app-inform">Looking for more?</span><br/>
      <span className="home2app-inform"><p>Try watching <u onClick={() => setShowVodsMode(true)}>Recent sets</u></p></span>
    </div>
  }
}

function charEmojis(charInfo, gameId, prekey, filterInfo) {
  var emojiArrs = []
  charInfo?.forEach((item, index) => {
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
    if (search.charName == name) {
      matchesFilter = true
    }
  })
  var emojiClass = "home2-charemoji"
  if (matchesFilter) {
    emojiClass = "home2-charemojimatches"
  }
  return <Link aria-label={name} key={key} to={charLink}><img className={emojiClass} src={charEmojiImagePath(name, gameId)}/></Link>
}
function schuEmojiImage(name, key = "") {
  return <img className="home2-schuemoji" key={key} src={schuEmojiImagePath(name)}/>
}

export default Home;
