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
  const [plants, setPlants] = useState<Plant[]>([]);

  useEffect(() => {
    setPlants(getInitialPlants());
  }, []);

  const syncToLocalStorage = useCallback((updatedPlants: Plant[]) => {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(updatedPlants));
    } catch (error)
      console.error('Error writing to localStorage', error);
    }
  }, []);

  const addPlant = useCallback((plant: Omit<Plant, 'id'>) => {
    const newPlant = { ...plant, id: crypto.randomUUID() };
    const updatedPlants = [...plants, newPlant];
    setPlants(updatedPlants);
    syncToLocalStorage(updatedPlants);
    return newPlant;
  }, [plants, syncToLocalStorage]);

  const updatePlant = useCallback((updatedPlant: Plant) => {
    const updatedPlants = plants.map(p => (p.id === updatedPlant.id ? updatedPlant : p));
    setPlants(updatedPlants);
    syncToLocalStorage(updatedPlants);
  }, [plants, syncToLocalStorage]);

  const deletePlant = useCallback((plantId: string) => {
    const updatedPlants = plants.filter(p => p.id !== plantId);
    setPlants(updatedPlants);
    syncToLocalStorage(updatedPlants);
  }, [plants, syncToLocalStorage]);

  const getPlantById = useCallback((plantId: string): Plant | undefined => {
    return plants.find(p => p.id === plantId);
  }, [plants]);

  return { plants, addPlant, updatePlant, deletePlant, getPlantById };
}
