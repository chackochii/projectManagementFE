// app/lib/searchContext.js
"use client";
import React from "react";

const SearchContext = React.createContext({
  q: "",
  setQ: () => {},
});

export function SearchProvider({ children }) {
  const [q, setQ] = React.useState("");
  return (
    <SearchContext.Provider value={{ q, setQ }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const ctx = React.useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used inside SearchProvider");
  return ctx;
}
