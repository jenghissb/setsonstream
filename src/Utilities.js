import React, { useRef, useEffect } from 'react';

export function getStartggUserLink(userSlug) {
  return `https://start.gg/user/${userSlug}`;
}

export function getCharUrl(charInfo, gameId){
  if (charInfo.length > 0) {
    return charEmojiImagePath(charInfo[0].name, gameId)
  } else {
    return process.env.PUBLIC_URL + `/charEmojis/unknownchar.png`
  }
}

export function charEmojiImagePath(name, gameId) {
  return process.env.PUBLIC_URL + `/charEmojis/${gameId}/${name}.png`
}

export function schuEmojiImagePath(name) {
  return process.env.PUBLIC_URL + `/scemojis/${name}.png`
}

export function getLumitierIconStr(lumitier) {
  var lumitierIconStr = ''
  if (lumitier != null && lumitier.length > 0) {
    var lumiColor = getLumiColor(lumitier)
    lumitierIconStr = `<span style="background:${lumiColor}; font-size: 13px; padding-left: 5px; padding-right: 5px; padding-bottom: 2px; margin-left: -2px; margin-top: 80px; border-radius: 6px; border: 1px solid rgb(7, 41, 87); color: #fff">${lumitier}</span>`
  }
  return lumitierIconStr
}

export function getLumitierIcon(lumitier, conditionalStyles={}) {
//   lumitier = "C+"
  if (lumitier != null && lumitier.length > 0) {
    var lumiColor = getLumiColor(lumitier)
    return <span style={{background: lumiColor, fontSize: '13px', paddingLeft: '5px', paddingRight: '5px', paddingBottom: '2px' , borderRadius: '6px', border: '1px solid rgb(7, 41, 87)', ...conditionalStyles}}>{lumitier}</span>
  } else {
    return <span/>
  }
}


function getLumiColor(lumitier) {
    var lumiColor;
    //reference:
      // charEmojiImagePathase 'D':
      //   lumiColor = "rgb(119, 195, 223)"; break;
      // case 'C':
      //   lumiColor = "rgb(132, 227, 122)"; break;
      // case 'B':
      //   lumiColor = "rgb(221, 229, 114)"; break;
      // case 'A':
      //   lumiColor = "rgb(220, 166, 103)"; break;
      // case 'S':
      //   lumiColor = "rgb(210, 100, 96)"; break;
      // case 'P':
      //   lumiColor = "rgb(119, 195, 223)"; break;
      // default:
      //   lumiColor = "rgb(8, 83, 181)";
    // lumiColor = "#bdc636"; break;

    switch (lumitier.charAt(0)) {
      case 'D':
        lumiColor = "#77c3df"; break;
      case 'C':
        lumiColor = "#84e37a"; break;
      case 'B':
        lumiColor = "#bdc636"; break;
      case 'A':
        lumiColor = "#dca667"; break;
      case 'S':
        lumiColor = "#d26460"; break;
      case 'P':
        lumiColor = "#77c3df"; break;
      default:
        lumiColor = "#0853b5";
    }
    return lumiColor
}

export function useOnClickOutside(ref, handler) {
  useEffect(
    () => {
      const listener = (event) => {
        // Do nothing if clicking ref's element or descendent elements
        if (!ref.current || ref.current.contains(event.target)) {
          return;
        }
        handler(event);
      };

      document.addEventListener('mousedown', listener);
      document.addEventListener('touchstart', listener);

      return () => {
        document.removeEventListener('mousedown', listener);
        document.removeEventListener('touchstart', listener);
      };
    },
    [ref, handler] // Re-run if ref or handler changes
  );
}
