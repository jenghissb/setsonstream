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

export function getChannelName(streamInfo) {
  if (streamInfo?.streamSource == 'YOUTUBE') {
    return streamInfo?.streamName ?? " " //streamInfo.ytChannelId
  } else if (streamInfo?.streamSource == 'TWITCH') {
    return streamInfo?.forTheatre
  } else {
    return streamInfo?.channel
  }
}

export function getTourneySlug(bracketInfo) {
  const url = bracketInfo?.url ?? "";
  const prefix = "https://www.start.gg/tournament/"
  if (url.startsWith(prefix))
    return url.slice(prefix.length)
  return ""
  //"https://www.start.gg/tournament/versus-reborn-216"

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

export function generatePage({templatePath, title, description, keywords}) {
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

  return html;
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
        item.bracketInfo.setKey = `${item.bracketInfo.setId}_${item.bracketInfo.tourneyId}`
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
  
  
  
  // console.log("TEST24 data = ", data)
  // console.log("TEST24 gameSubCats = ", gameSubCats)
  // return
    // const data = await res.json();

  // Data shape: { games: [{ id, name, characters: [{ id, name }] }] }
  // const { games } = data;

  ensureDir(DIST_DIR);

  // === Generate game + character sitemaps ===
  const templatePath = "build/index.html";
  const includeCharactersForGames = ["super-smash-bros-ultimate", "rivals-of-aether-ii", "guilty-gear-strive", "super-smash-bros-melee", "tekken-8"]
  const games = VideoGameInfo
  var keywords = GameKeywords["1386"]
  writeFile(
    path.join(DIST_DIR, "about"),
    generatePage({
      templatePath,
      title: `About - Sets on Stream`,
      description: `Watch live and recent matches from fighting game tournaments: Smash Ultimate, SF6, Rivals 2, Tekken 8, and more.`,
      keywords: keywords,
    })
  );

  for (const gameInfo of games) {
    const gameDir = path.join(DIST_DIR, "game", gameInfo.gameSlug);
    const gameUrl = `/game/${gameInfo.gameSlug}`;
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
        keywords: GameKeywords[gameInfo.id]
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
    
    const {tourneyById, playerById, channelById, tourneyLastModById, playerLastModById, channelLastModById } = gameSubCats[gameInfo.id]
    Object.keys(tourneyById).forEach(key => {
      const items = tourneyById[key]
      const item = items.length > 0 ? items[0] : null
      const lastMod = tourneyLastModById[key]
      const tourneySlug = getTourneySlug(item.bracketInfo)
      if (item != null) {
        writeFile(
          path.join(gameDir, "tournament", tourneySlug, "index.html"),
          generatePage({
            templatePath,
            title: `${item.bracketInfo.tourneyName} - Sets on Stream`,
            description: `Watch Live and Recent ${gameInfo?.name} Sets on Stream happening at Tournament ${item.bracketInfo.tourneyName}`,
            keywords: `${item.bracketInfo.tourneyName}, ${key}, ${tourneySlug}, ${keywords}`
          })
        )
      }
    })
    Object.keys(channelById).forEach(key => {
      const items = channelById[key]
      const item = items.length > 0 ? items[0] : null
      const lastMod = channelLastModById[key]
      if (item != null) {
        writeFile(
          path.join(gameDir, "channel", key, "index.html"),
          generatePage({
            templatePath,
            title: `${key} - Sets on Stream`,
            description: `Watch Live and Recent ${gameInfo?.name} Sets on Stream streaming on ${key}`,
            keywords: `${key}, ${getTourneySlug(item?.bracketInfo)}, ${keywords}`
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
        writeFile(
          path.join(gameDir, "player", key, "index.html"),
          generatePage({
            templatePath,
            title: `${nameWithRomaji} - Sets on Stream`,
            description: `Watch ${nameWithRomaji}'s Live and Recent ${gameInfo?.name} Sets on Stream from Tournaments`,
            keywords: `${nameWithRomaji}, ${key}, ${keywords}`
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
  })
  console.log("Generation complete.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
