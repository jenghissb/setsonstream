import React, { useState, useRef, useEffect } from 'react';
import "./SearchInputBar.css"
import { Characters } from './GameInfo.js'
import { renderFilterTypeButton } from './FilterTypeButton'
import { charEmojiImagePath } from './Utilities.js'

export function SearchInputBar({ onSearch, filterInfo, toggleCharacter }) {
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef(null);
  const [filteredResults, setFilteredResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null); // For click outside detection
  const data = Characters[filterInfo.currentGameId]?.charList ?? []
  const handleChange = (event) => {
    setSearchTerm(event.target.value);
  };
  
  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      if(inputRef.current) {
        inputRef.current.blur()
      }
      onSearch(event.target.value.toLowerCase());
      setSearchTerm("")
    }
  }
  useEffect(() => {
    // Filter data based on searchTerm
    if (searchTerm) {

      const results = data.filter(item =>
        item.toLowerCase().startsWith(searchTerm.toLowerCase())
      );
      setFilteredResults(results);
      setShowDropdown(true);
    } else {
      setFilteredResults([]);
      setShowDropdown(false);
    }
  }, [searchTerm]);

  const handleItemClick = (item) => {
    if(inputRef.current) {
      inputRef.current.blur()
    }
    setSearchTerm("");
    setShowDropdown(false);
    toggleCharacter(item, filterInfo.currentGameId)
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

      {showDropdown && filteredResults.length > 0 && (
        <ul className='dropdownList'>
          {filteredResults.map((item, index) => {
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
        </ul>
      )}

    </div>
  );
}


function SearchTerm({onRemove, searchTerm, index}) {
  return <div className={"searchTerm"} onClick={() => onRemove(index, searchTerm)}>{searchTerm} <span>x</span></div>
}

export function SearchTerms({searchTerms, onRemove, hasCharFilters, filterType, changeFilterType}) {
  if (hasCharFilters || (searchTerms != null && searchTerms.length > 0)) {
    return <div className='searchTermHolder'>
      {renderFilterTypeButton(filterType, changeFilterType)}
      {searchTerms?.map((item, index) => <SearchTerm {...{onRemove, searchTerm: item, index}} />)}
    </div>
  }
}
