import React from 'react';
import { Link } from 'react-router-dom';
import './GameList.css'
import { VideoGameInfo } from './GameInfo.js';
export function renderGameList(currentGameId, onClickItem) {
  return (
    <div className="gameList">{
      VideoGameInfo.map(item => {
        var itemClass = "gameItem"
        if (item.id == currentGameId) {
          itemClass += " currentGame"
        }
        return <img className={itemClass} key={item.id} onClick={() => onClickItem(item)} src={item.images[0].url}/>
      })
    }</div>
  );
};

