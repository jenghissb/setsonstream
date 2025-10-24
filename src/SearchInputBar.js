import React, { useState, useRef, useEffect } from 'react';
import "./SearchInputBar.css"
import { Characters } from './GameInfo.js'
import { renderFilterTypeButton } from './FilterTypeButton'
import { charEmojiImagePath, schuEmojiImagePath } from './Utilities.js'
import { renderCharButton } from './CharButton.js'

export function SearchInputBarWithIcon({ onSearch, filterInfo, toggleCharacter, suggestionsInfo, onPressCharButton}) {
  return <div className="searchRowContainer">
    <SearchInputBar onSearch={onSearch} filterInfo={filterInfo} toggleCharacter={toggleCharacter} suggestionsInfo={suggestionsInfo} isFilterBar={false} hasIcon={true}/>
    <div className="searchIconContainer">
      {renderSearchIcon()}
    </div>
    {renderCharButton(filterInfo, onPressCharButton)}
  </div>
}

export function renderSearchIcon(size="20px") {
  return <svg xmlns="http://www.w3.org/2000/svg" height={size} viewBox="0 -960 960 960" width={size} fill="var(--text-main-color)"><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/></svg>
}

export function SearchInputBar({ onSearch, filterInfo, toggleCharacter, suggestionsInfo, hasIcon=false}) {
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef(null);
  const [filteredResults, setFilteredResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null); // For click outside detection
  const charData = Characters[filterInfo.currentGameId]?.charList ?? []
  const handleChange = (event) => {
    setSearchTerm(event.target.value);
  };
  

  const onSearchSubmit = (item) => {
    if(inputRef.current) {
      inputRef.current.blur()
    }
    const trimmedStr = item.trim()
    if (trimmedStr.length > 0) {
      onSearch({textSearch: trimmedStr});
    }
    setSearchTerm("")
  }
  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      onSearchSubmit(event.target.value.toLowerCase())
    }
  }

  useEffect(() => {
    // Filter data based on searchTerm
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase()
      const totalLimit = 8
      var currentAmount = 0
      // var charResults1 = charData.filter(item =>
      //   item.toLowerCase().startsWith(searchTermLower)
      // ).slice(0, totalLimit - currentAmount)
      const charResults = (suggestionsInfo?.characters ?? []).filter(item => {
        return item.charName.toLowerCase().indexOf(searchTermLower) > -1
        // return item.charName.toLowerCase().startsWith(searchTermLower)
      }).slice(0, totalLimit - currentAmount)
      currentAmount += charResults.length
      const gameResults = (suggestionsInfo?.games ?? []).filter(item => {
        return item.gameName.toLowerCase().indexOf(searchTermLower) > -1
      }).slice(0, totalLimit - currentAmount)
      currentAmount += gameResults.length
      const userResults = (suggestionsInfo?.users ?? []).filter(item => {
        return item.nameWithRomaji.toLowerCase().indexOf(searchTermLower) > -1
      }).slice(0, totalLimit - currentAmount)
      currentAmount += userResults.length
      const tourneyResults = (suggestionsInfo?.tourneys ?? []).filter(item => {
        return (item.tourneyName.toLowerCase().indexOf(searchTermLower) > -1 ||
          item.locationStrWithRomaji.toLowerCase().indexOf(searchTermLower) > -1 ||
          item.tourneySlug.toLowerCase().indexOf(searchTermLower) > -1
        )
      }).slice(0, totalLimit - currentAmount)
      currentAmount += tourneyResults.length
      const streamResults = (suggestionsInfo?.streams ?? []).filter(item => {
        return item.channelName.toLowerCase().indexOf(searchTermLower) > -1
      }).slice(0, totalLimit - currentAmount)
      currentAmount += streamResults.length
      setFilteredResults({charResults, userResults, tourneyResults, streamResults, gameResults, hasResults: currentAmount > 0});
      setShowDropdown(true);
    } else {
      setFilteredResults({charResults: [], userResults: [], tourneyResults: [], streamResults: [], gameResults: [] });
      setShowDropdown(false);
    }
  }, [searchTerm]);

  const handleItemClick = (item) => {
    if(inputRef.current) {
      inputRef.current.blur()
    }
    setSearchTerm("");
    setShowDropdown(false);
    if (typeof item === "string") {
      // toggleCharacter(item, filterInfo.currentGameId)
    } else {
      onSearch(item)
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <div className="outerContainer" ref={dropdownRef}>
      <input
        className={"searchInputBar"}
        style={hasIcon ? {"borderBottomRightRadius": "0px", "borderTopRightRadius": "0px"} : {}}
        ref={inputRef}
        disabled={suggestionsInfo == null}
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        onFocus={() => setShowDropdown(true)}
      />

      {showDropdown &&  (
        <ul className='dropdownList'>
          {filteredResults.charResults.map((item, index) => {
            var charAlreadyFiltered = false;
            //// if (filterInfo.filters[filterInfo.currentGameId]?.characters?.includes(item)) {
            ////   charAlreadyFiltered = true
            //// }
            // if (filterInfo.filters[filterInfo.currentGameId]?.searches?.some(searchItem => item.charName == searchItem.charName)) {
            //   charAlreadyFiltered = true
            // }

            return <li
              key={index}
              onClick={() => handleItemClick(item)}
              className='dropdownItem'
            >
              <div className='charDropdownItem'>
                <img className="searchCharEmoji" src={charEmojiImagePath(item.charName, filterInfo.currentGameId)}/>
                <span className='searchCharText'>{item.charName}</span>
                {charAlreadyFiltered && <span className='searchCharTextX'>x</span>}
              </div>
            </li>
          })}
          {filteredResults.gameResults.map((item, index) => {
            var alreadyFiltered = false;
            // if (filterInfo.filters[filterInfo.currentGameId]?.searches?.some(searchItem => item.userSlug == searchItem.userSlug)) {
            //   alreadyFiltered = true
            // }
            return <li
              key={`tourney_${index}`}
              onClick={() => handleItemClick(item)}
              className='dropdownItem'
            >
              <div className='charDropdownItem'>
                <img className="searchGameIcon" src={item.gameImage} />
                <span className='searchCharText'>{item.gameName}</span>
                {alreadyFiltered && <span className='searchCharTextX'>x</span>}
              </div>
            </li>
          })}
          {filteredResults.userResults.map((item, index) => {
            var alreadyFiltered = false;
            // if (filterInfo.filters[filterInfo.currentGameId]?.searches?.some(searchItem => item.userSlug == searchItem.userSlug)) {
            //   alreadyFiltered = true
            // }
            return <li
              key={`user_${index}`}
              onClick={() => handleItemClick(item)}
              className='dropdownItem'
            >
              <div className='searchUserDropdownItem'>
                <span className="searchUserName">{item.nameWithRomaji}</span> {charEmojis(item.charInfo, filterInfo.currentGameId, "play1_", filterInfo)}
                {alreadyFiltered && <span className='searchCharTextX'>x</span>}
              </div>
            </li>
          })}
          {filteredResults.tourneyResults.map((item, index) => {
            var alreadyFiltered = false;
            // if (filterInfo.filters[filterInfo.currentGameId]?.searches?.some(searchItem => item.userSlug == searchItem.userSlug)) {
            //   alreadyFiltered = true
            // }
            return <li
              key={`tourney_${index}`}
              onClick={() => handleItemClick(item)}
              className='dropdownItem'
            >
              <div className='charDropdownItem'>
                <img className="searchTourneyIcon" src={item.tourneyIcon} />
                <span className='searchCharText'>{item.tourneyName}</span>
                {alreadyFiltered && <span className='searchCharTextX'>x</span>}
              </div>
            </li>
          })}
          {filteredResults.streamResults.map((item, index) => {
            var alreadyFiltered = false;
            // if (filterInfo.filters[filterInfo.currentGameId]?.searches?.some(searchItem => item.userSlug == searchItem.userSlug)) {
            //   alreadyFiltered = true
            // }
            return <li
              key={`tourney_${index}`}
              onClick={() => handleItemClick(item)}
              className='dropdownItem'
            >
              <div className='charDropdownItem'>
                <img className="searchChannelIcon" src={item.streamIcon} />
                <span className='searchCharText'>{item.channelName}</span>
                {alreadyFiltered && <span className='searchCharTextX'>x</span>}
              </div>
            </li>
          })}
        </ul>
      )}

    </div>
  );
}

