// scripts/generate-content.js
import fs from "fs"
import path from "path"
import { brotliDecompressSync, brotliCompressSync } from "zlib";
import { VideoGameInfo, VideoGameInfoByGameSlug, GameKeywords, Characters, GamePublishers } from "../src/GameInfo.js"
const BASE_URL = 'https://setsonstream.tv';
// const DIST_DIR = path.join(__dirname, "..", "dist-static");
// const DIST_DIR = path.join(__dirname, "..", "build");
const DIST_DIR = "build"
const DATA_DIR = "data"
const SITEMAP_DIR = path.join(DIST_DIR, "sitemaps");
const NUM_SETS_PER = 30
// const NUM_SETS_PER = 10
const EXPIRE_SECONDS = 8 * 24 * 60 * 60
const PARENT = "setsonstream.tv"
const OG_THUMB = "https://setsonstream.tv/logoOg.png"


function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, function(c) {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case "'":
        return '&apos;';
      case '"':
        return '&quot;';
    }
  });
}

function getChannelName(streamInfo) {
  if (streamInfo?.streamSource == 'YOUTUBE') {
    return streamInfo?.streamName ?? " " //streamInfo.ytChannelId
  } else if (streamInfo?.streamSource == 'TWITCH') {
    return streamInfo?.forTheatre
  } else {
    return streamInfo?.channel
  }
}

function getTourneySlug(bracketInfo) {
  const url = bracketInfo?.url ?? "";
  const prefix = "https://www.start.gg/tournament/"
  if (url.startsWith(prefix))
    return url.slice(prefix.length)
  return ""
  //"https://www.start.gg/tournament/versus-reborn-216"

}

function getStreamUrl(streamInfo, index, preferTimestampedVod=false) {
  const streamUrlInfo = streamInfo.streamUrls[index]
  if (streamInfo.streamSource == 'YOUTUBE') {
    const videoId = streamUrlInfo.videoId
    if (videoId != null) {
      if (preferTimestampedVod && streamUrlInfo.offset != null) {
        return `https://www.youtube.com/watch?v=${videoId}?t=${streamUrlInfo.offset}s`
      } else {
        return `https://www.youtube.com/watch?v=${videoId}`
      }
    } else if (streamUrlInfo.streamUrl != null) {
      return streamUrlInfo.streamUrl
    } else {
      const channel = streamInfo.ytChannelId
      return `https://www.youtube.com/${channel}`
    }
  } else if (streamInfo.streamSource == 'TWITCH') {
    const videoId = streamUrlInfo.videoId
    if (preferTimestampedVod && videoId != null) {
      var offsetParamText = ""
      if (streamUrlInfo.offsetHms) {
        offsetParamText = `?t=${streamUrlInfo.offsetHms}`
      }
      return `https://www.twitch.tv/videos/${videoId}${offsetParamText}`
    } else {
      return `https://www.twitch.tv/${streamInfo.forTheatre}`
    }
  }
}

export function getStreamEmbedUrl(streamInfo, index, preferTimestampedVod=false) {
  const streamUrlInfo = streamInfo.streamUrls[index]
  if (streamInfo.streamSource == 'YOUTUBE') {
    const videoId = streamUrlInfo.videoId
    if (videoId != null) {
      if (preferTimestampedVod && streamUrlInfo.offset != null) {
        return `https://www.youtube.com/embed/${videoId}?start=${streamUrlInfo.offset}s`
      } else {
        return `https://www.youtube.com/embed/${videoId}`
      }
    } else if (streamUrlInfo.streamUrl != null) {
      return streamUrlInfo.streamUrl
    } else {
      const channel = streamInfo.ytChannelId
      return `https://www.youtube.com/${channel}`
    }
  } else if (streamInfo.streamSource == 'TWITCH') {
    const videoId = streamUrlInfo.videoId
    if (preferTimestampedVod && videoId != null) {
      var offsetParamText = ""
      if (streamUrlInfo.offsetHms) {
        offsetParamText = `&t=${streamUrlInfo.offsetHms}`
      }
      return `https://player.twitch.tv/?video=${videoId}${offsetParamText}&parent=${PARENT}`
      // return `https://player.twitch.tv/?video=v${videoId}${offsetParamText}&parent=${PARENT}`
    } else {
      return `https://player.twitch.tv/?channel=${streamInfo.forTheatre}&parent=${PARENT}`
    }
  }
}

export function getChannelUrl(streamInfo) {
  if (streamInfo.streamSource == 'YOUTUBE') {
    const channel = streamInfo.ytChannelId
    return `https://www.youtube.com/${channel}`
  } else if (streamInfo.streamSource == 'TWITCH') {
    return `https://www.twitch.tv/${streamInfo.forTheatre}`
  }
  return null
}


// Helpers
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readFile(filePath) {
  return fs.readFileSync(filePath, "utf-8");
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, "utf8");
  // fs.writeFileSync(filePath, content);
}

function readBrotliFile(filePath) {
  const compressedData = fs.readFileSync(filePath);
  const decompressedData = brotliDecompressSync(compressedData);
  const originalString = decompressedData.toString('utf8');
  const dataArchive = JSON.parse(originalString);
  return dataArchive
}

function writeBrotliFile(filePath, dataToSave) {
  ensureDir(path.dirname(filePath));
  const inputBuffer = Buffer.from(dataToSave, 'utf8');
  const compressedData = brotliCompressSync(inputBuffer);
  fs.writeFileSync(filePath, compressedData);
}

function generatePage({templatePath, title, description, keywords, bootstrap={}, jsonLd, canonical, ogVideoUrl, ogVideoThumb, noIndex=false}) {
  let html = fs.readFileSync(templatePath, "utf-8");

  // 1️⃣ Update <title> only
  html = html.replace(/<title>.*<\/title>/i, `<title>${title}</title>`);

  // 2️⃣ Update meta tags without removing other attributes
  const updateMetaContent = (name, value) => {
    const regex = new RegExp(`(<meta[^>]*name=["']${name}["'][^>]*content=["'])([^"']*)(["'][^>]*>)`, "i");
    html = html.replace(regex, `$1${value}$3`);
  };

  updateMetaContent("description", description);
  updateMetaContent("keywords", keywords);
  updateMetaContent("twitter:title", title);
  updateMetaContent("twitter:description", description);
  if (ogVideoThumb != null && ogVideoUrl != null) {
    updateMetaContent("og:image", ogVideoThumb);
    html = html.replace(
      "</head>",
      `<meta property="og:video" content="${ogVideoUrl}" data-rh="true"/>`+
      `<meta property="og:video:url" content="${ogVideoUrl}" data-rh="true"/>`+
      `<meta property="og:video:type" content="text/html" data-rh="true"/>`+
      `<meta property="og:video:width" content="1280" data-rh="true"/>`+
      `<meta property="og:video:height" content="720" data-rh="true"/></head>`
    );
  }
  if (noIndex) {
    html = html.replace(
      "</head>",
      '<meta name="robots" content="noindex"></meta></head>'
    )
    // '<meta name="robots" content="noindex, nofollow"></meta>'
  }
  html = html.replace(
    "</body>",
    `<script id="route-data" type="application/json">${JSON.stringify(bootstrap)}</script></body>`
  );
  if (canonical != null) {
    html = html.replace(
      "</body>",
      `<link rel="canonical" href="${canonical}"/></body>`
    )
  }
  if (jsonLd != null) {
    html = html.replace(
      "</body>",
      `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script></body>`
    );
  }
  return html;
}

function getIsoStr(timeToUse) {
  return new Date(timeToUse * 1000).toISOString();
}

// --- Helpers for <url> and <sitemapindex>
function makeUrlEntry(loc, lastMod = null, changefreq = "daily", priority = 0.8, videoInfo) {
  var lastModTag = ""
  if (lastMod != null) {
      const lastModStr = getIsoStr(lastMod);
      lastModTag = `
  <lastmod>${lastModStr}</lastmod>`
  }
  return `<url>
  <loc>${loc}</loc>${lastModTag}
  <changefreq>${changefreq}</changefreq>
  <priority>${priority}</priority>${videoInfo}
</url>`;
}

function wrapUrlset(urls, showVideoTag=false) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${showVideoTag ? ' xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"' : ""}>
${urls.join("\n")}
</urlset>`;
}

function wrapSitemapIndex(sitemaps) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.join("\n")}
</sitemapindex>`;
}

