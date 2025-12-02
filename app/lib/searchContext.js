"use client";
import React from "react";

const SearchContext = React.createContext({
  q: "",
  setQ: () => {},
});

export const SearchProvider = ({ children }) => {
  const [q, setQ] = React.useState("");
  return (
    <SearchContext.Provider value={{ q, setQ }}>
      {children}
    </SearchContext.Provider>
  );
};

export function useSearch() {
  return React.useContext(SearchContext);
}
