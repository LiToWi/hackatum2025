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

      <div className="w-full max-w-6xl">
        <MapSection city="Munich" />
      </div>
    </main>
  );
}