// --- Main sitemap index
function generateMainSitemap(games, includeCharactersForGames) {
  const sitemaps = [
    `<sitemap><loc>${BASE_URL}/sitemaps/sitemap-top.xml</loc></sitemap>` // combined top pages
  ];

  // games.forEach((game) => {
  //   sitemaps.push(`<sitemap><loc>${BASE_URL}/sitemaps/sitemap-game-${game.gameSlug}.xml</loc></sitemap>`)
  // });

  sitemaps.push(`<sitemap><loc>${BASE_URL}/sitemaps/sitemap-games.xml</loc></sitemap>`)

  // games.forEach((game) => {
  //   sitemaps.push(`<sitemap><loc>${BASE_URL}/sitemaps/sitemap-game-${game.gameSlug}.xml</loc></sitemap>`)
  // });
  games.forEach((game) => {
    const hasCharPages = includeCharactersForGames.includes(game.gameSlug)
    if (hasCharPages) {
      sitemaps.push(`<sitemap><loc>${BASE_URL}/sitemaps/sitemap-game-${game.gameSlug}-characters.xml</loc></sitemap>`)
    }
    sitemaps.push(`<sitemap><loc>${BASE_URL}/sitemaps/sitemap-game-${game.gameSlug}-tournaments.xml</loc></sitemap>`)
    sitemaps.push(`<sitemap><loc>${BASE_URL}/sitemaps/sitemap-game-${game.gameSlug}-channels.xml</loc></sitemap>`)
    sitemaps.push(`<sitemap><loc>${BASE_URL}/sitemaps/sitemap-game-${game.gameSlug}-players.xml</loc></sitemap>`)
    sitemaps.push(`<sitemap><loc>${BASE_URL}/sitemaps/sitemap-game-${game.gameSlug}-sets.xml</loc></sitemap>`)
 });

  return wrapSitemapIndex(sitemaps);
}

// // --- Game sitemap (nested index)
// function generateGameSitemap(game, useCharSitemap=true) {
//   const childSitemaps = [
//     `<sitemap><loc>${BASE_URL}/sitemaps/sitemap-game-${game.gameSlug}-main.xml</loc></sitemap>`
//   ]
//   if (useCharSitemap) {
//     childSitemaps.push(
//       `<sitemap><loc>${BASE_URL}/sitemaps/sitemap-game-${game.gameSlug}-characters.xml</loc></sitemap>`
//     )
//   }
//   return wrapSitemapIndex(childSitemaps);
// }

// --- Leaf sitemaps
function generateGameLeafSitemap(game) {
  const urls = [makeUrlEntry(`${BASE_URL}/game/${game.gameSlug}/`, undefined, "hourly", 1.0)];
  return wrapUrlset(urls);
}

function generateGamesSitemap(games) {
  const urls = games.map(game => 
    makeUrlEntry(`${BASE_URL}/game/${game.gameSlug}/`, undefined, "hourly", 1.0)
  )
  return wrapUrlset(urls);
}


function generateCharacterSitemap(game, characterLastModById) {
  const charList = Characters[game.id].charList
  const urls = charList.map((charName) =>
    makeUrlEntry(`${BASE_URL}/game/${game.gameSlug}/char/${charName}/`, characterLastModById[charName], "hourly", 0.9)
  );
  return wrapUrlset(urls);
}

function generateTourneySitemap(game, tourneyById, tourneyLastModById) {
  const urls = Object.keys(tourneyById).map((key) => {
    const item = tourneyById[key].length > 0 ? tourneyById[key][0] : null
    const tourneySlug = getTourneySlug(item.bracketInfo) ?? "unknown"
    return makeUrlEntry(`${BASE_URL}/game/${game.gameSlug}/tournament/${tourneySlug}/`, tourneyLastModById[key], "hourly", 1.0)
  });
  return wrapUrlset(urls);
}

function generateChannelSitemap(game, channelById, channelLastModById) {
  const urls = Object.keys(channelById).map((key) =>
    makeUrlEntry(`${BASE_URL}/game/${game.gameSlug}/channel/${key}/`, channelLastModById[key], "hourly", 1.0)
  );
  return wrapUrlset(urls);
}

function generatePlayerSitemap(game, playerById, playerLastModById) {
  const urls = Object.keys(playerById).map((key) =>
    makeUrlEntry(`${BASE_URL}/game/${game.gameSlug}/player/${key}/`, playerLastModById[key], "hourly", 0.8)
  );
  return wrapUrlset(urls);
}

function generateSetSitemap(game, sets) {
  const urls = []
  sets.forEach((item) => {
    const setId = item.bracketInfo.setId
    const endTime = item.bracketInfo.endTime
    const tourneySlug = getTourneySlug(item.bracketInfo)
    const lastMod = item.bracketInfo.lastMod
    const gameSlug = game.gameSlug
    const gameName = game.name
    const gameDisplayName = game.displayName
    const player1Name = item.player1Info.nameWithRomaji
    const player2Name = item.player2Info.nameWithRomaji
    const player1Slug = item.player1Info.userSlug
    const player2Slug = item.player2Info.userSlug
    
    const fullRoundText = item.bracketInfo.fullRoundText
    const tourneyName = item.bracketInfo.tourneyName
    const channelName = getChannelName(item.streamInfo)
    const tourneyBackgroundUrl = item.bracketInfo.images[1]?.url
    const tourneyIconUrl = item.bracketInfo.images[0]?.url ?? null
    const setIcon = tourneyIconUrl || tourneyBackgroundUrl || OG_THUMB
    const setThumb = tourneyBackgroundUrl || tourneyIconUrl || OG_THUMB
    const streamIcon = item.streamInfo.streamIcon
    const startedAtIso = getIsoStr(item.bracketInfo.startedAt)
    const endedAt = item.bracketInfo.endTime ?? item.bracketInfo.endTimeDetected ?? Math.floor(Date.now()/1000)
    const duration = Math.min(endedAt-item.bracketInfo.startedAt, 60*60)
    const isoDuration = getIsoDuration(duration)
    var contentUrl = getStreamUrl(item.streamInfo, 0, true)
    if (item.streamInfo.streamSource == 'TWITCH') {
      contentUrl = null
    }
    const embedUrl = getStreamEmbedUrl(item.streamInfo, 0, true)
    const startAt = item.bracketInfo.startAt
    const endAt = item.bracketInfo.endAt
    const postalCode = item.bracketInfo.postalCode
    const venueAddress = item.bracketInfo.venueAddress
    const mapsPlaceId = item.bracketInfo.mapsPlaceId
    const countryCode = item.bracketInfo.countryCode
    const addrState = item.bracketInfo.addrState
    const city = item.bracketInfo.city
    const lat = item.bracketInfo.lat
    const lon = item.bracketInfo.lon
    const expires = getIsoStr(item.bracketInfo.startedAt + EXPIRE_SECONDS)
    const title = `${player1Name} vs ${player2Name}, ${tourneyName} - Sets on Stream`
    const description = `Watch ${player1Name} vs ${player2Name} in ${fullRoundText} of ${tourneyName}, streamed by ${channelName}`

    // <video:content_loc>
    //   ${contentUrl}
    // </video:content_loc>


    const videoInfo=`
  <video:video>
    <video:thumbnail_loc>
      ${escapeXml(setThumb)}
    </video:thumbnail_loc>
    <video:title>
      ${escapeXml(title)}
    </video:title>
    <video:description>
      ${escapeXml(description)}
    </video:description>
    <video:player_loc allow_embed="yes" autoplay="autoplay">
      ${escapeXml(embedUrl)}
    </video:player_loc>
    <video:duration>${Math.floor(duration)}</video:duration>
    <video:publication_date>${startedAtIso}</video:publication_date>
    <video:uploader>${escapeXml(channelName)}</video:uploader>
    <video:expiration_date>${expires}</video:expiration_date>
  </video:video>`
    if (endTime != null) {
      urls.push(makeUrlEntry(`${BASE_URL}/game/${game.gameSlug}/tournament/${tourneySlug}/set/${setId}/`, lastMod, "daily", 0.8, videoInfo))
    } else {
      urls.push(makeUrlEntry(`${BASE_URL}/game/${game.gameSlug}/tournament/${tourneySlug}/set/${setId}/`, lastMod, "hourly", 0.8, videoInfo))
    }
  });
  return wrapUrlset(urls, true);
}

// --- Top pages leaf sitemap (combined)
function generateTopPagesSitemap() {
  const urls = [
    makeUrlEntry(`${BASE_URL}/`, undefined, "hourly", 1.0),
    makeUrlEntry(`${BASE_URL}/about/`, undefined, "monthly", 0.3)
  ];
  return wrapUrlset(urls);
}

