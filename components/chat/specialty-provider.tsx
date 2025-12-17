"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface SpecialtyContextType {
    activeSpecialty: string | null;
    setSpecialty: (specialty: string | null) => void;
}

const SpecialtyContext = createContext<SpecialtyContextType | undefined>(undefined);

const STORAGE_KEY = "aurora-active-specialty";

export function SpecialtyProvider({ children }: { children: ReactNode }) {
    const [activeSpecialty, setActiveSpecialtyState] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            setActiveSpecialtyState(stored);
        }
        setIsLoaded(true);
    }, []);

    // Save to localStorage when changed
    const setSpecialty = (specialty: string | null) => {
        setActiveSpecialtyState(specialty);
        if (specialty) {
            localStorage.setItem(STORAGE_KEY, specialty);
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    };

    // Don't render children until we've loaded from localStorage
    if (!isLoaded) {
        return null;
    }

    return (
        <SpecialtyContext.Provider value={{ activeSpecialty, setSpecialty }}>
            {children}
        </SpecialtyContext.Provider>
    );
}

export function useSpecialty() {
    const context = useContext(SpecialtyContext);
    if (context === undefined) {
        throw new Error("useSpecialty must be used within a SpecialtyProvider");
    }
    return context;
}
