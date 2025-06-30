import './FilterView.css'
import React, { useRef, useState, useEffect } from "react";
import { GameIds, Characters, VideoGameInfoById } from './GameInfo.js'
import { charEmojiImagePath, useOnClickOutside } from './Utilities.js'
import { renderGameList } from './GameList.js'
function renderXButton(onCloseClick) {
  return <div className="xButton" onClick={onCloseClick}>
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  </div>
}

function renderCharacters(filterInfo, toggleCharacter) {
  var currentGameId = filterInfo.currentGameId
  var characters = filterInfo?.filters[currentGameId]?.characters ?? []
  var charactersSet = new Set(characters)
  var allChars = Characters[currentGameId]?.charList ?? []
  return <div className="charList">
    {
      allChars.map(charName => {
        var classStr = "charTile"
        if (charactersSet.has(charName)) {
          classStr += " charTileMatches"
        }
        return <img className={classStr} src={charEmojiImagePath(charName, currentGameId)} onClick={() => toggleCharacter(charName, currentGameId)} />
      })
    }
  </div>
}

export const FilterView = (filterInfo, onGameClick, onCloseClick, toggleCharacter) => {
  // const myRef = useRef();
  // useOnClickOutside(myRef, onCloseClick);

  var currentGameId = filterInfo.currentGameId
  return (
    // <div style={{position:'absolute', zIndex: 30, left:0, top:100, position: 'sticky'}}>
    <div className="filterView">
      <div className="filterTitle">Filter games and characters</div>
      {
        renderCharacters(filterInfo, toggleCharacter)
      }
        {
          renderGameList(filterInfo.currentGameId, onGameClick)
        }
      {
        renderXButton(onCloseClick)
      }
    </div>
    // </div>
  )
}