function decompressDataFromFetch(base64String) {
  const compressedBuffer = Buffer.from(base64String, "base64"); // still needed
  const decompressedBuffer = brotliDecompressSync(compressedBuffer);
  return decompressedBuffer.toString("utf-8");
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

function getLastMod(item) {
  var lastMod = item.bracketInfo.startedAt
  if (item.bracketInfo.endTimeDetected) {
    lastMod = item.bracketInfo.endTimeDetected
  }
  return lastMod
}

async function main() {
  console.log("DIRS", DIST_DIR, SITEMAP_DIR, process.cwd())
  console.log("Fetching Firebase data...");
  const dataArchivePath = path.join(DATA_DIR, "dataArchive.json.br")
  // Replace with your Firebase export endpoint or bot output
  // const res = await fetch("https://your-firebase-url/data.json");
  const res = await fetch("https://firestore.googleapis.com/v1/projects/setsonstream1/databases/\(default\)/documents/data1/allInfo2")
  const result = await res.json()
  
  const data = JSON.parse(decompressDataFromFetch(result.fields.info.bytesValue));
  if (data == null) {
    data = {}
  }

  var dataArchive = readBrotliFile(dataArchivePath)
  processData(dataArchive, true)
  // var dataArchive = JSON.parse(readFile(dataArchivePath))
  // if (dataArchive == null) {
  //   dataArchive = {}
  // }

  processData(data)
  updateHistoricalData(dataArchive, data)
  writeBrotliFile(dataArchivePath, JSON.stringify(dataArchive));
}

function updateHistoricalData(dataArchive, data) {
  Object.keys(data).forEach((key1) => {
    if (dataArchive[key1] == null) {
      dataArchive[key1] = {combined: []}
    }
    const combinedMap = new Map();
    dataArchive[key1].combined.forEach(item => combinedMap.set(item.bracketInfo.setKey, item))
    data[key1].combined.forEach(item => combinedMap.set(item.bracketInfo.setKey, item))
    const combinedArr = Array.from(combinedMap.values())
    combinedArr.sort((a,b) => {
      return compareIntegers(a.bracketInfo.startedAt, b.bracketInfo.startedAt) * -1
    })
    dataArchive[key1].combined = combinedArr
  })
}

async function processData(data, forExpired=false) {
  Object.keys(data).forEach((key1) => {
    Object.keys(data[key1]).forEach((key2) => {
      data[key1][key2].forEach(item => {
        item.bracketInfo.setKey = `${item.bracketInfo.setId}`
        item.bracketInfo.lastMod = getLastMod(item)
      })
    })
  })
  //merge live and vod
  const liveSet = {}
  const tournments = {}
  const gameSubCats = {}
  Object.keys(data).forEach((key1) => {
    const combined = []
    const gameVids = data[key1]
    
    if (!forExpired) {
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
    }

    var tourneyById = {}
    var playerById = {}
    var channelById = {}
    var characterById = {}
    var tourneyLastModById = {}
    var playerLastModById = {}
    var channelLastModById = {}
    var characterLastModById = {}
    // var characterLastModById = {}
    gameVids.combined.forEach(item => {
      var key = item.bracketInfo.tourneyId
      var arr = tourneyById[key]
      if (arr == undefined) {
        arr = []
      }
      arr.push(item)
      tourneyById[key] = arr
      if (item.bracketInfo.lastMod > (tourneyLastModById[key] ?? 0)) {
        tourneyLastModById[key] = item.bracketInfo.lastMod
      }

      var key = item.player1Info.userSlug
      if (key) {
        var arr = playerById[key]
        if (arr == undefined) {
          arr = []
        }
        arr.push(item)
        playerById[key] = arr
      }
      if (item.bracketInfo.lastMod > (playerLastModById[key] ?? 0)) {
        playerLastModById[key] = item.bracketInfo.lastMod
      }

      var key = item.player2Info.userSlug
      if (key) {
        var arr = playerById[key]
        if (arr == undefined) {
          arr = []
        }
        arr.push(item)
        playerById[key] = arr
      } 
      if (item.bracketInfo.lastMod > (playerLastModById[key] ?? 0)) {
        playerLastModById[key] = item.bracketInfo.lastMod
      }

      const channelName = getChannelName(item.streamInfo)
      var key = channelName
      if (key != null) {
        var arr = channelById[key]
        if (arr == undefined) {
          arr = []
        }
        arr.push(item)
        channelById[key] = arr
        if (item.bracketInfo.lastMod > (channelLastModById[key] ?? 0)) {
          channelLastModById[key] = item.bracketInfo.lastMod
        }
      }


      const charNames1 = item.player1Info.charInfo.map(item => item.name).filter(name => name.length > 0)
      const charNames2 = item.player2Info.charInfo.map(item => item.name).filter(name => name.length > 0)
      const charNamesCombined = [...charNames1]
      charNames2.forEach(charName => {
        if (!charNames1.includes(charName)) {
          charNamesCombined.push(charNames2)
        }
      })

      charNamesCombined.forEach(charName => {
        var key = charName
        if (key != null && key.length > 0) {
          var arr = characterById[key]
          if (arr == undefined) {
            arr = []
          }
          arr.push(item)
          characterById[key] = arr
          if (item.bracketInfo.lastMod > (characterLastModById[key] ?? 0)) {
            characterLastModById[key] = item.bracketInfo.lastMod
          }
        }
      })

      gameSubCats[key1] = {tourneyById, playerById, channelById, characterById, tourneyLastModById, playerLastModById, channelLastModById, characterLastModById }  
    })
  })
  
  
  
  // Data shape: { games: [{ id, name, characters: [{ id, name }] }] }
  // const { games } = data;

  ensureDir(DIST_DIR);

  // === Generate game + character sitemaps ===
  const templatePath = "build/index.html";
  const includeCharactersForGames = ["super-smash-bros-ultimate", "rivals-of-aether-ii", "guilty-gear-strive", "super-smash-bros-melee", "tekken-8"]
  const games = VideoGameInfo
  var keywords = GameKeywords["1386"]
  var jsonLd = generateJsonLdAbout({})
  writeFile(
    path.join(DIST_DIR, "about", "index.html"),
    generatePage({
      templatePath,
      title: `About - Sets on Stream`,
      description: `Watch live and recent matches from fighting game tournaments: Smash Ultimate, SF6, Rivals 2, Tekken 8, and more.`,
      keywords: keywords,
      // jsonLd,
    })
  );

  for (const gameInfo of games) {
    const gameDir = path.join(DIST_DIR, "game", gameInfo.gameSlug);
    // Game page
    const hasCharPages = includeCharactersForGames.includes(gameInfo.gameSlug)
    var keywords = GameKeywords["1386"]
    const gameId = gameInfo.id
    if (gameId != null) {
      keywords = GameKeywords[gameId] ?? ""
    }
    const videoObjectSummaryCache = {}
    const combined = data[gameInfo.id].combined
    const {tourneyById, playerById, channelById, characterById, tourneyLastModById, playerLastModById, channelLastModById, characterLastModById } = gameSubCats[gameInfo.id]

    combined.forEach(item => {
      const setId = item.bracketInfo.setId
      const tourneySlug = getTourneySlug(item.bracketInfo)
      const shortSlug = item.bracketInfo
      const tourneyIcon = item.bracketInfo.images[0]?.url ?? null
      const streamIcon = item.streamInfo.streamIcon
      const gameSlug = gameInfo.gameSlug
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
      const title = `${player1Name} vs ${player2Name}, ${tourneyName} - Sets on Stream`
      const description = `Watch ${player1Name} vs ${player2Name} in ${fullRoundText} of ${tourneyName}, streamed by ${channelName}`
      const setKeywords = `${player1Name}, ${player2Name} ${player1Slug}, ${player2Slug}, ${tourneyName}, ${tourneySlug}, ${channelName}, ${setId}, ${charKeywordStrs}${keywords}`
      const bootstrapRouteInfo = {
        set: item,
        tourneySlug,
        shortSlug,
        tourneyIcon,
        tourneyName,
        channelName,
        streamIcon,
        // player1Name,
        // player2Name,
        // player1Slug,
        // player2Slug,
        setId,
        charKeywordStrs,
      }
      const embedUrl = getStreamEmbedUrl(item.streamInfo, 0, true)
      const contentUrl = getStreamUrl(item.streamInfo, 0, true)
      const tourneyBackgroundUrl = item.bracketInfo.images[1]?.url
      const tourneyIconUrl = item.bracketInfo.images[0]?.url ?? null
      const setIcon = tourneyIconUrl || tourneyBackgroundUrl || OG_THUMB
      const setThumb = tourneyBackgroundUrl || tourneyIconUrl || OG_THUMB
      const ogVideoThumb = setThumb
      const ogVideoUrl = embedUrl

      // var url = `https://setsonstream.tv/game/${gameSlug}/set/${setId}/`
      // var jsonLd = generateJsonLdSet({item, gameInfo, url})
      // title: `${item.bracketInfo.tourneyName} - Sets on Stream`,
      // description: `Watch Live and Recent ${gameInfo?.name} Sets on Stream happening at Tournament ${item.bracketInfo.tourneyName}`,
      var url = `https://setsonstream.tv/game/${gameSlug}/tournament/${tourneySlug}/set/${setId}/`
      jsonLd = generateJsonLdSet({item, gameInfo, url, videoObjectSummaryCache})
      const canonical = `https://setsonstream.tv/game/${gameSlug}/tournament/${tourneySlug}/set/${setId}/`
      writeFile(
        path.join(gameDir, "tournament", tourneySlug, "set", `${setId}`, "index.html"),
        generatePage({
          templatePath,
          title, 
          description,
          keywords: setKeywords,
          bootstrap: {routeInfo: bootstrapRouteInfo},
          jsonLd,
          canonical,
          ogVideoUrl,
          ogVideoThumb,
          noIndex: forExpired,
        })
      )
      url = `https://setsonstream.tv/game/${gameSlug}/channel/${channelName}/set/${setId}/`
      jsonLd = generateJsonLdSet({item, gameInfo, url, videoObjectSummaryCache})
      writeFile(
        path.join(gameDir, "channel", channelName, "set", `${setId}`, "index.html"),
        generatePage({
          templatePath,
          title, 
          description,
          keywords: setKeywords,
          bootstrap: {routeInfo: bootstrapRouteInfo},
          jsonLd,
          canonical,
          ogVideoUrl,
          ogVideoThumb,
          noIndex: forExpired,
        })
      )
      if (player1Slug != null) {
        url = `https://setsonstream.tv/game/${gameSlug}/player/${player1Slug}/set/${setId}/`
        jsonLd = generateJsonLdSet({item, gameInfo, url, videoObjectSummaryCache})
        writeFile(
          path.join(gameDir, "player", player1Slug, "set", `${setId}`, "index.html"),
          generatePage({
            templatePath,
            title, 
            description,
            keywords: setKeywords,
            bootstrap: {routeInfo: {...bootstrapRouteInfo, userSlug: player1Slug, charInfo: item.player1Info.charInfo, nameWithRomaji: player2Name}},
            jsonLd,
            canonical,
            ogVideoUrl,
            ogVideoThumb, 
            noIndex: forExpired,
          })
        )
      }
      if (player2Slug != null) {
        url = `https://setsonstream.tv/game/${gameSlug}/player/${player2Slug}/set/${setId}/`
        jsonLd = generateJsonLdSet({item, gameInfo, url, videoObjectSummaryCache})
        writeFile(
          path.join(gameDir, "player", player2Slug, "set", `${setId}`, "index.html"),
          generatePage({
            templatePath,
            title, 
            description,
            keywords: setKeywords,
            bootstrap: {routeInfo: {...bootstrapRouteInfo, userSlug: player2Slug, charInfo: item.player2Info.charInfo, nameWithRomaji: player2Name}},
            jsonLd,
            canonical,
            ogVideoUrl,
            ogVideoThumb, 
            noIndex: forExpired,
          })
        )
      }
      url = `https://setsonstream.tv/game/${gameSlug}/set/${setId}/`
      jsonLd = generateJsonLdSet({item, gameInfo, url, videoObjectSummaryCache})
      writeFile(
        path.join(gameDir, "set", `${setId}`, "index.html"),
        generatePage({
          templatePath,
          title, 
          description,
          keywords: setKeywords,
          bootstrap: {routeInfo: bootstrapRouteInfo},
          jsonLd,
          canonical,
          ogVideoUrl,
          ogVideoThumb, 
          noIndex: forExpired,
        })
      )
      charNames.forEach(charName => {
        url = `https://setsonstream.tv/game/${gameSlug}/char/${charName}/set/${setId}/`
        jsonLd = generateJsonLdSet({item, gameInfo, url, videoObjectSummaryCache})
        writeFile(
          path.join(gameDir, "char", charName, "set", `${setId}`, "index.html"),
          generatePage({
            templatePath,
            title, 
            description,
            keywords: setKeywords,
            bootstrap: {routeInfo: bootstrapRouteInfo},
            jsonLd,
            canonical,
            ogVideoUrl,
            ogVideoThumb,
            noIndex: forExpired,
          })
        )
      })
    })

    if(true) {
      const items = combined
      const item = items.length > 0 ? items[0] : null
      const url = `https://setsonstream.tv/game/${gameInfo.gameSlug}/`
      const jsonLd = generateJsonLdGame({item, items, url, gameInfo, videoObjectSummaryCache})

      writeFile(
        path.join(gameDir, "index.html"),
        generatePage({
          templatePath,
          title: `${gameInfo.displayName} - Sets on Stream`,
          description: `Watch Live and Recent ${gameInfo?.name} Sets on Stream from Tournaments around the World`,
          keywords: GameKeywords[gameInfo.id],
          jsonLd,
        })
      );
    }

    if (hasCharPages) {
      const charList = Characters[gameInfo.id].charList
      for (const charName of charList) {
        const items = characterById[charName]
        const item = (items && items.length > 0) ? items[0] : null
        const url = `https://setsonstream.tv/game/${gameInfo.gameSlug}/char/${charName}/`
        const jsonLd = generateJsonLdCharacter({item, items, url, charName, gameInfo, videoObjectSummaryCache})
        
        writeFile(
          path.join(gameDir, "char", charName, "index.html"),
          generatePage({
            templatePath,
            title: `${charName} - Sets on Stream`,
            description: `Watch Live and Recent ${gameInfo?.name} ${charName} Sets on Stream from Tournaments around the World`,
            keywords: charName + ", " + GameKeywords[gameInfo.id],
            jsonLd,
          })
        )
      }
    }
    
    Object.keys(tourneyById).forEach(key => {
      const items = tourneyById[key]
      const item = items.length > 0 ? items[0] : null
      const lastMod = tourneyLastModById[key]
      if (item != null) {
        const tourneySlug = getTourneySlug(item.bracketInfo)
        const tourneyIcon = item.bracketInfo.images[0]?.url ?? null
        const bootstrap = {routeInfo: {
          tourneySlug,
          tourneyIcon,
          tourneyName: item.bracketInfo.tourneyName,
        }}
        var url = `https://setsonstream.tv/game/${gameInfo.gameSlug}/tournament/${tourneySlug}/`
        const jsonLd = generateJsonLdTournament({item, items, gameInfo, url, videoObjectSummaryCache})
        writeFile(
          path.join(gameDir, "tournament", tourneySlug, "index.html"),
          generatePage({
            templatePath,
            title: `${item.bracketInfo.tourneyName} - Sets on Stream`,
            description: `Watch Live and Recent ${gameInfo?.name} Sets on Stream happening at Tournament ${item.bracketInfo.tourneyName}`,
            keywords: `${item.bracketInfo.tourneyName}, ${key}, ${tourneySlug}, ${keywords}`,
            bootstrap,
            jsonLd,
            noIndex: forExpired,
          })
        )
      }
    })
    Object.keys(channelById).forEach(key => {
      const items = channelById[key]
      const item = items.length > 0 ? items[0] : null
      const lastMod = channelLastModById[key]
      if (item != null) {
        const channelName = getChannelName(item.streamInfo)
        const bootstrap = {routeInfo: {
          streamIcon: item.streamInfo.streamIcon,
          channelName,
        }}
        var url = `https://setsonstream.tv/game/${gameInfo.gameSlug}/channel/${channelName}/`
        const jsonLd = generateJsonLdChannel({item, items, url, gameInfo, videoObjectSummaryCache})
        writeFile(
          path.join(gameDir, "channel", key, "index.html"),
          generatePage({
            templatePath,
            title: `${key} - Sets on Stream`,
            description: `Watch Live and Recent ${gameInfo?.name} Sets on Stream streaming on ${key}`,
            keywords: `${key}, ${getTourneySlug(item?.bracketInfo)}, ${keywords}`,
            bootstrap,
            jsonLd,
          })
        )
      }
    })
    Object.keys(playerById).forEach(key => {
      const userSlug = key
      const items = playerById[key]
      const item = items.length > 0 ? items[0] : null
      const lastMod = playerLastModById[key]
      if (item != null) {
        const playerInfo = (item.player1Info.userSlug == key) ? item.player1Info : item.player2Info
        const nameWithRomaji = playerInfo.nameWithRomaji
        const bootstrap = {routeInfo: {
          nameWithRomaji: playerInfo.nameWithRomaji,
          charInfo: playerInfo.charInfo,
          userSlug: playerInfo.userSlug,
        }}
        var url = `https://setsonstream.tv/game/${gameInfo.gameSlug}/player/${userSlug}/`
        const jsonLd = generateJsonLdPlayer({item, items, playerInfo, url, gameInfo, videoObjectSummaryCache})
        writeFile(
          path.join(gameDir, "player", key, "index.html"),
          generatePage({
            templatePath,
            title: `${nameWithRomaji} - Sets on Stream`,
            description: `Watch ${nameWithRomaji}'s Live and Recent ${gameInfo?.name} Sets on Stream from Tournaments`,
            keywords: `${nameWithRomaji}, ${key}, ${keywords}`,
            bootstrap,
            jsonLd,
          })
        )
      }
    })
  }
  
  // for (const game of games) {
  //   const gameDir = path.join(DIST_DIR, "game", game.id);
  //   const gameUrl = `/game/${game.id}`;

  //   // Game page
  //   writeFile(
  //     path.join(gameDir, "index.html"),
  //     renderPage({
  //       title: `${game.name} - Sets on Stream`,
  //       description: `Watch recent sets for ${game.name}`
  //     })
  //   );

  //   // Characters
  //   let charUrls = [];
  //   for (const char of game.characters) {
  //     const charDir = path.join(gameDir, "char", char.id);
  //     const charUrl = `${gameUrl}/char/${char.id}`;
  //     charUrls.push(charUrl);

  //     writeFile(
  //       path.join(charDir, "index.html"),
  //       renderPage({
  //         title: `${char.name} (${game.name}) - Sets on Stream`,
  //         description: `Watch ${char.name} matches in ${game.name}`
  //       })
  //     );
  //   }

  if (!forExpired) {
    writeFile(
      path.join(SITEMAP_DIR, "sitemap.xml"),
      generateMainSitemap(games, includeCharactersForGames)
    );
    writeFile(
      path.join(SITEMAP_DIR, "sitemap-top.xml"),
      generateTopPagesSitemap()
    );
    writeFile(
      path.join(SITEMAP_DIR, `sitemap-games.xml`),
      generateGamesSitemap(games)
    )

    games.forEach((game) => {
      const hasCharPages = includeCharactersForGames.includes(game.gameSlug)
      // writeFile(
      //   path.join(SITEMAP_DIR, `sitemap-game-${game.gameSlug}.xml`),
      //   generateGameSitemap(game, hasCharPages)
      // )
      // writeFile(
      //   path.join(SITEMAP_DIR, `sitemap-game-${game.gameSlug}.xml`),
      //   generateGameLeafSitemap(game)
      // )
      const {tourneyById, playerById, channelById, tourneyLastModById, playerLastModById, channelLastModById, characterLastModById } = gameSubCats[game.id]
      if (hasCharPages) {
        writeFile(
          path.join(SITEMAP_DIR, `sitemap-game-${game.gameSlug}-characters.xml`),
          generateCharacterSitemap(game, characterLastModById)
        )
      }
      writeFile(
        path.join(SITEMAP_DIR, `sitemap-game-${game.gameSlug}-tournaments.xml`),
        generateTourneySitemap(game, tourneyById, tourneyLastModById)
      )
      writeFile(
        path.join(SITEMAP_DIR, `sitemap-game-${game.gameSlug}-channels.xml`),
        generateChannelSitemap(game, channelById, channelLastModById)
      )
      writeFile(
        path.join(SITEMAP_DIR, `sitemap-game-${game.gameSlug}-players.xml`),
        generatePlayerSitemap(game, playerById, playerLastModById)
      )
      writeFile(
        path.join(SITEMAP_DIR, `sitemap-game-${game.gameSlug}-sets.xml`),
        generateSetSitemap(game, data[game.id].combined)
      )
    })
    console.log("Generation complete.");
  }
}

function generateJsonLdSet({item, gameInfo, url, videoObjectSummaryCache}) {
  const setId = item.bracketInfo.setId
  const tourneySlug = getTourneySlug(item.bracketInfo)
  const gameSlug = gameInfo.gameSlug
  const gameName = gameInfo.name
  const gameDisplayName = gameInfo.displayName
  const player1Name = item.player1Info.nameWithRomaji
  const player2Name = item.player2Info.nameWithRomaji
  const player1Slug = item.player1Info.userSlug
  const player2Slug = item.player2Info.userSlug
  
  const fullRoundText = item.bracketInfo.fullRoundText
  const tourneyName = item.bracketInfo.tourneyName
  const channelName = getChannelName(item.streamInfo)
  const tourneyBackgroundUrl = item.bracketInfo.images[1]?.url
  const tourneyIconUrl = item.bracketInfo.images[0]?.url ?? null
  const setIcon = tourneyIconUrl || tourneyBackgroundUrl || OG_THUMB
  const setThumb = tourneyBackgroundUrl || tourneyIconUrl || OG_THUMB
  const streamIcon = item.streamInfo.streamIcon
  const startedAtIso = getIsoStr(item.bracketInfo.startedAt)
  const endedAt = item.bracketInfo.endTime ?? item.bracketInfo.endTimeDetected ?? Math.floor(Date.now()/1000)
  const duration = Math.min(endedAt-item.bracketInfo.startedAt, 60*60)
  const isoDuration = getIsoDuration(duration)
  // var contentUrl = getStreamUrl(item.streamInfo, 0, true)
  // contentUrl = null
  // if (item.streamInfo.streamSource == 'TWITCH') {
  //   contentUrl = null
  // }
  const embedUrl = getStreamEmbedUrl(item.streamInfo, 0, true)
  const locStreamUrl = getStreamUrl(item.streamInfo, 0, false)
  const startAt = item.bracketInfo.startAt
  const endAt = item.bracketInfo.endAt
  const postalCode = item.bracketInfo.postalCode
  const venueAddress = item.bracketInfo.venueAddress
  const mapsPlaceId = item.bracketInfo.mapsPlaceId
  const countryCode = item.bracketInfo.countryCode
  const addrState = item.bracketInfo.addrState
  const city = item.bracketInfo.city
  const lat = item.bracketInfo.lat
  const lon = item.bracketInfo.lon
  const expires = getIsoStr(item.bracketInfo.startedAt + EXPIRE_SECONDS)

  let viewers = 0
  const charArr1 = (item.player1Info.charInfo?.length ?? 0) > 0 ? { 
    "character": item.player1Info.charInfo.map(charItem => ({
        "@type": "VideoGameCharacter",
        "name": charItem.name,
        "url": `https://setsonstream.tv/game/${gameSlug}/char/${charItem.name}/`
      }))}
    : {}
  const charArr2 = (item.player2Info.charInfo?.length ?? 0) > 0 ? { 
    "character": item.player2Info.charInfo.map(charItem => ({
        "@type": "VideoGameCharacter",
        "name": charItem.name,
        "url": `https://setsonstream.tv/game/${gameSlug}/char/${charItem.name}/`
      }))}
    : {}

  const streamUrls = item.streamInfo.streamUrls
  if(streamUrls.length > 0 && streamUrls[0].viewerCount != null) {
    viewers = streamUrls[0].viewerCount
  }

  const viewersInfo = (viewers > 5) ? {
    "interactionStatistic": {
      "@type": "InteractionCounter",
      "interactionType": {
        "@type": "WatchAction"
      },
      "userInteractionCount": viewers,
    }
  } : {}

  if (videoObjectSummaryCache && videoObjectSummaryCache[url] == null) {
    videoObjectSummaryCache[url] = {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      "@id": url,
      "url": url,
      "embedUrl": embedUrl,
      // "@id": `https://setsonstream.tv/game/${gameSlug}/set/${setId}/`,
      "name": `${player1Name} vs ${player2Name} - ${tourneyName}, ${fullRoundText} (${gameDisplayName})`,
      "description": `Watch ${player1Name} vs ${player2Name} in ${fullRoundText} of ${tourneyName}, streamed by ${channelName}.`,
      "thumbnailUrl": [
        `${setThumb}`
      ],
      "uploadDate": `${startedAtIso}`,
      ...(endedAt && {"duration": isoDuration}),
      ...viewersInfo
    }
  }

  var isPartOf = {}

  if (![startAt, postalCode, venueAddress, countryCode, addrState, city].includes(undefined)) {
    const startDate = getIsoStr(item.bracketInfo.startAt)
    const optionalEndField = item.bracketInfo.endAt ? {"endDate": getIsoStr(item.bracketInfo.endAt)} : {}
    const eventInfo = {
      "@type": "SportsEvent",
      "@id": `https://setsonstream.tv/game/${gameSlug}/tournament/${tourneySlug}/`,
      "sport": {
        "@type": "VideoGame",
        "name": `${gameName}`,
        "alternateName": [gameDisplayName, gameSlug],          
      },
      "name": `${tourneyName}`,
      "startDate": startDate,
      ...optionalEndField,
      "location": {
          "@type": "Place",
          // "name": "San Jose Convention Center",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": venueAddress,
            "addressLocality": city,
            "addressRegion": addrState,
            "postalCode": postalCode,
            "addressCountry": countryCode,
          },
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": lat,
            "longitude": lon,
          },
          "sameAs": `https://www.google.com/maps/place/?q=place_id:${mapsPlaceId}`
        },
      // "location": [
      //   {
      //     "@type": "VirtualLocation",
      //     "url": locStreamUrl,
      //   },
      //   {
      //     "@type": "Place",
      //     // "name": "San Jose Convention Center",
      //     "address": {
      //       "@type": "PostalAddress",
      //       "streetAddress": venueAddress,
      //       "addressLocality": city,
      //       "addressRegion": addrState,
      //       "postalCode": postalCode,
      //       "addressCountry": countryCode,
      //     },
      //     "geo": {
      //       "@type": "GeoCoordinates",
      //       "latitude": lat,
      //       "longitude": lon,
      //     },
      //     "sameAs": `https://www.google.com/maps/place/?q=place_id:${mapsPlaceId}`
      //   },
      // ],
      "organizer": {
        "@type": "Organization",
        "name": channelName,
        "url": `https://setsonstream.tv/game/${gameSlug}/channel/${channelName}/`,
        ...(streamIcon && {"logo": {
          "@type": "ImageObject",
          "url": streamIcon,
          // "width": 600,
          // "height": 60
        }})
      },
    }
    isPartOf = {"isPartOf": eventInfo}
  }
  

  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "@id": url,
    "url": url,
    // "@id": `https://setsonstream.tv/game/${gameSlug}/set/${setId}/`,
    "name": `${player1Name} vs ${player2Name} - ${tourneyName}, ${fullRoundText} (${gameDisplayName})`,
    "description": `Watch ${player1Name} vs ${player2Name} in ${fullRoundText} of ${tourneyName}, streamed by ${channelName}.`,
    "thumbnailUrl": [
      `${setThumb}`
    ],
    "uploadDate": `${startedAtIso}`,
    ...(endedAt && {"duration": isoDuration}),  
    // ...(contentUrl && {"contentUrl": contentUrl}),  
    "embedUrl": embedUrl,
    "expires": expires,
    ...viewersInfo,
    "publisher": {
      "@type": "Organization",
      "name": `${channelName}`,
      ...(streamIcon && {"logo": {
        "@type": "ImageObject",
        "url": streamIcon,
        // "width": 600,
        // "height": 60
      }})
    },
    // "inLanguage": "en",
    ...isPartOf,
    "competitor": [
      {
        "@type": "Person",
        "@id": `https://setsonstream.tv/game/${gameSlug}/player/${player1Slug}/`,
        "name": `${player1Name}`,
        ...charArr1,
      },
      {
        "@type": "Person",
        "@id": `https://setsonstream.tv/game/${gameSlug}/player/${player2Slug}/`,
        "name": `${player2Name}`,
        ...charArr2,
      },
    ]
  }
}


