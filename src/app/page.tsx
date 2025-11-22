'use client'

import { useEffect } from "react";
import { useParty } from "../contexts/PartyContext";

export default function HomePage() {
  const { currentTable, currentParty, partyName} = useParty();

  useEffect(() => {
    console.log("Current Party Info:", {
      currentTable,
      currentParty,
      partyName
    });
  }, [currentTable, currentParty, partyName]);

  return (
    <main className="flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold font-serif">Welcome to <span className="text-gradient-pink-purple">rent2own</span></h1>
        <p className="mt-4 text-lg">
          where every payment brings you home!
        </p>
      </div>
    </main>
  );
}