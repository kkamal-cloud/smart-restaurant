import React from 'react';
import './SearchBar.css';

function SearchBar({ searchQuery, setSearchQuery }) {
  return (
    <div className="search-bar-container">
      <input 
        type="text" 
        className="search-input" 
        placeholder="Search for your favorite food..." 
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <span className="search-icon">🔍</span>
    </div>
  );
}

export default SearchBar;