function generateJsonLdTournament({item, items, gameInfo, url, videoObjectSummaryCache}) {
  const setId = item.bracketInfo.setId
  const tourneySlug = getTourneySlug(item.bracketInfo)
  const gameSlug = gameInfo.gameSlug
  const gameName = gameInfo.name
  const gameDisplayName = gameInfo.displayName
  const player1Name = item.player1Info.nameWithRomaji
  const player2Name = item.player2Info.nameWithRomaji
  const player1Slug = item.player1Info.userSlug
  const player2Slug = item.player2Info.userSlug
  const fullRoundText = item.bracketInfo.fullRoundText
  const tourneyName = item.bracketInfo.tourneyName
  const channelName = getChannelName(item.streamInfo)
  const tourneyBackgroundUrl = item.bracketInfo.images[1]?.url
  const tourneyIconUrl = item.bracketInfo.images[0]?.url ?? null
  const setIcon = tourneyIconUrl || tourneyBackgroundUrl || OG_THUMB
  const setThumb = tourneyBackgroundUrl || tourneyIconUrl || OG_THUMB
  const streamIcon = item.streamInfo.streamIcon
  const startedAtIso = getIsoStr(item.bracketInfo.startedAt)
  const endedAt = item.bracketInfo.endTime ?? item.bracketInfo.endTimeDetected ?? Math.floor(Date.now()/1000)
  const duration = Math.min(endedAt-item.bracketInfo.startedAt, 60*60)
  const isoDuration = getIsoDuration(duration)
  const contentUrl = getStreamUrl(item.streamInfo, 0, true)
  const embedUrl = getStreamEmbedUrl(item.streamInfo, 0, true)
  const startAt = item.bracketInfo.startAt
  const endAt = item.bracketInfo.endAt
  const postalCode = item.bracketInfo.postalCode
  const venueAddress = item.bracketInfo.venueAddress
  const mapsPlaceId = item.bracketInfo.mapsPlaceId
  const countryCode = item.bracketInfo.countryCode
  const addrState = item.bracketInfo.addrState
  const city = item.bracketInfo.city
  const locStreamUrl = getStreamUrl(item.streamInfo, 0, false)
  const lat = item.bracketInfo.lat
  const lon = item.bracketInfo.lon

  if ([startAt, postalCode, venueAddress, countryCode, addrState, city].includes(undefined)) {
    return undefined
  }
    // console.log ("[startAt, postalCode, venueAddress, countryCode, addrState, city]", [startAt, postalCode, venueAddress, countryCode, addrState, city])

  const startDate = getIsoStr(item.bracketInfo.startAt)
  const optionalEndField = item.bracketInfo.endAt ? {"endDate": getIsoStr(item.bracketInfo.endAt)} : {}

  const setItemList = items && items.slice(0, NUM_SETS_PER).map((it, index) => ({
    ...(videoObjectSummaryCache[`https://setsonstream.tv/game/${gameSlug}/tournament/${tourneySlug}/set/${it.bracketInfo.setKey}/`]),
    "position": index,
  }))

  const itemList = (item != null) ? {
      "hasPart": {
        "@type": "ItemList",
        "name": `${tourneyName} Matches`,
        "itemListOrder": "MostRecent",
        "itemListElement": setItemList,
      }
    } : {}


  return {
    "@context": "https://schema.org",
    // "@graph": [
    //   {
        "@type": "SportsEvent",
        "@id": `${url}`,
        "sport": {
          "@type": "VideoGame",
          "name": `${gameName}`,
          "alternateName": [gameDisplayName, gameSlug],          
        },
        "additionalType": "https://schema.org/EventSeries",
        "name": `${tourneyName}`,
        "startDate": startDate,
        ...optionalEndField,
        // "eventStatus": "https://schema.org/EventCompleted",
        // "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
        "url": `${url}`,
        "location": {
            "@type": "Place",
            // "name": "San Jose Convention Center",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": venueAddress,
              "addressLocality": city,
              "addressRegion": addrState,
              "postalCode": postalCode,
              "addressCountry": countryCode,
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": lat,
              "longitude": lon,
            },
            "sameAs": `https://www.google.com/maps/place/?q=place_id:${mapsPlaceId}`
            // "sameAs": "https://www.google.com/maps/place/?q=place_id:ChIJdQyNuLDMj4AR95YdatCk6F4"
          },
        // "location": [
        //   {
        //     "@type": "VirtualLocation",
        //     "url": locStreamUrl,
        //   },
        //   {
        //     "@type": "Place",
        //     // "name": "San Jose Convention Center",
        //     "address": {
        //       "@type": "PostalAddress",
        //       "streetAddress": venueAddress,
        //       "addressLocality": city,
        //       "addressRegion": addrState,
        //       "postalCode": postalCode,
        //       "addressCountry": countryCode,
        //     },
        //     "geo": {
        //       "@type": "GeoCoordinates",
        //       "latitude": lat,
        //       "longitude": lon,
        //     },
        //     "sameAs": `https://www.google.com/maps/place/?q=place_id:${mapsPlaceId}`
        //     // "sameAs": "https://www.google.com/maps/place/?q=place_id:ChIJdQyNuLDMj4AR95YdatCk6F4"
        //   },
        // ],
        // "performer": [
        //   {
        //     "@type": "Person",
        //     "name": "MKLeo",
        //     "url": "https://setsonstream.tv/game/smashultimate/player/mkleo"
        //   },
        //   {
        //     "@type": "Person",
        //     "name": "Sparg0",
        //     "url": "https://setsonstream.tv/game/smashultimate/player/sparg0"
        //   }
        // ],
        "organizer": {
          "@type": "Organization",
          "name": channelName,
          "url": `https://setsonstream.tv/game/${gameSlug}/channel/${channelName}/`,
          ...(streamIcon && {"logo": {
            "@type": "ImageObject",
            "url": streamIcon,
            // "width": 600,
            // "height": 60
          }})
        },
        ...itemList,
      }
      // {
      //   "@type": "ItemList",
      //   "name": "Genesis 9 Matches",
      //   "itemListOrder": "https://schema.org/ItemListOrderAscending",
      //   "numberOfItems": 3,
      //   "itemListElement": [
      //     {
      //       "@type": "ListItem",
      //       "position": 1,
      //       "url": "https://setsonstream.tv/game/smashultimate/set/12345"
      //     },
      //     {
      //       "@type": "ListItem",
      //       "position": 2,
      //       "url": "https://setsonstream.tv/game/smashultimate/set/12346"
      //     },
      //     {
      //       "@type": "ListItem",
      //       "position": 3,
      //       "url": "https://setsonstream.tv/game/smashultimate/set/12347"
      //     }
      //   ]
      // }
    // ]
}

