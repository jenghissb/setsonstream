export function getStartggUserLink(userSlug) {
  return `https://start.gg/user/${userSlug}`;
}

export function getCharUrl(charInfo){
  if (charInfo.length > 0) {
    return charEmojiImagePath(charInfo[0].name)
  } else {
    return charEmojiImagePath("ken")
  }
}

export function charEmojiImagePath(name) {
  return "./botEmojis/" + name + ".png"
}

export function schuEmojiImagePath(name) {
  return "./scemojis/" + name + ".png"
}
