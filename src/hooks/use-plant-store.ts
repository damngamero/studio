
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Plant } from '@/lib/types';

const STORE_KEY = 'verdantwise-plants';

function getInitialPlants(): Plant[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const item = window.localStorage.getItem(STORE_KEY);
    return item ? JSON.parse(item) : [];
  } catch (error) {
    console.error('Error reading from localStorage', error);
    return [];
  }
}

export function usePlantStore() {
  const [plants, setPlants] = useState<Plant[]>(getInitialPlants);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // This effect ensures we are client-side before setting isInitialized
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    // This effect runs only on the client, after initialization, to sync state to localStorage
    if (isInitialized) {
        try {
            window.localStorage.setItem(STORE_KEY, JSON.stringify(plants));
        } catch (error) {
            console.error('Error writing to localStorage', error);
        }
    }
  }, [plants, isInitialized]);


  const addPlant = useCallback((plant: Omit<Plant, 'id'>) => {
    const newPlant = { ...plant, id: crypto.randomUUID() };
    setPlants(prevPlants => [...prevPlants, newPlant]);
    return newPlant;
  }, []);

  const updatePlant = useCallback((updatedPlant: Plant) => {
    setPlants(prevPlants => prevPlants.map(p => (p.id === updatedPlant.id ? updatedPlant : p)));
  }, []);

  const deletePlant = useCallback((plantId: string) => {
    setPlants(prevPlants => prevPlants.filter(p => p.id !== plantId));
  }, []);

  const getPlantById = useCallback((plantId: string): Plant | undefined => {
    return plants.find(p => p.id === plantId);
  }, [plants]);

  return { plants, addPlant, updatePlant, deletePlant, getPlantById, isInitialized };
}