function generateJsonLdPlayer({item, playerInfo, gameInfo, url, items, videoObjectSummaryCache}) {
  const setId = item.bracketInfo.setId
  const tourneySlug = getTourneySlug(item.bracketInfo)
  const gameSlug = gameInfo.gameSlug
  const gameName = gameInfo.name
  const gameDisplayName = gameInfo.displayName
  const playerName = playerInfo.nameWithRomaji
  const userSlug = playerInfo.userSlug
  const fullRoundText = item.bracketInfo.fullRoundText
  const tourneyName = item.bracketInfo.tourneyName
  const channelName = getChannelName(item.streamInfo)
  const tourneyBackgroundUrl = item.bracketInfo.images[1]?.url
  const tourneyIconUrl = item.bracketInfo.images[0]?.url ?? null
  const setIcon = tourneyIconUrl || tourneyBackgroundUrl || OG_THUMB
  const setThumb = tourneyBackgroundUrl || tourneyIconUrl || OG_THUMB
  const streamIcon = item.streamInfo.streamIcon
  const startedAtIso = getIsoStr(item.bracketInfo.startedAt)
  const endedAt = item.bracketInfo.endTime ?? item.bracketInfo.endTimeDetected ?? Math.floor(Date.now()/1000)
  const duration = Math.min(endedAt-item.bracketInfo.startedAt, 60*60)
  const isoDuration = getIsoDuration(duration)
  var contentUrl = getStreamUrl(item.streamInfo, 0, true)
  if (item.streamInfo.streamSource == 'TWITCH') {
    contentUrl = null
  }
  const embedUrl = getStreamEmbedUrl(item.streamInfo, 0, true)
  const locStreamUrl = getStreamUrl(item.streamInfo, 0, false)
  const startAt = item.bracketInfo.startAt
  const endAt = item.bracketInfo.endAt
  const postalCode = item.bracketInfo.postalCode
  const venueAddress = item.bracketInfo.venueAddress
  const mapsPlaceId = item.bracketInfo.mapsPlaceId
  const countryCode = item.bracketInfo.countryCode
  const addrState = item.bracketInfo.addrState
  const city = item.bracketInfo.city
  const lat = item.bracketInfo.lat
  const lon = item.bracketInfo.lon
  const expires = getIsoStr(item.bracketInfo.startedAt + EXPIRE_SECONDS)
  const charArr = (playerInfo.charInfo?.length ?? 0) > 0 ? { 
    "knowsAbout": item.player1Info.charInfo.map(charItem => ({
        "@type": "VideoGameCharacter",
        "name": charItem.name,
        "url": `https://setsonstream.tv/game/${gameSlug}/char/${charItem.name}/`
      }))}
    : {}

  // const itemListElement = (playerInfo.charInfo?.length ?? 0) > 0 ? { 
  //   "items": item.player1Info.charInfo.map(charItem => ({
  //       "@type": "VideoGameCharacter",
  //       "name": charItem.name,
  //       "url": `https://setsonstream.tv/char/${charItem.name}`
  //     }))}
  //   : {}

  // const itemList = items.map(it => ({
  //     "@type": "VideoObject",
  //     "@id": `https://setsonstream.tv/game/${gameSlug}/set/${it.bracketInfo.setKey}/`,
  //     // "position": 1,
  //     // "name": "MKLeo vs Sparg0 - Genesis 9 Winners Finals"
  //   }))
  
  const setItemList = items.slice(0, NUM_SETS_PER).map((it, index) => ({
    ...(videoObjectSummaryCache[`https://setsonstream.tv/game/${gameSlug}/player/${userSlug}/set/${it.bracketInfo.setKey}/`]),
    "position": index,
    // "@type": "VideoObject",
    // "@id": `https://setsonstream.tv/game/${gameSlug}/set/${it.bracketInfo.setKey}/`,
    // "@id": `https://setsonstream.tv/game/${gameSlug}/set/${it.bracketInfo.setKey}/`,
    // "position": 1,
    // "name": "MKLeo vs Sparg0 - Genesis 9 Winners Finals"
  }))

  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": url,
    "name": playerName,
    "url": url,
    // "image": "https://setsonstream.tv/static/players/mkleo.jpg",
    "mainEntity": {
      "@type": "Person",
      "name": playerName,
      "url": url,
      ...charArr,
      "sameAs": [
        `https://start.gg/user/${userSlug}/`
      ],
      "memberOf": {
        "@type": "Thing",
        "name": `${gameName}`,
        "alternateName": [gameDisplayName, gameSlug],          
        "name": "Smash Ultimate",
        "@id": `https://setsonstream.tv/game/${gameSlug}`
      },
    },


    // "mainEntityOfPage": {
    //   "@type": "WebPage",
    //   "@id": "https://setsonstream.tv/game/smashultimate/player/mkleo"
    // },
    // "hasPart": {
    "subjectOf": {
      "@type": "ItemList",
      "name": `Recent Sets featuring ${playerName}`,
      "itemListOrder": "MostRecent",
      "itemListElement": setItemList,
      // "itemListElement": [
      //   {
      //     "@type": "VideoObject",
      //     "@id": "https://setsonstream.tv/game/smashultimate/set/12345",
      //     "position": 1,
      //     "name": "MKLeo vs Sparg0 - Genesis 9 Winners Finals"
      //   },
      //   {
      //     "@type": "VideoObject",
      //     "@id": "https://setsonstream.tv/game/smashultimate/set/12346",
      //     "position": 2,
      //     "name": "MKLeo vs Tweek - Genesis 9 Grand Finals"
      //   }
      // ]
    }
  }


  // return {
  //   "@context": "https://schema.org",
  //   "@type": "Person",
  //   "@id": url,
  //   "name": playerName,
  //   "url": url,
  //   // "image": "https://setsonstream.tv/static/players/mkleo.jpg",
  //   ...charArr,
  //   "sameAs": [
  //     `https://start.gg/user/${userSlug}/`
  //   ],
  //   "memberOf": {
  //     "@type": "Thing",
  //     "name": "Smash Ultimate",
  //     "@id": "https://setsonstream.tv/game/smashultimate/"
  //   },
  //   // "mainEntityOfPage": {
  //   //   "@type": "WebPage",
  //   //   "@id": "https://setsonstream.tv/game/smashultimate/player/mkleo"
  //   // },
  //   // "hasPart": {
  //   "subjectOf": {
  //     "@type": "ItemList",
  //     "name": `Recent Sets featuring ${playerName}`,
  //     "itemListOrder": "MostRecent",
  //     "itemListElement": setItemList,
  //     // "itemListElement": [
  //     //   {
  //     //     "@type": "VideoObject",
  //     //     "@id": "https://setsonstream.tv/game/smashultimate/set/12345",
  //     //     "position": 1,
  //     //     "name": "MKLeo vs Sparg0 - Genesis 9 Winners Finals"
  //     //   },
  //     //   {
  //     //     "@type": "VideoObject",
  //     //     "@id": "https://setsonstream.tv/game/smashultimate/set/12346",
  //     //     "position": 2,
  //     //     "name": "MKLeo vs Tweek - Genesis 9 Grand Finals"
  //     //   }
  //     // ]
  //   }
  // }
}

