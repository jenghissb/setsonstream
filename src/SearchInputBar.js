import React, { useState, useRef, useEffect } from 'react';
import "./SearchInputBar.css"
import { Characters } from './GameInfo.js'
import { renderFilterTypeButton } from './FilterTypeButton'

// function TextInputComponent() {
//   const [inputValue, setInputValue] = useState('');

//   const handleChange = (event) => {
//     setInputValue(event.target.value);
//   };

//   return (
//     <div>
//       <label htmlFor="myTextInput">Enter Text:</label>
//       <input
//         type="text"
//         id="myTextInput"
//         value={inputValue}
//         onChange={handleChange}
//       />
//       <p>Current input: {inputValue}</p>
//     </div>
//   );
// }

export function SearchInputBar({ onSearch, filterInfo }) {
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
        item.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredResults(results);
      setShowDropdown(true);
    } else {
      setFilteredResults([]);
      setShowDropdown(false);
    }
  }, [searchTerm]);

  const handleItemClick = (item) => {
    // onToggleChar(event.target.value.toLowerCase())
    if(inputRef.current) {
      inputRef.current.blur()
    }
    setSearchTerm("");
    setShowDropdown(false);
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

  // console.log("filteredResults = ", filteredResults, "showDropdown", showDropdown)
  // style={{alignSelf: "center", backgroundColor:"#ee5599"}}
      // <div style={{position: "relative", zIndex: 10000, alignSelf: "center" }} ref={dropdownRef}>

  return (
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
  )

  return (
    <div style={{zIndex: 100, alignSelf: "center", backgroundColor: "orange", alignContent: "center" }} ref={dropdownRef}>
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

        {/* {showDropdown && filteredResults.length > 0 && (
        <ul style={{
          position: 'absolute',
          top: '100%', // Position directly below the input
          left: 0,
          width: '60px',
          border: '1px solid #ccc',
          listStyle: 'none',
          padding: 0,
          marginBottom: "-100px",
          marginTop: "-100px",
          backgroundColor: 'white',
          zIndex: 10001 // Ensure it appears above other content
        }}>
          {filteredResults.map((item, index) => (
            <li
              key={index}
              onClick={() => handleItemClick(item)}
              style={{ padding: '8px', cursor: 'pointer', color: "#ffffff", width: "60px", height:"40px" }}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
 */}

    </div>
  );

  // return (
  //   <div>
  //     <input
  //       className={"searchInputBar"}
  //       ref={inputRef}
  //       type="text"
  //       placeholder="Search..."
  //       value={searchTerm}
  //       onKeyDown={handleKeyDown}
  //       onChange={handleChange}
  //     />
  //   </div>
  // );
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


function SimpleDropdown() {
  const [selectedValue, setSelectedValue] = useState('');

  const handleChange = (event) => {
    setSelectedValue(event.target.value);
  };

  return (
    <select value={null} onChange={handleChange}>
      <option value="">Select an option</option>
      <option value="option1">pikachu</option>
      <option value="option2"><div>PIKACHU</div></option>
      <option value="option3">Option 3</option>
    </select>
  );
}
