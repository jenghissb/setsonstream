import React, { useState, useRef, useEffect } from 'react';
import "./SearchInputBar.css"
import { Characters } from './GameInfo.js'
import { renderFilterTypeButton } from './FilterTypeButton'
import { charEmojiImagePath, schuEmojiImagePath } from './Utilities.js'

export function SearchInputBar({ onSearch, filterInfo, toggleCharacter, suggestionsInfo }) {
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
    onSearch(item);
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
      var hasResults = false
      const totalLimit = 6
      var currentAmount = 0
      var charResults = charData.filter(item =>
        item.toLowerCase().startsWith(searchTermLower)
      ).slice(0, totalLimit - currentAmount)
      currentAmount += charResults.length
      hasResults = hasResults || charResults.length > 0
      const userResults = (suggestionsInfo?.users ?? []).filter(item => {
        return item.nameWithRomaji.toLowerCase().indexOf(searchTermLower) > -1
      }).slice(0, totalLimit - currentAmount)
      currentAmount += charResults.length
      setFilteredResults({charResults, userResults, hasResults});
      setShowDropdown(true);
    } else {
      setFilteredResults({charResults: [], userResults: []});
      setShowDropdown(false);
    }
  }, [searchTerm]);

  const handleItemClick = (item) => {
    if(inputRef.current) {
      inputRef.current.blur()
    }
    setSearchTerm("");
    setShowDropdown(false);
    if (typeof item === "String") {
      toggleCharacter(item, filterInfo.currentGameId)
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
        ref={inputRef}
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
            if (filterInfo.filters[filterInfo.currentGameId]?.characters?.includes(item)) {
              charAlreadyFiltered = true
            }

            return <li
              key={index}
              onClick={() => handleItemClick(item)}
              className='dropdownItem'
            >
              <div className='charDropdownItem'>
                <img className="searchCharEmoji" src={charEmojiImagePath(item, filterInfo.currentGameId)}/>
                <span className='searchCharText'>{item}</span>
                {charAlreadyFiltered && <span className='searchCharTextX'>x</span>}
              </div>
            </li>
          })}
          {filteredResults.userResults.map((item, index) => {
            var alreadyFiltered = false;
            if (filterInfo.filters[filterInfo.currentGameId]?.searches?.some(searchItem => item.userSlug == searchItem.userSlug)) {
              alreadyFiltered = true
            }
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