function generateJsonLdChannel({item, gameInfo, url, items, videoObjectSummaryCache}) {
  const setId = item.bracketInfo.setId
  const tourneySlug = getTourneySlug(item.bracketInfo)
  const gameSlug = gameInfo.gameSlug
  const gameName = gameInfo.name
  const gameDisplayName = gameInfo.displayName
  const fullRoundText = item.bracketInfo.fullRoundText
  const channelName = getChannelName(item.streamInfo)
  const channelUrl = getChannelUrl(item.streamInfo)
  const tourneyBackgroundUrl = item.bracketInfo.images[1]?.url
  const tourneyIconUrl = item.bracketInfo.images[0]?.url ?? null
  const setIcon = tourneyIconUrl || tourneyBackgroundUrl || OG_THUMB
  const setThumb = tourneyBackgroundUrl || tourneyIconUrl || OG_THUMB
  const streamIcon = item.streamInfo.streamIcon
  const startedAtIso = getIsoStr(item.bracketInfo.startedAt)
  const endedAt = item.bracketInfo.endTime ?? item.bracketInfo.endTimeDetected ?? Math.floor(Date.now()/1000)
  const duration = Math.min(endedAt-item.bracketInfo.startedAt, 60*60)
  const isoDuration = getIsoDuration(duration)
  const contentUrl = getStreamUrl(item.streamInfo, 0, true)
  const embedUrl = getStreamEmbedUrl(item.streamInfo, 0, true)
  const startAt = item.bracketInfo.startAt
  const endAt = item.bracketInfo.endAt
  const postalCode = item.bracketInfo.postalCode
  const venueAddress = item.bracketInfo.venueAddress
  const mapsPlaceId = item.bracketInfo.mapsPlaceId
  const countryCode = item.bracketInfo.countryCode
  const addrState = item.bracketInfo.addrState
  const city = item.bracketInfo.city
  const locStreamUrl = getStreamUrl(item.streamInfo, 0, false)
  const lat = item.bracketInfo.lat
  const lon = item.bracketInfo.lon
  // const setItemList = Object.keys(items).slice(0, NUM_SETS_PER).map((key, index) => ({
  //   ...(videoObjectSummaryCache[`https://setsonstream.tv/game/${gameSlug}/channel/${channelName}/set/${items[key].bracketInfo.setKey}/`]),
  //   "position": index,
  // }))
  const setItemList = items.slice(0, NUM_SETS_PER).map((it, index) => ({
    ...(videoObjectSummaryCache[`https://setsonstream.tv/game/${gameSlug}/channel/${channelName}/set/${it.bracketInfo.setKey}/`]),
    "position": index,
  }))


  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": url,
    "name": channelName,
    "url": url,
    ...(streamIcon? {"logo": {
      "@type": "ImageObject",
      "url": streamIcon,
    }} : {}),
    "sameAs": [
      channelUrl,
    ],
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url
    },
    "hasPart": {
      "@type": "ItemList",
      "name": `Recent Sets streamed by ${channelName}`,
      "itemListOrder": "MostRecent",
      "itemListElement": setItemList,
    }
  }
}

