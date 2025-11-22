'use client'

import { useEffect } from "react";
import { useParty } from "../contexts/PartyContext";
import { MapSection } from "../components/MapSection";

export default function HomePage() {
  const { currentTable, currentParty, partyName } = useParty();

  useEffect(() => {
    console.log("Current Party Info:", {
      currentTable,
      currentParty,
      partyName
    });
  }, [currentTable, currentParty, partyName]);

  return (
    <main className="flex flex-col items-center justify-center p-4 gap-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold font-serif">Welcome to <span className="text-gradient-pink-purple">rent2own</span></h1>
        <p className="mt-4 text-lg">
          where every payment brings you home!
        </p>
      </div>
        
      <div className="w-full max-w-2xl flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <label className="text-lg font-semibold w-64">How long do you want to live there:</label>
          <input 
            type="number" 
            min="0" 
            max="100" 
            step="1"
            className="flex-1 px-6 py-2 border border-gray-400 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="Enter months..."
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="text-lg font-semibold w-64">How many roommates do you want to have:</label>
          <input 
            type="number" 
            min="0" 
            max="100" 
            step="1"
            className="flex-1 px-6 py-2 border border-gray-400 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
            placeholder="Enter amount..."
          />
        </div>
      </div>

      <div className="w-full max-w-6xl">
        <MapSection city="Munich" />
      </div>
    </main>
  );
}