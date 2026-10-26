"use client";

import { createContext, useContext, useState } from "react";

const SearchContext = createContext();

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider");
  }
  return context;
};

// Same as useSearch but returns null instead of throwing when there is no
// provider — lets a component drive its own local state as a fallback.
export const useSearchOptional = () => useContext(SearchContext);

export const SearchProvider = ({ children }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [menuLabelActive, setMenuLabelActive] = useState(false);
  const [searchLabel, setSearchLabel] = useState("Search talent");

  const openSearch = () => setIsSearchOpen(true);
  const closeSearch = () => setIsSearchOpen(false);
  const toggleSearch = () => setIsSearchOpen(prev => !prev);

  return (
    <SearchContext.Provider
      value={{
        isSearchOpen,
        isMenuOpen,
        setMenuOpen,
        menuLabelActive,
        setMenuLabelActive,
        searchLabel,
        setSearchLabel,
        openSearch,
        closeSearch,
        toggleSearch,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};