function generateJsonLdGame({item, gameInfo, url, items, videoObjectSummaryCache}) {
  const setId = item.bracketInfo.setId
  const tourneySlug = getTourneySlug(item.bracketInfo)
  const gameSlug = gameInfo.gameSlug
  const gameName = gameInfo.name
  const publisher = GamePublishers[gameInfo.id]
  const publisherName = publisher.name
  const publisherUrl = publisher.url
  const gameDisplayName = gameInfo.displayName
  const player1Name = item.player1Info.nameWithRomaji
  const player2Name = item.player2Info.nameWithRomaji
  const player1Slug = item.player1Info.userSlug
  const player2Slug = item.player2Info.userSlug
  const fullRoundText = item.bracketInfo.fullRoundText
  const tourneyName = item.bracketInfo.tourneyName
  const channelName = getChannelName(item.streamInfo)
  const tourneyBackgroundUrl = item.bracketInfo.images[1]?.url
  const tourneyIconUrl = item.bracketInfo.images[0]?.url ?? null
  const setIcon = tourneyIconUrl || tourneyBackgroundUrl || OG_THUMB
  const setThumb = tourneyBackgroundUrl || tourneyIconUrl || OG_THUMB
  const streamIcon = item.streamInfo.streamIcon
  const startedAtIso = getIsoStr(item.bracketInfo.startedAt)
  const endedAt = item.bracketInfo.endTime ?? item.bracketInfo.endTimeDetected ?? Math.floor(Date.now()/1000)
  const duration = Math.min(endedAt-item.bracketInfo.startedAt, 60*60)
  const isoDuration = getIsoDuration(duration)
  const contentUrl = getStreamUrl(item.streamInfo, 0, true)
  const embedUrl = getStreamEmbedUrl(item.streamInfo, 0, true)
  const startAt = item.bracketInfo.startAt
  const endAt = item.bracketInfo.endAt
  const postalCode = item.bracketInfo.postalCode
  const venueAddress = item.bracketInfo.venueAddress
  const mapsPlaceId = item.bracketInfo.mapsPlaceId
  const countryCode = item.bracketInfo.countryCode
  const addrState = item.bracketInfo.addrState
  const city = item.bracketInfo.city
  const locStreamUrl = getStreamUrl(item.streamInfo, 0, false)
  const lat = item.bracketInfo.lat
  const lon = item.bracketInfo.lon
  const gameImage = gameInfo.images.at(-1).url
  const setItemList = items.slice(0, NUM_SETS_PER).map((it, index) => ({
    ...(videoObjectSummaryCache[`https://setsonstream.tv/game/${gameSlug}/set/${it.bracketInfo.setKey}/`]),
    "position": index,
  }))

  return {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    "@id": url,
    "name": `${gameName}`,
    "alternateName": [gameDisplayName, gameSlug],          
    "url": url,
    "image": gameImage,
    "genre": "Fighting",
    "publisher": {
      "@type": "Organization",
      "name": publisherName,
      "url": publisherUrl,
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url
    },
    "hasPart": {
      "@type": "ItemList",
      "name": `Recent Sets in ${gameName}`,
      "itemListOrder": "MostRecent",
      "itemListElement": setItemList,
    }
  }
}

