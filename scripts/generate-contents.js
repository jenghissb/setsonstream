// scripts/generate-content.js
import fs from "fs"
import path from "path"
import pako from 'pako';
import { VideoGameInfo, VideoGameInfoByGameSlug, GameKeywords, Characters } from "../src/GameInfo.js"
const BASE_URL = 'https://setsonstream.tv';
// const DIST_DIR = path.join(__dirname, "..", "dist-static");
// const DIST_DIR = path.join(__dirname, "..", "build");
const DIST_DIR = "build"
const SITEMAP_DIR = path.join(DIST_DIR, "sitemaps");
const NUM_SETS_PER = 10

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
      return `https://player.twitch.tv/?video=${videoId}${offsetParamText}`
    } else {
      return `https://player.twitch.tv/?channel=${streamInfo.forTheatre}`
    }
  }
}



// Helpers
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  // fs.writeFileSync(filePath, content, "utf8");
  fs.writeFileSync(filePath, content);
}

function generatePage({templatePath, title, description, keywords, bootstrap={}, jsonLd, canonical}) {
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
function makeUrlEntry(loc, lastMod = null, changefreq = "daily", priority = 0.8) {

if (lastMod != null) {
    const lastModStr = new Date(lastMod * 1000).toISOString();
    return `<url>
  <loc>${loc}</loc>
  <lastmod>${lastModStr}</lastmod>
  <changefreq>${changefreq}</changefreq>
  <priority>${priority}</priority>
</url>`;

  } else {
    return `<url>
  <loc>${loc}</loc>
  <changefreq>${changefreq}</changefreq>
  <priority>${priority}</priority>
</url>`;
  }
}

function wrapUrlset(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
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


function generateCharacterSitemap(game) {
  const charList = Characters[game.id].charList
  const urls = charList.map((charName) =>
    makeUrlEntry(`${BASE_URL}/game/${game.gameSlug}/char/${charName}/`, undefined, "hourly", 0.9)
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
    if (endTime != null) {
      urls.push(makeUrlEntry(`${BASE_URL}/game/${game.gameSlug}/tournament/${tourneySlug}/set/${setId}/`, lastMod, "daily", 0.8))
    } else {
      urls.push(makeUrlEntry(`${BASE_URL}/game/${game.gameSlug}/tournament/${tourneySlug}/set/${setId}/`, lastMod, "hourly", 0.8))
    }
  });
  return wrapUrlset(urls);
}

// --- Top pages leaf sitemap (combined)
function generateTopPagesSitemap() {
  const urls = [
    makeUrlEntry(`${BASE_URL}/`, undefined, "hourly", 1.0),
    makeUrlEntry(`${BASE_URL}/about/`, undefined, "monthly", 0.3)
  ];
  return wrapUrlset(urls);
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
  // Replace with your Firebase export endpoint or bot output
  // const res = await fetch("https://your-firebase-url/data.json");
  const res = await fetch("https://firestore.googleapis.com/v1/projects/setsonstream1/databases/\(default\)/documents/data1/allInfo")
  const result = await res.json()
  
  var data = JSON.parse(decompressDataFromFetch(result.fields.info.stringValue))
  if (data == null) {
    data = {}
  }
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

    var tourneyById = {}
    var playerById = {}
    var channelById = {}
    var tourneyLastModById = {}
    var playerLastModById = {}
    var channelLastModById = {}
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
      gameSubCats[key1] = {tourneyById, playerById, channelById, tourneyLastModById, playerLastModById, channelLastModById }  
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
  writeFile(
    path.join(DIST_DIR, "about", "index.html"),
    generatePage({
      templatePath,
      title: `About - Sets on Stream`,
      description: `Watch live and recent matches from fighting game tournaments: Smash Ultimate, SF6, Rivals 2, Tekken 8, and more.`,
      keywords: keywords,
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

    writeFile(
      path.join(gameDir, "index.html"),
      generatePage({
        templatePath,
        title: `${gameInfo.displayName} - Sets on Stream`,
        description: `Watch Live and Recent ${gameInfo?.name} Sets on Stream from Tournaments around the World`,
        keywords: GameKeywords[gameInfo.id],
        // jsonLd: getJsonLd()
      })
    );

    if (hasCharPages) {
      const charList = Characters[gameInfo.id].charList
      for (const charName of charList) {
        writeFile(
          path.join(gameDir, "char", charName, "index.html"),
          generatePage({
            templatePath,
            title: `${charName} - Sets on Stream`,
            description: `Watch Live and Recent ${gameInfo?.name} ${charName} Sets on Stream from Tournaments around the World`,
            keywords: charName + ", " + GameKeywords[gameInfo.id]
          })
        )
      }
    }
    
    const combined = data[gameInfo.id].combined
    const {tourneyById, playerById, channelById, tourneyLastModById, playerLastModById, channelLastModById } = gameSubCats[gameInfo.id]
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
        // var url = `https://setsonstream.tv/game/${gameInfo.gameSlug}/tournament/${tourneySlug}/`
        // const jsonLd = generateJsonLdTournament({item, gameInfo, url})
        writeFile(
          path.join(gameDir, "tournament", tourneySlug, "index.html"),
          generatePage({
            templatePath,
            title: `${item.bracketInfo.tourneyName} - Sets on Stream`,
            description: `Watch Live and Recent ${gameInfo?.name} Sets on Stream happening at Tournament ${item.bracketInfo.tourneyName}`,
            keywords: `${item.bracketInfo.tourneyName}, ${key}, ${tourneySlug}, ${keywords}`,
            bootstrap,
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
        writeFile(
          path.join(gameDir, "channel", key, "index.html"),
          generatePage({
            templatePath,
            title: `${key} - Sets on Stream`,
            description: `Watch Live and Recent ${gameInfo?.name} Sets on Stream streaming on ${key}`,
            keywords: `${key}, ${getTourneySlug(item?.bracketInfo)}, ${keywords}`,
            bootstrap,
          })
        )
      }
    })
    Object.keys(playerById).forEach(key => {
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
        writeFile(
          path.join(gameDir, "player", key, "index.html"),
          generatePage({
            templatePath,
            title: `${nameWithRomaji} - Sets on Stream`,
            description: `Watch ${nameWithRomaji}'s Live and Recent ${gameInfo?.name} Sets on Stream from Tournaments`,
            keywords: `${nameWithRomaji}, ${key}, ${keywords}`,
            bootstrap,
          })
        )
      }
    })
    combined.forEach(item => {
      const setId = item.bracketInfo.setId
      const tourneySlug = getTourneySlug(item.bracketInfo)
      const tourneyIcon = item.bracketInfo.images[0]?.url ?? null
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
      const bootstrap = {routeInfo: {
        set: item,
        tourneySlug,
        tourneyIcon,
        tourneyName,
        channelName,
        // player1Name,
        // player2Name,
        // player1Slug,
        // player2Slug,
        setId,
        charKeywordStrs,
      }}
      // var url = `https://setsonstream.tv/game/${gameSlug}/set/${setId}/`
      // var jsonLd = generateJsonLdSet({item, gameInfo, url})
      // title: `${item.bracketInfo.tourneyName} - Sets on Stream`,
      // description: `Watch Live and Recent ${gameInfo?.name} Sets on Stream happening at Tournament ${item.bracketInfo.tourneyName}`,
      var url = `https://setsonstream.tv/game/${gameSlug}/tournament/${tourneySlug}/set/${setId}/`
      var jsonLd = generateJsonLdSet({item, gameInfo, url})
      const canonical = `https://setsonstream.tv/game/${gameSlug}/tournament/${tourneySlug}/set/${setId}/`
      writeFile(
        path.join(gameDir, "tournament", tourneySlug, "set", `${setId}`, "index.html"),
        generatePage({
          templatePath,
          title, 
          description,
          keywords: setKeywords,
          bootstrap,
          jsonLd,
          canonical,
        })
      )
      url = `https://setsonstream.tv/game/${gameSlug}/channel/${channelName}/set/${setId}/`
      jsonLd = generateJsonLdSet({item, gameInfo, url})
      writeFile(
        path.join(gameDir, "channel", channelName, "set", `${setId}`, "index.html"),
        generatePage({
          templatePath,
          title, 
          description,
          keywords: setKeywords,
          bootstrap,
          jsonLd,
          canonical,
        })
      )
      if (player1Slug != null) {
        url = `https://setsonstream.tv/game/${gameSlug}/player/${player1Slug}/set/${setId}/`
        jsonLd = generateJsonLdSet({item, gameInfo, url})
        writeFile(
          path.join(gameDir, "player", player1Slug, "set", `${setId}`, "index.html"),
          generatePage({
            templatePath,
            title, 
            description,
            keywords: setKeywords,
            bootstrap: {...bootstrap, userSlug: player1Slug},
            jsonLd,
            canonical,
          })
        )
      }
      if (player2Slug != null) {
        url = `https://setsonstream.tv/game/${gameSlug}/player/${player2Slug}/set/${setId}/`
        jsonLd = generateJsonLdSet({item, gameInfo, url})
        writeFile(
          path.join(gameDir, "player", player2Slug, "set", `${setId}`, "index.html"),
          generatePage({
            templatePath,
            title, 
            description,
            keywords: setKeywords,
            bootstrap: {...bootstrap, userSlug: player2Slug},
            jsonLd,
            canonical,
          })
        )
      }
      url = `https://setsonstream.tv/game/${gameSlug}/set/${setId}/`
      jsonLd = generateJsonLdSet({item, gameInfo, url})
      writeFile(
        path.join(gameDir, "set", `${setId}`, "index.html"),
        generatePage({
          templatePath,
          title, 
          description,
          keywords: setKeywords,
          bootstrap,
          jsonLd,
          canonical,
        })
      )
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
    if (hasCharPages) {
      writeFile(
        path.join(SITEMAP_DIR, `sitemap-game-${game.gameSlug}-characters.xml`),
        generateCharacterSitemap(game)
      )
    }
    const {tourneyById, playerById, channelById, tourneyLastModById, playerLastModById, channelLastModById } = gameSubCats[game.id]
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

function generateJsonLdSet({item, gameInfo, url}) {
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
  const setIcon = tourneyIconUrl || tourneyBackgroundUrl
  const setThumb = tourneyBackgroundUrl || tourneyIconUrl
  const streamIcon = item.streamInfo.streamIcon
  const startedAtIso = getIsoStr(item.bracketInfo.startedAt)
  const endedAt = item.bracketInfo.endTime ?? item.bracketInfo.endTimeDetected ?? Math.floor(Date.now()/1000)
  const duration = Math.min(endedAt-item.bracketInfo.startedAt, 60*60)
  const isoDuration = getIsoDuration(duration)
  const contentUrl = getStreamUrl(item.streamInfo, 0, true)
  const embedUrl = getStreamEmbedUrl(item.streamInfo, 0, true)
  let viewers = 0
  const charArr1 = (item.player1Info.charInfo?.length ?? 0) > 0 ? { 
    "character": item.player1Info.charInfo.map(charItem => ({
        "@type": "VideoGameCharacter",
        "name": charItem.name,
        "url": `https://setsonstream.tv/character/${charItem.name}`
      }))}
    : {}
  const charArr2 = (item.player2Info.charInfo?.length ?? 0) > 0 ? { 
    "character": item.player2Info.charInfo.map(charItem => ({
        "@type": "VideoGameCharacter",
        "name": charItem.name,
        "url": `https://setsonstream.tv/character/${charItem.name}`
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

  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "@id": url,
    // "@id": `https://setsonstream.tv/game/${gameSlug}/set/${setId}/`,
    "name": `${player1Name} vs ${player2Name} - ${tourneyName}, ${fullRoundText} (${gameDisplayName})`,
    "description": `Watch ${player1Name} vs ${player2Name} in ${fullRoundText} of ${tourneyName}, streamed by ${channelName}.`,
    "thumbnailUrl": [
      `${setThumb}`
    ],
    "uploadDate": `${startedAtIso}`,
    ...(endedAt && {"duration": isoDuration}),  
    "contentUrl": contentUrl,
    "embedUrl": embedUrl,
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
    // "isPartOf": {
    //   "@type": "SportsEvent",
    //   "@id": `https://setsonstream.tv/game/${gameSlug}/tournament/${tourneySlug}/`,
    //   "name": `${tourneyName}`
    // },
    "competitor": [
      {
        "@type": "Person",
        "@id": `https://setsonstream.tv/game/${gameSlug}/player/${player1Slug}`,
        "name": `${player1Name}`,
        ...charArr1,
      },
      {
        "@type": "Person",
        "@id": `https://setsonstream.tv/game/${gameSlug}/player/${player2Slug}`,
        "name": `${player2Name}`,
        ...charArr2,
      },
    ]
  }
}


function generateJsonLdTournament({item, gameInfo, url}) {
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
  const setIcon = tourneyIconUrl || tourneyBackgroundUrl
  const setThumb = tourneyBackgroundUrl || tourneyIconUrl
  const streamIcon = item.streamInfo.streamIcon
  const startedAtIso = getIsoStr(item.bracketInfo.startedAt)
  const endedAt = item.bracketInfo.endTime ?? item.bracketInfo.endTimeDetected ?? Math.floor(Date.now()/1000)
  const duration = Math.min(endedAt-item.bracketInfo.startedAt, 60*60)
  const isoDuration = getIsoDuration(duration)
  const contentUrl = getStreamUrl(item.streamInfo, 0, true)
  const embedUrl = getStreamEmbedUrl(item.streamInfo, 0, true)
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SportsEvent",
        "@id": `${url}`,
        "sport": {
          "@type": "VideoGame",
          "name": `${gameName}`,
          "alternateName": [gameDisplayName, gameSlug],          
        },
        "additionalType": "https://schema.org/EventSeries",
        "name": `${tourneyName}`,
        "startDate": "2025-01-20T10:00:00-08:00",
        // "endDate": "2025-01-22T22:00:00-08:00",
        "eventStatus": "https://schema.org/EventCompleted",
        "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
        "url": `${url}`,
        "location": {
          "@type": "VirtualLocation",
          "url": "https://www.twitch.tv/btssmash"
        },
        "performer": [
          {
            "@type": "Person",
            "name": "MKLeo",
            "url": "https://setsonstream.tv/game/smashultimate/player/mkleo"
          },
          {
            "@type": "Person",
            "name": "Sparg0",
            "url": "https://setsonstream.tv/game/smashultimate/player/sparg0"
          }
        ],
        "organizer": {
          "@type": "Organization",
          "name": "BTSsmash",
          "url": "https://setsonstream.tv/game/smashultimate/channel/btssmash"
          // "name": `${channelName}`,
          // ...(streamIcon && {"logo": {
          //   "@type": "ImageObject",
          //   "url": streamIcon,
          //   // "width": 600,
          //   // "height": 60
          // }})
          
        }
      },
      {
        "@type": "ItemList",
        "name": "Genesis 9 Matches",
        "itemListOrder": "https://schema.org/ItemListOrderAscending",
        "numberOfItems": 3,
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "url": "https://setsonstream.tv/game/smashultimate/set/12345"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "url": "https://setsonstream.tv/game/smashultimate/set/12346"
          },
          {
            "@type": "ListItem",
            "position": 3,
            "url": "https://setsonstream.tv/game/smashultimate/set/12347"
          }
        ]
      }
    ]
  }
}

function generateJsonLdPlayer({item, gameInfo}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": "https://setsonstream.tv/game/smashultimate/player/mkleo",
    "name": "MKLeo",
    "url": "https://setsonstream.tv/game/smashultimate/player/mkleo",
    "image": "https://setsonstream.tv/static/players/mkleo.jpg",
    "memberOf": {
      "@type": "Thing",
      "name": "Smash Ultimate",
      "@id": "https://setsonstream.tv/game/smashultimate"
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://setsonstream.tv/game/smashultimate/player/mkleo"
    },
    "hasPart": {
      "@type": "ItemList",
      "name": "Recent Sets featuring MKLeo",
      "itemListElement": [
        {
          "@type": "VideoObject",
          "@id": "https://setsonstream.tv/game/smashultimate/set/12345",
          "position": 1,
          "name": "MKLeo vs Sparg0 - Genesis 9 Winners Finals"
        },
        {
          "@type": "VideoObject",
          "@id": "https://setsonstream.tv/game/smashultimate/set/12346",
          "position": 2,
          "name": "MKLeo vs Tweek - Genesis 9 Grand Finals"
        }
      ]
    }
  }
}

function generateJsonLdChannel({item, gameInfo}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://setsonstream.tv/game/smashultimate/channel/btssmash",
    "name": "BTSsmash",
    "url": "https://setsonstream.tv/game/smashultimate/channel/btssmash",
    "logo": {
      "@type": "ImageObject",
      "url": "https://setsonstream.tv/static/channels/btssmash-logo.png",
      "width": 600,
      "height": 60
    },
    "sameAs": [
      "https://www.youtube.com/@BTSsmash",
      "https://twitter.com/BTSsmash"
    ],
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://setsonstream.tv/game/smashultimate/channel/btssmash"
    },
    "hasPart": {
      "@type": "ItemList",
      "name": "Recent Sets streamed by BTSsmash",
      "itemListElement": [
        {
          "@type": "VideoObject",
          "@id": "https://setsonstream.tv/game/smashultimate/set/12345",
          "position": 1,
          "name": "MKLeo vs Sparg0 - Genesis 9 Winners Finals"
        },
        {
          "@type": "VideoObject",
          "@id": "https://setsonstream.tv/game/smashultimate/set/12347",
          "position": 2,
          "name": "Sparg0 vs Light - Genesis 9 Losers Finals"
        }
      ]
    }
  }
}

function generateJsonLdGame({item, gameInfo}) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    "@id": "https://setsonstream.tv/game/smashultimate",
    "name": "Super Smash Bros. Ultimate",
    "url": "https://setsonstream.tv/game/smashultimate",
    "image": "https://setsonstream.tv/static/games/smashultimate-cover.jpg",
    "genre": "Fighting",
    "publisher": {
      "@type": "Organization",
      "name": "Nintendo"
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://setsonstream.tv/game/smashultimate"
    },
    "hasPart": {
      "@type": "ItemList",
      "name": "Recent Sets in Super Smash Bros. Ultimate",
      "itemListOrder": "Descending",
      "itemListElement": [
        {
          "@type": "VideoObject",
          "@id": "https://setsonstream.tv/game/smashultimate/set/12345",
          "position": 1,
          "name": "MKLeo vs Sparg0 - Genesis 9 Winners Finals"
        },
        {
          "@type": "VideoObject",
          "@id": "https://setsonstream.tv/game/smashultimate/set/12346",
          "position": 2,
          "name": "Tweek vs Light - Genesis 9 Semifinals"
        }
      ]
    }
  }
}