function CharacterTerm({toggleCharacter, charName, gameId}) {
  var charIconPath = charEmojiImagePath(charName, gameId)
  var charIcon = <img className="charEmojiSearchTerm" key={charName} src={charIconPath}></img>
  return <div className={"searchTerm"} onClick={() => toggleCharacter(charName, gameId)}>
    {charIcon} <span>x</span></div>
}

function SearchTerm({onRemove, searchTerm, index}) {
  var termInner = null
  if (typeof searchTerm === "string") {
    termInner = searchTerm
  } else if (searchTerm.userSlug != null) {
    termInner = `👤${searchTerm.nameWithRomaji}`
  }
  return <div className={"searchTerm"} onClick={() => onRemove(index, searchTerm)}>{termInner} <span>x</span></div>
}

export function SearchTerms({searchTerms, onRemove, hasCharFilters, filterType, changeFilterType, toggleCharacter, gameId, charFilters}) {
  if (hasCharFilters || (searchTerms != null && searchTerms.length > 0)) {
    return <div className='searchTermHolder'>
      {renderFilterTypeButton(filterType, changeFilterType)}
      {charFilters?.map(item => <CharacterTerm {...{toggleCharacter, charName: item, gameId}} />)}
      {searchTerms?.map((item, index) => <SearchTerm {...{onRemove, searchTerm: item, index}} />)}
    </div>
  }
}

function charEmojis(charInfo, gameId, prekey, filterInfo) {  
  var emojiArrs = []
  charInfo.forEach((item, index) => {
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
  var matchesFilter = false;
  filterInfo?.filters[gameId]?.characters?.forEach(charName => {
    if (charName == name) {
      matchesFilter = true
    }
  })
  var emojiClass = "charemoji"
  if (matchesFilter) {
    emojiClass = "charemojimatches"
  }
  return <img className={emojiClass} key={key} src={charEmojiImagePath(name, gameId)}/>
}
function schuEmojiImage(name, key = "") {
  return <img className="schuemoji" key={key} src={schuEmojiImagePath(name)}/>
}