function generateJsonLdCharacter({item, gameInfo, charName, url, items, videoObjectSummaryCache}) {
  const gameSlug = gameInfo.gameSlug
  const gameName = gameInfo.name
  const gameDisplayName = gameInfo.displayName
  // const setItemList = Object.keys(items).slice(0, NUM_SETS_PER).map((key, index) => ({
  //   ...(videoObjectSummaryCache[`https://setsonstream.tv/game/${gameSlug}/char/${charName}/set/${items[key].bracketInfo.setKey}/`]),
  //   "position": index,
  // }))
  const setItemList = items && items.slice(0, NUM_SETS_PER).map((it, index) => ({
    ...(videoObjectSummaryCache[`https://setsonstream.tv/game/${gameSlug}/char/${charName}/set/${it.bracketInfo.setKey}/`]),
    "position": index,
  }))


  const itemList = (item != null) ? {
      "hasPart": {
        "@type": "ItemList",
        "name": `Recent Sets for ${charName} in ${gameName}`,
        "itemListOrder": "MostRecent",
        "itemListElement": setItemList,
      }
    } : {}

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": url,
    "url": url,
    "name": `${gameDisplayName} - ${charName} Character Page`,
    "description": `Watch competitive ${gameDisplayName} matches featuring ${charName}. Browse recent sets, players, and tournaments where ${charName} is played.`,
    "about": {
      "@type": "VideoGameCharacter",
      "name": charName,
      "url": url,
      "characterAttribute": {
        "@type": "Thing",
        "name": gameDisplayName
      }
    },
    "isPartOf": {
      "@type": "VideoGame",
      "name": gameDisplayName,
      "url": `https://setsonstream.tv/game/${gameSlug}/`
    },
    ...itemList,
    // "hasPart": [
    //   {
    //     "@type": "VideoObject",
    //     "@id": "https://setsonstream.tv/game/super-smash-bros-ultimate/set/12345",
    //     "name": "Player A vs Player B – Mario Match",
    //     "thumbnailUrl": "https://img.youtube.com/vi/xxxx/hqdefault.jpg",
    //     "uploadDate": "2025-09-13",
    //     "description": "Competitive set featuring Mario in Super Smash Bros. Ultimate.",
    //     "embedUrl": "https://www.youtube.com/embed/xxxx?start=1234",
    //     // "inLanguage": "en"
    //   }
      /* …more VideoObjects for other sets … */
    // ]
  }
}

function generateJsonLdAbout({}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Sets on Stream",
    "url": "https://setsonstream.tv/",
    // "logo": "https://setsonstream.tv/path/to/your/logo.png",
    // "sameAs": [
    //   "https://twitter.com/jenghi_ssb", 
    // ],
    "description": "Proprietary algorithmic aggregation of competitive fighting game tournament sets from Twitch and YouTube stream VODs."
  }

  // const gameSlug = gameInfo.gameSlug
  // const gameName = gameInfo.name
  // const gameDisplayName = gameInfo.displayName
  // // const setItemList = Object.keys(items).slice(0, NUM_SETS_PER).map((key, index) => ({
  // //   ...(videoObjectSummaryCache[`https://setsonstream.tv/game/${gameSlug}/char/${charName}/set/${items[key].bracketInfo.setKey}/`]),
  // //   "position": index,
  // // }))
  // const setItemList = items && items.slice(0, NUM_SETS_PER).map((it, index) => ({
  //   ...(videoObjectSummaryCache[`https://setsonstream.tv/game/${gameSlug}/char/${charName}/set/${it.bracketInfo.setKey}/`]),
  //   "position": index,
  // }))




  // const itemList = (item != null) ? {
  //     "hasPart": {
  //       "@type": "ItemList",
  //       "name": `Recent Sets for ${charName} in ${gameName}`,
  //       "itemListOrder": "MostRecent",
  //       "itemListElement": setItemList,
  //     }
  //   } : {}

  // return {
  //   "@context": "https://schema.org",
  //   "@type": "CollectionPage",
  //   "@id": url,
  //   "url": url,
  //   "name": `${gameDisplayName} - ${charName} Character Page`,
  //   "description": `Watch competitive ${gameDisplayName} matches featuring ${charName}. Browse recent sets, players, and tournaments where ${charName} is played.`,
  //   "about": {
  //     "@type": "VideoGameCharacter",
  //     "name": charName,
  //     "url": url,
  //     "characterAttribute": {
  //       "@type": "Thing",
  //       "name": gameDisplayName
  //     }
  //   },
  //   "isPartOf": {
  //     "@type": "VideoGame",
  //     "name": gameDisplayName,
  //     "url": `https://setsonstream.tv/game/${gameSlug}/`
  //   },
  //   ...itemList,
  //   // "hasPart": [
  //   //   {
  //   //     "@type": "VideoObject",
  //   //     "@id": "https://setsonstream.tv/game/super-smash-bros-ultimate/set/12345",
  //   //     "name": "Player A vs Player B – Mario Match",
  //   //     "thumbnailUrl": "https://img.youtube.com/vi/xxxx/hqdefault.jpg",
  //   //     "uploadDate": "2025-09-13",
  //   //     "description": "Competitive set featuring Mario in Super Smash Bros. Ultimate.",
  //   //     "embedUrl": "https://www.youtube.com/embed/xxxx?start=1234",
  //   //     // "inLanguage": "en"
  //   //   }
  //     /* …more VideoObjects for other sets … */
  //   // ]
  // }
}


function getIsoDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `PT${h ? h + 'H' : ''}${m ? m + 'M' : ''}${s ? s + 'S' : ''}`;
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});