function generateJsonLdCharacter({item, gameInfo}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": "https://setsonstream.tv/game/super-smash-bros-ultimate/character/mario/",
    "url": "https://setsonstream.tv/game/super-smash-bros-ultimate/character/mario/",
    "name": "Super Smash Bros. Ultimate – Mario Character Page",
    "description": "Watch competitive Super Smash Bros. Ultimate matches featuring Mario. Browse recent sets, players, and tournaments where Mario is played.",
    "about": {
      "@type": "VideoGameCharacter",
      "name": "Mario",
      "url": "https://setsonstream.tv/game/super-smash-bros-ultimate/character/mario/",
      "characterAttribute": {
        "@type": "Thing",
        "name": "Super Smash Bros. Ultimate"
      }
    },
    "isPartOf": {
      "@type": "VideoGame",
      "name": "Super Smash Bros. Ultimate",
      "url": "https://setsonstream.tv/game/super-smash-bros-ultimate/"
    },
    "hasPart": [
      {
        "@type": "VideoObject",
        "@id": "https://setsonstream.tv/game/super-smash-bros-ultimate/set/12345",
        "name": "Player A vs Player B – Mario Match",
        "thumbnailUrl": "https://img.youtube.com/vi/xxxx/hqdefault.jpg",
        "uploadDate": "2025-09-13",
        "description": "Competitive set featuring Mario in Super Smash Bros. Ultimate.",
        "embedUrl": "https://www.youtube.com/embed/xxxx?start=1234",
        // "inLanguage": "en"
      }
      /* …more VideoObjects for other sets … */
    ]
  }
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



