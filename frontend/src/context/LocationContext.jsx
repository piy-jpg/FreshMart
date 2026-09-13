import React, { createContext, useState } from 'react';
import { getStoredItem, setStoredItem } from '../utils/storage';

export const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [location, setLocation] = useState(() => getStoredItem('freshmart_location', {
    shortAddress: 'Indiranagar, Bengaluru',
    pincode: '560038'
  }));

  const updateLocation = (loc) => {
    setLocation(loc);
    setStoredItem('freshmart_location', loc);
  };

  return (
    <LocationContext.Provider value={{ location, updateLocation }}>
      {children}
    </LocationContext.Provider>
  );
}
