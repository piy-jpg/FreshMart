/**
 * ========================================================
 * SABJIHUB BLINKIT-STYLE DELIVERY LOCATION SYSTEM
 * Powered by Google Maps Platform, Places & Geocoding
 * ========================================================
 */

(function() {
  'use strict';

  // Default initial delivery location prior to user detection (FEATURE 1, 8)
  const DEFAULT_LOCATION = {
    latitude: 28.5580,
    longitude: 77.3320,
    shortAddress: 'Garhi, Noida',
    address: 'Garhi Chaukhandi, Sector 68 / 121, Noida, Gautam Buddha Nagar, Uttar Pradesh 201301',
    city: 'Noida',
    state: 'Uttar Pradesh',
    postalCode: '201301',
    tag: 'Home',
    timestamp: Date.now()
  };

  const STORAGE_KEY = 'sabjihub_location';
  const SAVED_ADDRESSES_KEY = 'sabjihub_saved_addresses';
  const RECENT_KEY = 'sabjihub_recent_locations';
  const MAX_RECENT = 6;

  /**
   * -------------------------------------------------------------
   * FEATURE 6: DELIVERY AVAILABILITY SERVICE
   * -------------------------------------------------------------
   */
  function checkDeliveryAvailability(lat, lng) {
    if (window.SabjiHubDeliveryZone && typeof window.SabjiHubDeliveryZone.checkDeliveryAvailability === 'function') {
      return window.SabjiHubDeliveryZone.checkDeliveryAvailability(lat, lng);
    }

    // Built-in delivery zone fallback (Delhi NCR + Bengaluru)
    const hubs = [
      { name: 'Noida Hub', lat: 28.5800, lng: 77.3400, radiusKm: 25 },
      { name: 'Greater Noida Hub', lat: 28.4744, lng: 77.5040, radiusKm: 22 },
      { name: 'Ghaziabad Hub', lat: 28.6692, lng: 77.4538, radiusKm: 22 },
      { name: 'Delhi NCR Hub', lat: 28.6139, lng: 77.2090, radiusKm: 28 },
      { name: 'Gurugram Hub', lat: 28.4595, lng: 77.0266, radiusKm: 25 },
      { name: 'Bengaluru Hub', lat: 12.9716, lng: 77.5946, radiusKm: 25 }
    ];

    function dist(lat1, lon1, lat2, lon2) {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    let closestDist = Infinity;
    let closestHub = null;

    for (const h of hubs) {
      const d = dist(lat, lng, h.lat, h.lng);
      if (d < closestDist) {
        closestDist = d;
        closestHub = h;
      }
    }

    if (closestHub && closestDist <= closestHub.radiusKm) {
      const eta = closestDist <= 3 ? '15 mins' : (closestDist <= 10 ? '20 mins' : '25 mins');
      return {
        serviceable: true,
        eta,
        zone: closestHub.name,
        distanceKm: Math.round(closestDist * 10) / 10,
        message: `Delivery available • Delivery in ${eta}`
      };
    }

    return {
      serviceable: false,
      eta: '',
      distanceKm: closestHub ? Math.round(closestDist * 10) / 10 : null,
      message: 'Sorry! We do not deliver to this location yet.'
    };
  }

  /**
   * -------------------------------------------------------------
   * GEOCODING & PLACES SERVICE (Google Maps Platform + Proxy)
   * -------------------------------------------------------------
   */
  const geocodingService = {
    /**
     * Reverse geocode coordinates to structured address
     */
    async reverseGeocode(lat, lon) {
      // 1. If Google Maps SDK is loaded in browser, try google.maps.Geocoder
      if (window.google && window.google.maps && window.google.maps.Geocoder) {
        try {
          const geocoder = new window.google.maps.Geocoder();
          const response = await new Promise((resolve, reject) => {
            geocoder.geocode({ location: { lat, lng: lon } }, (results, status) => {
              if (status === 'OK' && results && results[0]) {
                resolve(results[0]);
              } else {
                reject(new Error(`Google Geocoder status: ${status}`));
              }
            });
          });

          if (response) {
            const comps = response.address_components || [];
            const getComp = (type) => comps.find(c => c.types.includes(type))?.long_name || '';
            const sublocality = getComp('sublocality_level_1') || getComp('sublocality') || getComp('neighborhood') || getComp('route');
            const city = getComp('locality') || getComp('administrative_area_level_2') || 'Noida';
            const state = getComp('administrative_area_level_1') || 'Uttar Pradesh';
            const postalCode = getComp('postal_code') || '';
            const shortAddress = sublocality
              ? (sublocality.toLowerCase().includes(city.toLowerCase()) ? sublocality : `${sublocality}, ${city}`)
              : `${city}`;

            return {
              latitude: lat,
              longitude: lon,
              shortAddress,
              address: response.formatted_address || `${shortAddress}, ${state} ${postalCode}`,
              city,
              state,
              postalCode,
              country: getComp('country') || 'India',
              provider: 'google_sdk'
            };
          }
        } catch (sdkErr) {
          // Fall through to server proxy
        }
      }

      // 2. Server proxy endpoint (/api/location/reverse)
      const res = await fetch(`/api/location/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`, {
        headers: { 'Accept': 'application/json' }
      });

      if (!res.ok) {
        throw new Error(`Geocoding server error (${res.status})`);
      }

      const data = await res.json();
      return {
        latitude: lat,
        longitude: lon,
        shortAddress: data.shortAddress || 'Detected Location',
        address: data.address || `${data.shortAddress || ''}, ${data.city || 'Noida'}, ${data.state || 'Uttar Pradesh'}`,
        city: data.city || 'Noida',
        state: data.state || 'Uttar Pradesh',
        postalCode: data.postalCode || '201301',
        country: data.country || 'India',
        isFallback: Boolean(data.isFallback),
        provider: data.provider || 'server_proxy'
      };
    },

    /**
     * Search places / areas / landmarks with live suggestions
     */
    async searchPlaces(query) {
      const q = (query || '').trim();
      if (q.length < 2) return [];

      // 1. Try client-side Google Places AutocompleteService if available
      if (window.google && window.google.maps && window.google.maps.places && window.google.maps.places.AutocompleteService) {
        try {
          const service = new window.google.maps.places.AutocompleteService();
          const predictions = await new Promise((resolve, reject) => {
            service.getPlacePredictions({
              input: q,
              componentRestrictions: { country: 'in' }
            }, (results, status) => {
              if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                resolve(results);
              } else {
                resolve([]);
              }
            });
          });

          if (predictions && predictions.length > 0) {
            return predictions.map(p => ({
              id: p.place_id,
              shortAddress: p.structured_formatting?.main_text || p.description.split(',')[0].trim(),
              address: p.description,
              placeId: p.place_id,
              source: 'google_sdk_autocomplete'
            }));
          }
        } catch (e) {
          // Fall through to server proxy
        }
      }

      // 2. Server proxy endpoint (/api/location/search)
      const res = await fetch(`/api/location/search?q=${encodeURIComponent(q)}`, {
        headers: { 'Accept': 'application/json' }
      });

      if (!res.ok) {
        throw new Error(`Place search error (${res.status})`);
      }

      return await res.json();
    },

    /**
     * Resolve Place ID to coordinates
     */
    async resolvePlaceDetails(placeId, fallbackAddress) {
      if (window.google && window.google.maps && window.google.maps.Geocoder) {
        try {
          const geocoder = new window.google.maps.Geocoder();
          const res = await new Promise((resolve, reject) => {
            const req = placeId ? { placeId } : { address: fallbackAddress };
            geocoder.geocode(req, (results, status) => {
              if (status === 'OK' && results && results[0]) {
                resolve(results[0]);
              } else {
                reject(new Error(`Geocoder status ${status}`));
              }
            });
          });

          if (res && res.geometry && res.geometry.location) {
            return {
              lat: res.geometry.location.lat(),
              lng: res.geometry.location.lng(),
              formatted_address: res.formatted_address
            };
          }
        } catch (e) {}
      }

      // Fallback search proxy to find approximate coordinates
      try {
        const searchRes = await this.searchPlaces(fallbackAddress);
        if (searchRes && searchRes[0] && searchRes[0].latitude) {
          return {
            lat: searchRes[0].latitude,
            lng: searchRes[0].longitude,
            formatted_address: searchRes[0].address
          };
        }
      } catch (e) {}

      // Default to central Noida if unresolved
      return { lat: 28.5800, lng: 77.3400, formatted_address: fallbackAddress };
    }
  };

  /**
   * -------------------------------------------------------------
   * STORAGE & GEOLOCATION SERVICE (FEATURE 8, 9)
   * -------------------------------------------------------------
   */
  const locationService = {
    getLocation() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.shortAddress) {
            return parsed;
          }
        }
      } catch (e) {}
      return DEFAULT_LOCATION;
    },

    saveLocation(loc) {
      if (!loc || !loc.shortAddress) return;

      const locRecord = {
        latitude: Number(loc.latitude) || DEFAULT_LOCATION.latitude,
        longitude: Number(loc.longitude) || DEFAULT_LOCATION.longitude,
        shortAddress: String(loc.shortAddress).trim(),
        address: String(loc.address || loc.shortAddress).trim(),
        flatNo: String(loc.flatNo || '').trim(),
        landmark: String(loc.landmark || '').trim(),
        tag: String(loc.tag || 'Home').trim(),
        city: String(loc.city || 'Noida').trim(),
        state: String(loc.state || 'Uttar Pradesh').trim(),
        postalCode: String(loc.postalCode || '').trim(),
        eta: loc.eta || '20 mins',
        timestamp: Date.now()
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(locRecord));
        this.addSavedAddress(locRecord);
        this.addRecentLocation(locRecord);
      } catch (e) {}

      try {
        localStorage.setItem('sabjihub_city', locRecord.shortAddress);
      } catch (e) {}

      updateNavbarUI();

      window.dispatchEvent(new CustomEvent('sabjihub:location-changed', {
        detail: locRecord
      }));

      return locRecord;
    },

    getSavedAddresses() {
      try {
        const raw = localStorage.getItem(SAVED_ADDRESSES_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {}
      return [];
    },

    addSavedAddress(loc) {
      try {
        let list = this.getSavedAddresses();
        // Remove existing with exact same address or tag + flatNo
        list = list.filter(item => {
          if (item.id === loc.id) return false;
          if (loc.flatNo && item.flatNo === loc.flatNo && item.shortAddress === loc.shortAddress) return false;
          return true;
        });

        const newEntry = {
          id: loc.id || `addr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          shortAddress: loc.shortAddress,
          address: loc.address,
          flatNo: loc.flatNo || '',
          landmark: loc.landmark || '',
          tag: loc.tag || 'Home',
          latitude: loc.latitude,
          longitude: loc.longitude,
          city: loc.city || 'Noida',
          state: loc.state || 'Uttar Pradesh',
          postalCode: loc.postalCode || '',
          eta: loc.eta || '20 mins',
          timestamp: Date.now()
        };

        list.unshift(newEntry);
        localStorage.setItem(SAVED_ADDRESSES_KEY, JSON.stringify(list));
        return newEntry;
      } catch (e) {}
    },

    deleteSavedAddress(id) {
      try {
        let list = this.getSavedAddresses();
        list = list.filter(a => a.id !== id);
        localStorage.setItem(SAVED_ADDRESSES_KEY, JSON.stringify(list));
      } catch (e) {}
    },

    getRecentLocations() {
      try {
        const raw = localStorage.getItem(RECENT_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {}
      return [];
    },

    addRecentLocation(loc) {
      try {
        let recents = this.getRecentLocations();
        recents = recents.filter(item =>
          item.shortAddress.toLowerCase() !== loc.shortAddress.toLowerCase() &&
          !(Math.abs(item.latitude - loc.latitude) < 0.0008 && Math.abs(item.longitude - loc.longitude) < 0.0008)
        );
        recents.unshift({
          shortAddress: loc.shortAddress,
          address: loc.address,
          city: loc.city,
          state: loc.state,
          postalCode: loc.postalCode,
          latitude: loc.latitude,
          longitude: loc.longitude,
          tag: loc.tag || 'Other',
          timestamp: Date.now()
        });
        if (recents.length > MAX_RECENT) {
          recents = recents.slice(0, MAX_RECENT);
        }
        localStorage.setItem(RECENT_KEY, JSON.stringify(recents));
      } catch (e) {}
    },

    getCurrentPosition() {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          const err = new Error('Geolocation is not supported by your browser');
          err.code = 'UNSUPPORTED';
          return reject(err);
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            });
          },
          (error) => {
            reject(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 9000,
            maximumAge: 30000
          }
        );
      });
    }
  };

  /**
   * -------------------------------------------------------------
   * FEATURE 8: NAVBAR SYNCHRONIZATION
   * -------------------------------------------------------------
   */
  function updateNavbarUI() {
    const loc = locationService.getLocation();
    const shortAddress = loc.shortAddress || 'Garhi, Noida';
    const eta = loc.eta || '20 mins';
    const headline = `Delivery in ${eta}`;
    const mobileHeadline = `⚡ ${eta}`;

    // Desktop navbar
    document.querySelectorAll('.header-location-subline').forEach(el => {
      el.textContent = shortAddress;
      el.setAttribute('title', loc.address || shortAddress);
    });

    document.querySelectorAll('.header-delivery-headline').forEach(el => {
      el.textContent = headline;
    });

    // Mobile navbar
    document.querySelectorAll('.header-location-subline-mobile').forEach(el => {
      el.textContent = shortAddress;
      el.setAttribute('title', loc.address || shortAddress);
    });

    document.querySelectorAll('.header-delivery-headline-mobile').forEach(el => {
      el.textContent = mobileHeadline;
    });
  }

  /**
   * -------------------------------------------------------------
   * MAP CONTROLLER & TILE LOADERS (Google Maps + Leaflet / OSM)
   * -------------------------------------------------------------
   */
  let googleMapsLoaded = false;
  let googleMapsLoadingPromise = null;
  let leafletLoaded = false;
  let leafletLoadingPromise = null;
  let googleMapsApiKey = '';
  let leafletMapInstance = null;
  let leafletAccuracyCircle = null;

  async function fetchMapsApiKey() {
    if (googleMapsApiKey) return googleMapsApiKey;
    try {
      const res = await fetch('/api/config/maps');
      if (res.ok) {
        const data = await res.json();
        if (data && data.apiKey) {
          googleMapsApiKey = data.apiKey;
          return googleMapsApiKey;
        }
      }
    } catch (e) {}
    return '';
  }

  function loadGoogleMapsScript() {
    if (googleMapsLoaded && window.google && window.google.maps) {
      return Promise.resolve(true);
    }
    if (googleMapsLoadingPromise) {
      return googleMapsLoadingPromise;
    }

    googleMapsLoadingPromise = new Promise(async (resolve) => {
      const key = await fetchMapsApiKey();

      if (!key || key.length < 6) {
        googleMapsLoaded = false;
        return resolve(false);
      }

      if (window.google && window.google.maps) {
        googleMapsLoaded = true;
        return resolve(true);
      }

      const script = document.createElement('script');
      script.id = 'google-maps-js-sdk';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        googleMapsLoaded = true;
        resolve(true);
      };
      script.onerror = () => {
        googleMapsLoaded = false;
        resolve(false);
      };
      document.head.appendChild(script);
    });

    return googleMapsLoadingPromise;
  }

  function loadLeafletAssets() {
    if (leafletLoaded && window.L) {
      return Promise.resolve(true);
    }
    if (leafletLoadingPromise) {
      return leafletLoadingPromise;
    }

    leafletLoadingPromise = new Promise((resolve) => {
      if (window.L) {
        leafletLoaded = true;
        return resolve(true);
      }

      // Add Leaflet CSS
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Add Leaflet JS
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => {
        leafletLoaded = true;
        resolve(true);
      };
      script.onerror = () => {
        console.warn('Leaflet map could not be loaded from CDN, falling back to canvas.');
        leafletLoaded = false;
        resolve(false);
      };
      document.head.appendChild(script);
    });

    return leafletLoadingPromise;
  }

  /**
   * -------------------------------------------------------------
   * LOCATION CONTROLLER STATE & MODAL DOM
   * -------------------------------------------------------------
   */
  let currentMapInstance = null;
  let currentCenterCoords = { lat: DEFAULT_LOCATION.latitude, lng: DEFAULT_LOCATION.longitude };
  let currentPendingAddress = null;
  let currentAvailability = null;
  let currentGpsAccuracy = null;
  let mapIdleDebounceTimer = null;
  let searchDebounceTimer = null;
  let isDetectingGps = false;
  let activeStep = 1; // Step 1: Map/Confirm, Step 2: Address Details Form
  let selectedAddressTag = 'Home';

  // Fallback map state for canvas when external scripts are unavailable
  let fallbackMapState = {
    isDragging: false,
    startX: 0,
    startY: 0,
    centerLat: DEFAULT_LOCATION.latitude,
    centerLng: DEFAULT_LOCATION.longitude,
    zoom: 15
  };

  function ensureModalInDOM() {
    let modal = document.getElementById('location-selection-modal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'location-selection-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'location-modal-title');
    modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 opacity-0 pointer-events-none transition-opacity duration-300';

    modal.innerHTML = `
      <div 
        id="location-modal-card" 
        class="bg-white rounded-t-3xl sm:rounded-3xl max-w-xl w-full p-0 shadow-2xl border border-stone-100 relative h-[92vh] sm:h-auto sm:max-h-[92vh] flex flex-col transform translate-y-6 sm:translate-y-0 sm:scale-95 transition-all duration-300 overflow-hidden"
      >
        <!-- Modal Top Bar -->
        <div class="px-5 py-3.5 border-b border-stone-100 flex items-center justify-between shrink-0 bg-white z-20">
          <div class="flex items-center gap-2.5">
            <button 
              type="button" 
              id="location-step-back-btn" 
              onclick="window.sabjihubLocation.goToStep(1)" 
              class="hidden w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Go back to map"
            >
              <i data-lucide="arrow-left" class="w-4 h-4"></i>
            </button>
            <div>
              <h3 id="location-modal-title" class="font-heading font-black text-base sm:text-lg text-emerald-950 leading-tight">
                Choose your delivery location
              </h3>
              <p id="location-modal-subtitle" class="text-xs font-medium text-stone-500">
                Get fresh groceries delivered to your doorstep
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onclick="window.sabjihubLocation.closeModal()" 
            class="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Close location modal"
          >
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <!-- ======================================================== -->
        <!-- STEP 1: MAP, SEARCH & LOCATION CONFIRMATION VIEW         -->
        <!-- ======================================================== -->
        <div id="location-step-1-view" class="flex-1 flex flex-col min-h-0 overflow-y-auto">
          
          <!-- Search Bar & Actions Container -->
          <div class="p-3.5 pb-2 bg-white space-y-2.5 shrink-0 z-10 border-b border-stone-100">
            
            <!-- Places Autocomplete Search Bar -->
            <div class="relative flex items-center">
              <i data-lucide="search" class="w-4 h-4 text-stone-400 absolute left-3.5 pointer-events-none"></i>
              <input 
                type="text" 
                id="location-search-input" 
                placeholder="Search area, sector, landmark or street..." 
                autocomplete="off"
                oninput="window.sabjihubLocation.handleSearchInput(this.value)"
                class="w-full pl-10 pr-10 py-2.5 bg-stone-50 hover:bg-stone-100/80 focus:bg-white border border-stone-200 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-500/15 rounded-2xl text-xs sm:text-sm font-semibold text-emerald-950 placeholder-stone-400 outline-none transition-all"
              />
              <div id="location-search-spinner" class="hidden absolute right-3 text-emerald-700">
                <i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i>
              </div>
            </div>

            <!-- Search Autocomplete Suggestions Dropdown -->
            <div id="location-search-suggestions" class="hidden space-y-1 max-h-48 overflow-y-auto pr-1"></div>

            <!-- Quick Action: Use My Current Location Button -->
            <div class="flex items-center gap-2">
              <button 
                type="button" 
                id="location-use-gps-btn" 
                onclick="window.sabjihubLocation.detectCurrentLocation()" 
                class="flex-1 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-300/80 text-emerald-900 transition-all flex items-center justify-center gap-2 group cursor-pointer text-xs font-bold shadow-2xs"
              >
                <div class="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <i data-lucide="navigation" class="w-3 h-3"></i>
                </div>
                <span>Use my current live location</span>
                <span id="location-gps-mini-spinner" class="hidden text-emerald-700">
                  <i data-lucide="loader-2" class="w-3 h-3 animate-spin"></i>
                </span>
              </button>

              <button 
                type="button" 
                onclick="window.sabjihubLocation.toggleSavedAddressesList()" 
                class="py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-stone-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs font-bold"
              >
                <i data-lucide="bookmark" class="w-3.5 h-3.5 text-stone-500"></i>
                <span>Saved</span>
              </button>
            </div>

            <!-- Error Banner (GPS Denied / Timeout) -->
            <div id="location-error-banner" class="hidden p-2.5 rounded-xl text-xs flex items-start gap-2.5"></div>
          </div>

          <!-- Saved Addresses Drawer (Collapsible) -->
          <div id="location-saved-drawer" class="hidden bg-stone-50 p-3.5 border-b border-stone-200 shrink-0 space-y-2 max-h-56 overflow-y-auto">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-black uppercase tracking-wider text-stone-500">Your Saved Delivery Addresses</span>
              <button type="button" onclick="window.sabjihubLocation.toggleSavedAddressesList()" class="text-stone-400 hover:text-stone-600 text-xs font-bold cursor-pointer">Close</button>
            </div>
            <div id="location-saved-addresses-list" class="space-y-1.5">
              <!-- Dynamically rendered -->
            </div>
          </div>

          <!-- ======================================================== -->
          <!-- INTERACTIVE MAP CONTAINER WITH FIXED CENTER PIN          -->
          <!-- ======================================================== -->
          <div class="relative w-full h-64 sm:h-72 bg-stone-100 overflow-hidden shrink-0 border-b border-stone-200 select-none">
            <!-- Map Viewport -->
            <div id="sabjihub-google-map" class="w-full h-full"></div>

            <!-- Fallback Canvas Map (Rendered only if external scripts fail) -->
            <div id="sabjihub-fallback-map" class="hidden absolute inset-0 bg-stone-200 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing">
              <canvas id="fallback-map-canvas" class="w-full h-full block"></canvas>
              <div class="absolute bottom-2 left-2 pointer-events-none bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-md">
                Drag map to adjust • Coordinates: <span id="fallback-coords-display">28.5580, 77.3320</span>
              </div>
            </div>

            <!-- FIXED PIN IN THE CENTER -->
            <div 
              id="map-fixed-center-pin" 
              class="absolute top-1/2 left-1/2 pointer-events-none z-20 flex flex-col items-center"
              style="transform: translate(-50%, -100%);"
            >
              <div class="relative flex flex-col items-center group">
                <!-- Location Label Pill over Pin -->
                <div class="mb-1 px-2.5 py-0.5 rounded-full bg-emerald-950 text-white text-[10px] font-bold shadow-md whitespace-nowrap flex items-center gap-1 border border-emerald-800">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Deliver here</span>
                </div>
                <!-- Custom Modern Pin Icon -->
                <div class="w-10 h-10 rounded-full bg-emerald-600 border-3 border-white shadow-xl flex items-center justify-center text-white transition-transform duration-200">
                  <i data-lucide="map-pin" class="w-5 h-5 fill-white"></i>
                </div>
                <!-- Pin Point Needle -->
                <div class="w-2 h-2.5 bg-emerald-600 rotate-45 -mt-1 shadow-xs border-r border-b border-white"></div>
                <!-- Stationary Shadow on Map -->
                <div class="w-4 h-1.5 bg-black/25 rounded-full blur-[1px] mt-0.5"></div>
              </div>
            </div>

            <!-- Map Floating Action Buttons (Re-center & Zoom) -->
            <div class="absolute bottom-3 right-3 z-20 flex flex-col gap-1.5">
              <button 
                type="button" 
                onclick="window.sabjihubLocation.detectCurrentLocation()" 
                title="Locate me (GPS)" 
                class="w-8 h-8 rounded-xl bg-white shadow-lg border border-stone-200 text-stone-700 hover:text-emerald-700 hover:bg-stone-50 flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
              >
                <i data-lucide="crosshair" class="w-4 h-4"></i>
              </button>
              <button 
                type="button" 
                onclick="window.sabjihubLocation.zoomMap(1)" 
                title="Zoom In" 
                class="w-8 h-8 rounded-xl bg-white shadow-lg border border-stone-200 text-stone-700 hover:text-emerald-700 hover:bg-stone-50 flex items-center justify-center font-bold text-sm transition-transform active:scale-95 cursor-pointer"
              >
                +
              </button>
              <button 
                type="button" 
                onclick="window.sabjihubLocation.zoomMap(-1)" 
                title="Zoom Out" 
                class="w-8 h-8 rounded-xl bg-white shadow-lg border border-stone-200 text-stone-700 hover:text-emerald-700 hover:bg-stone-50 flex items-center justify-center font-bold text-sm transition-transform active:scale-95 cursor-pointer"
              >
                −
              </button>
            </div>

            <!-- Map Dragging Hint -->
            <div class="absolute top-2 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
              <span class="px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-xs text-stone-700 text-[10px] font-bold shadow-xs border border-stone-200">
                Move map to place pin at your exact doorstep
              </span>
            </div>
          </div>

          <!-- ======================================================== -->
          <!-- SELECTED ADDRESS CARD & DELIVERY AVAILABILITY            -->
          <!-- ======================================================== -->
          <div class="p-4 bg-white space-y-3 flex-1 flex flex-col justify-between">
            <div class="space-y-2">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] font-black uppercase tracking-wider text-stone-400 block">Selected Delivery Location</span>
                    <span id="location-gps-accuracy-badge" class="hidden inline-flex items-center gap-1 px-2 py-0.2 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      <i data-lucide="navigation" class="w-2.5 h-2.5"></i>
                      <span id="location-gps-accuracy-text">Live GPS</span>
                    </span>
                  </div>
                  <h4 id="location-preview-short" class="font-bold text-sm sm:text-base text-emerald-950 truncate mt-0.5">Garhi, Noida</h4>
                  <p id="location-preview-full" class="text-xs text-stone-500 line-clamp-2 mt-0.5 leading-relaxed">Garhi Chaukhandi, Sector 68 / 121, Noida, Uttar Pradesh 201301</p>
                </div>
              </div>

              <!-- Serviceability / Delivery Availability Badge -->
              <div id="location-availability-badge" class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2">
                <div class="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <i data-lucide="check" class="w-3 h-3"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <span id="location-availability-text" class="font-bold text-xs text-emerald-950 block">✓ Delivery available</span>
                  <span id="location-availability-eta" class="text-[11px] text-emerald-800 font-medium block truncate">Delivery in 20 mins</span>
                </div>
              </div>
            </div>

            <!-- Action Buttons: Quick Confirm vs Add Detailed Info -->
            <div class="pt-1 space-y-2">
              <button 
                type="button" 
                id="location-confirm-now-btn" 
                onclick="window.sabjihubLocation.confirmCurrentLocationDirectly()" 
                class="w-full py-3 px-4 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Confirm & Deliver Here</span>
                <i data-lucide="check" class="w-4 h-4"></i>
              </button>
              
              <button 
                type="button" 
                id="location-add-details-btn" 
                onclick="window.sabjihubLocation.goToStep(2)" 
                class="w-full py-2 px-3 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-700 font-semibold text-xs border border-stone-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>+ Add House / Flat / Landmark Details</span>
              </button>
            </div>
          </div>

        </div>

        <!-- ======================================================== -->
        <!-- STEP 2: ADD DELIVERY DETAILS FORM                        -->
        <!-- ======================================================== -->
        <div id="location-step-2-view" class="hidden flex-1 flex flex-col min-h-0 overflow-y-auto p-5 space-y-4">
          
          <div class="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 flex items-start gap-3 shrink-0">
            <div class="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
              <i data-lucide="map-pin" class="w-4 h-4"></i>
            </div>
            <div class="min-w-0 flex-1">
              <span class="text-[10px] font-black uppercase tracking-wider text-stone-400">Delivering to</span>
              <p id="step2-short-address" class="text-xs font-bold text-emerald-950 truncate">Garhi, Noida</p>
              <p id="step2-full-address" class="text-[11px] text-stone-500 line-clamp-1 truncate">Garhi Chaukhandi, Sector 68, Noida</p>
            </div>
          </div>

          <!-- Form Fields -->
          <form id="location-details-form" onsubmit="window.sabjihubLocation.saveDeliveryDetails(event)" class="space-y-3.5 flex-1">
            
            <!-- House / Flat / Office / Floor No. (REQUIRED) -->
            <div>
              <label for="location-flat-no-input" class="block text-xs font-bold text-stone-700 mb-1">
                House / Flat / Office / Floor No. <span class="text-rose-500">*</span>
              </label>
              <input 
                type="text" 
                id="location-flat-no-input" 
                required 
                placeholder="e.g. Flat 402, Tower B or Shop 12" 
                class="w-full px-3.5 py-2.5 bg-stone-50 focus:bg-white border border-stone-200 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-500/15 rounded-xl text-xs font-semibold text-emerald-950 outline-none transition-all"
              />
              <span id="flat-no-error" class="hidden text-[10px] text-rose-600 font-semibold mt-1">Please enter your house/flat number</span>
            </div>

            <!-- Apartment / Road / Area (Pre-filled from map) -->
            <div>
              <label for="location-area-input" class="block text-xs font-bold text-stone-700 mb-1">
                Apartment / Road / Area
              </label>
              <input 
                type="text" 
                id="location-area-input" 
                placeholder="Apartment name, society or street" 
                class="w-full px-3.5 py-2.5 bg-stone-50 focus:bg-white border border-stone-200 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-500/15 rounded-xl text-xs font-semibold text-emerald-950 outline-none transition-all"
              />
            </div>

            <!-- Landmark (Optional) -->
            <div>
              <label for="location-landmark-input" class="block text-xs font-bold text-stone-700 mb-1">
                Landmark <span class="text-stone-400 font-normal">(optional)</span>
              </label>
              <input 
                type="text" 
                id="location-landmark-input" 
                placeholder="e.g. Near Metro Pillar 140, Opposite Park" 
                class="w-full px-3.5 py-2.5 bg-stone-50 focus:bg-white border border-stone-200 focus:border-emerald-600 focus:ring-3 focus:ring-emerald-500/15 rounded-xl text-xs font-semibold text-emerald-950 outline-none transition-all"
              />
            </div>

            <!-- Save Address As: Home / Work / Other -->
            <div>
              <span class="block text-xs font-bold text-stone-700 mb-1.5">Save address as</span>
              <div class="flex items-center gap-2">
                <button 
                  type="button" 
                  onclick="window.sabjihubLocation.selectAddressTag('Home')" 
                  id="tag-btn-Home" 
                  class="location-tag-btn px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                >
                  <i data-lucide="home" class="w-3.5 h-3.5"></i>
                  <span>Home</span>
                </button>
                <button 
                  type="button" 
                  onclick="window.sabjihubLocation.selectAddressTag('Work')" 
                  id="tag-btn-Work" 
                  class="location-tag-btn px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                >
                  <i data-lucide="briefcase" class="w-3.5 h-3.5"></i>
                  <span>Work</span>
                </button>
                <button 
                  type="button" 
                  onclick="window.sabjihubLocation.selectAddressTag('Other')" 
                  id="tag-btn-Other" 
                  class="location-tag-btn px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100"
                >
                  <i data-lucide="map-pin" class="w-3.5 h-3.5"></i>
                  <span>Other</span>
                </button>
              </div>
            </div>

            <!-- Submit Button: Save Address -->
            <div class="pt-3">
              <button 
                type="submit" 
                id="location-save-address-btn" 
                class="w-full py-3 px-4 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Save Address & Start Shopping</span>
                <i data-lucide="check" class="w-4 h-4"></i>
              </button>
            </div>
          </form>

        </div>

      </div>
    `;

    document.body.appendChild(modal);

    // Backdrop click listener
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        window.sabjihubLocation.closeModal();
      }
    });

    // ESC key listener
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        window.sabjihubLocation.closeModal();
      }
    });

    initFallbackMapDragging();

    if (window.lucide) window.lucide.createIcons();
    return modal;
  }

  /**
   * -------------------------------------------------------------
   * FALLBACK CANVAS MAP CONTROLLER (When neither GMaps nor Leaflet load)
   * -------------------------------------------------------------
   */
  function initFallbackMapDragging() {
    const fallbackEl = document.getElementById('sabjihub-fallback-map');
    const canvas = document.getElementById('fallback-map-canvas');
    if (!fallbackEl || !canvas) return;

    function renderFallbackCanvas() {
      const rect = fallbackEl.getBoundingClientRect();
      canvas.width = rect.width || 500;
      canvas.height = rect.height || 280;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#f4f4f5';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#dcfce7';
      ctx.beginPath();
      ctx.roundRect(canvas.width * 0.15, canvas.height * 0.1, canvas.width * 0.3, canvas.height * 0.35, 12);
      ctx.fill();

      ctx.beginPath();
      ctx.roundRect(canvas.width * 0.65, canvas.height * 0.5, canvas.width * 0.25, canvas.height * 0.4, 12);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height * 0.5);
      ctx.lineTo(canvas.width, canvas.height * 0.5);
      ctx.moveTo(canvas.width * 0.5, 0);
      ctx.lineTo(canvas.width * 0.5, canvas.height);
      ctx.stroke();

      ctx.strokeStyle = '#e4e4e7';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      ctx.arc(canvas.width * 0.85, canvas.height * 0.2, 35, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(5, 150, 105, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(canvas.width * 0.5, canvas.height * 0.5, 45, 0, Math.PI * 2);
      ctx.stroke();
    }

    fallbackEl.addEventListener('mousedown', (e) => {
      fallbackMapState.isDragging = true;
      fallbackMapState.startX = e.clientX;
      fallbackMapState.startY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!fallbackMapState.isDragging) return;
      const dx = e.clientX - fallbackMapState.startX;
      const dy = e.clientY - fallbackMapState.startY;
      fallbackMapState.startX = e.clientX;
      fallbackMapState.startY = e.clientY;

      const latShift = (dy * 0.0001);
      const lngShift = -(dx * 0.0001);
      fallbackMapState.centerLat += latShift;
      fallbackMapState.centerLng += lngShift;

      currentCenterCoords.lat = fallbackMapState.centerLat;
      currentCenterCoords.lng = fallbackMapState.centerLng;

      const coordsEl = document.getElementById('fallback-coords-display');
      if (coordsEl) coordsEl.textContent = `${currentCenterCoords.lat.toFixed(4)}, ${currentCenterCoords.lng.toFixed(4)}`;

      handleMapIdle(currentCenterCoords.lat, currentCenterCoords.lng);
    });

    window.addEventListener('mouseup', () => {
      fallbackMapState.isDragging = false;
    });

    fallbackEl.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        fallbackMapState.isDragging = true;
        fallbackMapState.startX = e.touches[0].clientX;
        fallbackMapState.startY = e.touches[0].clientY;
      }
    }, { passive: true });

    fallbackEl.addEventListener('touchmove', (e) => {
      if (!fallbackMapState.isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - fallbackMapState.startX;
      const dy = e.touches[0].clientY - fallbackMapState.startY;
      fallbackMapState.startX = e.touches[0].clientX;
      fallbackMapState.startY = e.touches[0].clientY;

      const latShift = (dy * 0.0001);
      const lngShift = -(dx * 0.0001);
      fallbackMapState.centerLat += latShift;
      fallbackMapState.centerLng += lngShift;

      currentCenterCoords.lat = fallbackMapState.centerLat;
      currentCenterCoords.lng = fallbackMapState.centerLng;

      const coordsEl = document.getElementById('fallback-coords-display');
      if (coordsEl) coordsEl.textContent = `${currentCenterCoords.lat.toFixed(4)}, ${currentCenterCoords.lng.toFixed(4)}`;

      handleMapIdle(currentCenterCoords.lat, currentCenterCoords.lng);
    }, { passive: true });

    fallbackEl.addEventListener('touchend', () => {
      fallbackMapState.isDragging = false;
    });

    setTimeout(renderFallbackCanvas, 100);
  }

  /**
   * -------------------------------------------------------------
   * MAP CONTROLLER: GOOGLE MAPS / LEAFLET OSM / CANVAS
   * -------------------------------------------------------------
   */
  async function initOrUpdateMap(lat, lng) {
    const mapDiv = document.getElementById('sabjihub-google-map');
    const fallbackDiv = document.getElementById('sabjihub-fallback-map');
    if (!mapDiv) return;

    currentCenterCoords = { lat, lng };

    // 1. Try Google Maps if API key is provided
    const isGoogleMapsReady = await loadGoogleMapsScript();

    if (isGoogleMapsReady && window.google && window.google.maps) {
      if (fallbackDiv) fallbackDiv.classList.add('hidden');
      mapDiv.classList.remove('hidden');

      if (!currentMapInstance || leafletMapInstance) {
        if (leafletMapInstance) {
          try { leafletMapInstance.remove(); } catch (e) {}
          leafletMapInstance = null;
        }
        currentMapInstance = new window.google.maps.Map(mapDiv, {
          center: { lat, lng },
          zoom: 16,
          disableDefaultUI: true,
          clickableIcons: false,
          gestureHandling: 'greedy',
          zoomControl: false
        });

        currentMapInstance.addListener('idle', () => {
          const center = currentMapInstance.getCenter();
          if (center) {
            const centerLat = center.lat();
            const centerLng = center.lng();
            currentCenterCoords = { lat: centerLat, lng: centerLng };
            handleMapIdle(centerLat, centerLng);
          }
        });
      } else {
        currentMapInstance.panTo({ lat, lng });
      }
      return;
    }

    // 2. Try Leaflet + OpenStreetMap tiles
    const isLeafletReady = await loadLeafletAssets();
    if (isLeafletReady && window.L) {
      if (fallbackDiv) fallbackDiv.classList.add('hidden');
      mapDiv.classList.remove('hidden');

      if (!leafletMapInstance) {
        leafletMapInstance = window.L.map(mapDiv, {
          center: [lat, lng],
          zoom: 16,
          zoomControl: false,
          attributionControl: false
        });

        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          subdomains: ['a', 'b', 'c']
        }).addTo(leafletMapInstance);

        leafletMapInstance.on('move', () => {
          const center = leafletMapInstance.getCenter();
          currentCenterCoords = { lat: center.lat, lng: center.lng };
        });

        leafletMapInstance.on('moveend', () => {
          const center = leafletMapInstance.getCenter();
          currentCenterCoords = { lat: center.lat, lng: center.lng };
          handleMapIdle(center.lat, center.lng);
        });

        currentMapInstance = null;
      } else {
        leafletMapInstance.setView([lat, lng], leafletMapInstance.getZoom() || 16, { animate: true });
        leafletMapInstance.invalidateSize();
      }

      // If accuracy is available, render accuracy circle
      if (currentGpsAccuracy && leafletMapInstance) {
        if (leafletAccuracyCircle) {
          leafletAccuracyCircle.remove();
        }
        leafletAccuracyCircle = window.L.circle([lat, lng], {
          radius: currentGpsAccuracy,
          color: '#059669',
          fillColor: '#10b981',
          fillOpacity: 0.15,
          weight: 1.5
        }).addTo(leafletMapInstance);
      }

      handleMapIdle(lat, lng);
      return;
    }

    // 3. Fallback Canvas Mode
    if (fallbackDiv) fallbackDiv.classList.remove('hidden');
    mapDiv.classList.add('hidden');

    fallbackMapState.centerLat = lat;
    fallbackMapState.centerLng = lng;
    const coordsEl = document.getElementById('fallback-coords-display');
    if (coordsEl) coordsEl.textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    handleMapIdle(lat, lng);
  }

  /**
   * Debounced reverse geocoding on map idle
   */
  function handleMapIdle(lat, lng) {
    clearTimeout(mapIdleDebounceTimer);

    const shortEl = document.getElementById('location-preview-short');
    if (shortEl) {
      shortEl.classList.add('animate-pulse');
    }

    mapIdleDebounceTimer = setTimeout(async () => {
      try {
        const geocoded = await geocodingService.reverseGeocode(lat, lng);
        currentPendingAddress = geocoded;

        updateSelectedAddressCard(geocoded);

        // Delivery Availability Check
        const avail = checkDeliveryAvailability(lat, lng);
        currentAvailability = avail;
        updateAvailabilityBadge(avail);
      } catch (e) {
        console.warn('Map idle geocode error:', e);
      } finally {
        if (shortEl) shortEl.classList.remove('animate-pulse');
      }
    }, 280);
  }

  function updateSelectedAddressCard(loc) {
    const shortEl = document.getElementById('location-preview-short');
    const fullEl = document.getElementById('location-preview-full');
    const step2Short = document.getElementById('step2-short-address');
    const step2Full = document.getElementById('step2-full-address');
    const areaInput = document.getElementById('location-area-input');
    const accuracyBadge = document.getElementById('location-gps-accuracy-badge');
    const accuracyText = document.getElementById('location-gps-accuracy-text');

    const shortText = loc.shortAddress || 'Detected Location';
    const fullText = loc.address || shortText;

    if (shortEl) shortEl.textContent = shortText;
    if (fullEl) fullEl.textContent = fullText;
    if (step2Short) step2Short.textContent = shortText;
    if (step2Full) step2Full.textContent = fullText;
    if (areaInput && !areaInput.value) {
      areaInput.value = shortText;
    }

    if (currentGpsAccuracy && accuracyBadge && accuracyText) {
      accuracyBadge.classList.remove('hidden');
      accuracyText.textContent = `Live GPS ±${Math.round(currentGpsAccuracy)}m`;
    } else if (accuracyBadge) {
      accuracyBadge.classList.add('hidden');
    }

    if (window.lucide) window.lucide.createIcons();
  }

  /**
   * Update Delivery Availability UI
   */
  function updateAvailabilityBadge(avail) {
    const badge = document.getElementById('location-availability-badge');
    const directBtn = document.getElementById('location-confirm-now-btn');
    if (!badge || !directBtn) return;

    if (avail.serviceable) {
      badge.className = 'p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5';
      badge.innerHTML = `
        <div class="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
          <i data-lucide="check" class="w-3 h-3"></i>
        </div>
        <div class="flex-1 min-w-0">
          <span class="font-bold text-xs text-emerald-950 block">✓ Delivery available</span>
          <span class="text-[11px] text-emerald-800 font-medium block truncate">${avail.message || `Delivery in ${avail.eta || '20 mins'}`}</span>
        </div>
      `;
      directBtn.disabled = false;
      directBtn.innerHTML = `<span>Confirm & Deliver Here</span><i data-lucide="check" class="w-4 h-4"></i>`;
      directBtn.className = 'w-full py-3 px-4 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer';
    } else {
      badge.className = 'p-2.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5';
      badge.innerHTML = `
        <div class="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
          <i data-lucide="alert-circle" class="w-3 h-3"></i>
        </div>
        <div class="flex-1 min-w-0">
          <span class="font-bold text-xs text-rose-950 block">⚠️ Out of Delivery Area</span>
          <span class="text-[11px] text-rose-800 font-medium block leading-tight">Sorry! We do not deliver to this location yet.</span>
        </div>
      `;
      directBtn.disabled = true;
      directBtn.innerHTML = `<span>Out of Delivery Zone</span><i data-lucide="map-pin" class="w-4 h-4"></i>`;
      directBtn.className = 'w-full py-3 px-4 rounded-2xl bg-stone-200 text-stone-500 font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-not-allowed opacity-75';
    }

    if (window.lucide) window.lucide.createIcons();
  }

  function showErrorBanner(type, message, showSearchBtn = false) {
    const banner = document.getElementById('location-error-banner');
    if (!banner) return;

    banner.classList.remove('hidden', 'bg-amber-50', 'border-amber-200', 'text-amber-900', 'bg-rose-50', 'border-rose-200', 'text-rose-900');

    const isDenied = type === 'DENIED';
    banner.classList.add(
      isDenied ? 'bg-amber-50' : 'bg-rose-50',
      'border',
      isDenied ? 'border-amber-200' : 'border-rose-200',
      isDenied ? 'text-amber-900' : 'text-rose-900'
    );

    banner.innerHTML = `
      <div class="w-6 h-6 rounded-lg ${isDenied ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'} flex items-center justify-center shrink-0 mt-0.5">
        <i data-lucide="alert-circle" class="w-4 h-4"></i>
      </div>
      <div class="flex-1 min-w-0">
        <h5 class="font-bold text-xs ${isDenied ? 'text-amber-950' : 'text-rose-950'}">
          ${isDenied ? 'Location access is turned off' : 'Location Detection Issue'}
        </h5>
        <p class="text-[11px] mt-0.5 leading-relaxed text-stone-600">
          ${message}
        </p>
        ${showSearchBtn ? `
          <button 
            type="button" 
            onclick="window.sabjihubLocation.focusSearchInput()" 
            class="mt-1.5 inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl font-bold text-[11px] text-emerald-800 shadow-2xs transition-colors cursor-pointer"
          >
            <i data-lucide="search" class="w-3 h-3 text-emerald-700"></i>
            <span>Search manually</span>
          </button>
        ` : ''}
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }

  function hideErrorBanner() {
    const banner = document.getElementById('location-error-banner');
    if (banner) {
      banner.classList.add('hidden');
      banner.innerHTML = '';
    }
  }

  /**
   * Render Saved Addresses List
   */
  function renderSavedAddressesList() {
    const container = document.getElementById('location-saved-addresses-list');
    if (!container) return;

    const saved = locationService.getSavedAddresses();

    if (saved.length === 0) {
      container.innerHTML = `
        <div class="p-3 text-center text-xs text-stone-500 bg-white rounded-xl border border-stone-200">
          No saved addresses yet. Save your home or work address for 1-click delivery!
        </div>
      `;
      return;
    }

    const tagIcons = {
      Home: 'home',
      Work: 'briefcase',
      Other: 'map-pin'
    };

    container.innerHTML = saved.map((item) => `
      <div class="p-2.5 rounded-xl bg-white border border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition-all flex items-center justify-between group shadow-2xs">
        <button 
          type="button" 
          onclick="window.sabjihubLocation.selectSavedAddress('${item.id}')" 
          class="flex items-start gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
        >
          <div class="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
            <i data-lucide="${tagIcons[item.tag] || 'map-pin'}" class="w-3.5 h-3.5"></i>
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-bold text-stone-900 group-hover:text-emerald-950">${item.tag || 'Saved'}</span>
              ${item.flatNo ? `<span class="text-[10px] text-stone-500 font-medium truncate">(${item.flatNo})</span>` : ''}
            </div>
            <p class="text-xs font-semibold text-emerald-950 truncate">${item.shortAddress}</p>
            <p class="text-[10px] text-stone-500 truncate">${item.address || ''}</p>
          </div>
        </button>
        <div class="flex items-center gap-1 shrink-0 ml-2">
          <button 
            type="button" 
            onclick="window.sabjihubLocation.deleteSavedAddress('${item.id}')" 
            title="Delete saved address" 
            class="w-6 h-6 rounded-md hover:bg-rose-50 text-stone-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <i data-lucide="trash-2" class="w-3 h-3"></i>
          </button>
        </div>
      </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  /**
   * -------------------------------------------------------------
   * PUBLIC CONTROLLER INTERFACE (window.sabjihubLocation)
   * -------------------------------------------------------------
   */
  window.sabjihubLocation = {
    geocodingService,
    locationService,
    checkDeliveryAvailability,

    /**
     * Open Location Selection Modal
     */
    async openModal() {
      const modal = ensureModalInDOM();
      this.goToStep(1);
      hideErrorBanner();
      renderSavedAddressesList();

      const loc = locationService.getLocation();
      currentCenterCoords = { lat: loc.latitude, lng: loc.longitude };
      currentPendingAddress = loc;

      updateSelectedAddressCard(loc);
      const avail = checkDeliveryAvailability(loc.latitude, loc.longitude);
      currentAvailability = avail;
      updateAvailabilityBadge(avail);

      modal.classList.remove('opacity-0', 'pointer-events-none');
      const card = document.getElementById('location-modal-card');
      if (card) {
        card.classList.remove('translate-y-6', 'scale-95');
        card.classList.add('translate-y-0', 'scale-100');
      }
      document.body.classList.add('overflow-hidden');

      setTimeout(() => {
        initOrUpdateMap(loc.latitude, loc.longitude);
      }, 150);
    },

    /**
     * Close Location Selection Modal
     */
    closeModal() {
      const modal = document.getElementById('location-selection-modal');
      if (modal) {
        modal.classList.add('opacity-0', 'pointer-events-none');
        const card = document.getElementById('location-modal-card');
        if (card) {
          card.classList.remove('translate-y-0', 'scale-100');
          card.classList.add('translate-y-6', 'sm:scale-95');
        }
      }
      document.body.classList.remove('overflow-hidden');
    },

    /**
     * Direct Quick Confirm: Save Current Map Coordinates as Delivery Location
     */
    confirmCurrentLocationDirectly() {
      if (!currentAvailability || !currentAvailability.serviceable) {
        if (typeof window.showToast === 'function') {
          window.showToast('Please select a location within our delivery zone', 'error');
        }
        return;
      }

      const shortAddress = currentPendingAddress?.shortAddress || 'Detected Location';
      const fullAddress = currentPendingAddress?.address || shortAddress;

      const finalRecord = {
        latitude: currentCenterCoords.lat,
        longitude: currentCenterCoords.lng,
        accuracy: currentGpsAccuracy || null,
        shortAddress,
        address: fullAddress,
        flatNo: '',
        landmark: '',
        tag: 'Home',
        city: currentPendingAddress?.city || 'Noida',
        state: currentPendingAddress?.state || 'Uttar Pradesh',
        postalCode: currentPendingAddress?.postalCode || '201301',
        country: currentPendingAddress?.country || 'India',
        eta: currentAvailability?.eta || '20 mins',
        timestamp: Date.now()
      };

      locationService.saveLocation(finalRecord);

      try {
        localStorage.setItem('freshmart_location', JSON.stringify(finalRecord));
      } catch (e) {}

      if (typeof window.showToast === 'function') {
        window.showToast(`📍 Delivery location set to ${shortAddress}!`, 'success');
      }

      this.closeModal();
    },

    /**
     * Toggle Step 1 (Map) vs Step 2 (Address Details)
     */
    goToStep(step) {
      activeStep = step;
      const step1 = document.getElementById('location-step-1-view');
      const step2 = document.getElementById('location-step-2-view');
      const backBtn = document.getElementById('location-step-back-btn');
      const title = document.getElementById('location-modal-title');
      const subtitle = document.getElementById('location-modal-subtitle');

      if (step === 2) {
        if (step1) step1.classList.add('hidden');
        if (step2) step2.classList.remove('hidden');
        if (backBtn) backBtn.classList.remove('hidden');
        if (title) title.textContent = 'Add delivery details';
        if (subtitle) subtitle.textContent = 'Help the delivery partner find your doorstep quickly';

        const flatInput = document.getElementById('location-flat-no-input');
        const areaInput = document.getElementById('location-area-input');
        if (currentPendingAddress && areaInput && !areaInput.value) {
          areaInput.value = currentPendingAddress.shortAddress || '';
        }
        if (flatInput) {
          flatInput.focus();
        }
      } else {
        if (step1) step1.classList.remove('hidden');
        if (step2) step2.classList.add('hidden');
        if (backBtn) backBtn.classList.add('hidden');
        if (title) title.textContent = 'Choose your delivery location';
        if (subtitle) subtitle.textContent = 'Get fresh groceries delivered to your doorstep';
      }

      if (window.lucide) window.lucide.createIcons();
    },

    /**
     * Address Tag Selector: Home / Work / Other
     */
    selectAddressTag(tag) {
      selectedAddressTag = tag;
      document.querySelectorAll('.location-tag-btn').forEach(btn => {
        btn.className = 'location-tag-btn px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100';
      });
      const activeBtn = document.getElementById(`tag-btn-${tag}`);
      if (activeBtn) {
        activeBtn.className = 'location-tag-btn px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer bg-emerald-600 text-white border-emerald-600 shadow-2xs';
      }
    },

    /**
     * Save Detailed Address Form & Update Navbar
     */
    saveDeliveryDetails(event) {
      if (event) event.preventDefault();

      const flatInput = document.getElementById('location-flat-no-input');
      const areaInput = document.getElementById('location-area-input');
      const landmarkInput = document.getElementById('location-landmark-input');
      const errEl = document.getElementById('flat-no-error');

      const flatNo = (flatInput?.value || '').trim();
      if (!flatNo) {
        if (errEl) errEl.classList.remove('hidden');
        if (flatInput) flatInput.focus();
        return;
      }
      if (errEl) errEl.classList.add('hidden');

      const customArea = (areaInput?.value || '').trim();
      const landmark = (landmarkInput?.value || '').trim();

      const shortAddress = customArea || currentPendingAddress?.shortAddress || 'Garhi, Noida';
      const fullAddress = `${flatNo}, ${shortAddress}${landmark ? ' (Near ' + landmark + ')' : ''}`;

      const finalRecord = {
        latitude: currentCenterCoords.lat,
        longitude: currentCenterCoords.lng,
        accuracy: currentGpsAccuracy || null,
        shortAddress,
        address: fullAddress,
        flatNo,
        landmark,
        tag: selectedAddressTag,
        city: currentPendingAddress?.city || 'Noida',
        state: currentPendingAddress?.state || 'Uttar Pradesh',
        postalCode: currentPendingAddress?.postalCode || '201301',
        country: currentPendingAddress?.country || 'India',
        eta: currentAvailability?.eta || '20 mins',
        timestamp: Date.now()
      };

      locationService.saveLocation(finalRecord);

      try {
        localStorage.setItem('freshmart_location', JSON.stringify(finalRecord));
      } catch (e) {}

      if (typeof window.showToast === 'function') {
        window.showToast(`📍 Delivery location set to ${shortAddress}!`, 'success');
      }

      this.closeModal();
    },

    /**
     * Use My Current Location (GPS API)
     */
    async detectCurrentLocation() {
      if (isDetectingGps) return;
      isDetectingGps = true;

      hideErrorBanner();
      const miniSpinner = document.getElementById('location-gps-mini-spinner');
      if (miniSpinner) miniSpinner.classList.remove('hidden');

      try {
        const coords = await locationService.getCurrentPosition();
        currentCenterCoords = { lat: coords.latitude, lng: coords.longitude };
        currentGpsAccuracy = coords.accuracy;

        // Pan Map to detected position
        if (currentMapInstance) {
          currentMapInstance.panTo({ lat: coords.latitude, lng: coords.longitude });
          currentMapInstance.setZoom(16);
        } else if (leafletMapInstance) {
          leafletMapInstance.setView([coords.latitude, coords.longitude], 16, { animate: true });
          if (leafletAccuracyCircle) {
            leafletAccuracyCircle.remove();
          }
          if (coords.accuracy) {
            leafletAccuracyCircle = window.L.circle([coords.latitude, coords.longitude], {
              radius: coords.accuracy,
              color: '#059669',
              fillColor: '#10b981',
              fillOpacity: 0.15,
              weight: 1.5
            }).addTo(leafletMapInstance);
          }
        } else {
          fallbackMapState.centerLat = coords.latitude;
          fallbackMapState.centerLng = coords.longitude;
          const coordsEl = document.getElementById('fallback-coords-display');
          if (coordsEl) coordsEl.textContent = `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
        }

        // Reverse geocode live GPS coordinates
        const geocoded = await geocodingService.reverseGeocode(coords.latitude, coords.longitude);
        currentPendingAddress = geocoded;
        updateSelectedAddressCard(geocoded);

        // Check availability
        const avail = checkDeliveryAvailability(coords.latitude, coords.longitude);
        currentAvailability = avail;
        updateAvailabilityBadge(avail);
      } catch (err) {
        let msg = '';
        let isDenied = false;

        if (err.code === 1 || err.code === 'PERMISSION_DENIED') {
          isDenied = true;
          msg = 'Location permission is required to detect your live location. Please allow location access or search your area manually.';
        } else if (err.code === 2 || err.code === 'POSITION_UNAVAILABLE') {
          msg = 'Unable to detect your GPS position. Please check device location settings or search manually.';
        } else if (err.code === 3 || err.code === 'TIMEOUT') {
          msg = 'Location detection timed out. Please try again.';
        } else {
          msg = err.message || 'Unable to access live GPS. Please search manually.';
        }

        showErrorBanner(isDenied ? 'DENIED' : 'ERROR', msg, true);
      } finally {
        isDetectingGps = false;
        if (miniSpinner) miniSpinner.classList.add('hidden');
      }
    },

    /**
     * Places Autocomplete Search Handler
     */
    handleSearchInput(val) {
      clearTimeout(searchDebounceTimer);
      const query = (val || '').trim();
      const suggestionsEl = document.getElementById('location-search-suggestions');
      const spinner = document.getElementById('location-search-spinner');

      if (query.length < 2) {
        if (suggestionsEl) {
          suggestionsEl.classList.add('hidden');
          suggestionsEl.innerHTML = '';
        }
        if (spinner) spinner.classList.add('hidden');
        return;
      }

      if (spinner) spinner.classList.remove('hidden');

      searchDebounceTimer = setTimeout(async () => {
        try {
          const results = await geocodingService.searchPlaces(query);
          if (spinner) spinner.classList.add('hidden');

          if (!suggestionsEl) return;

          if (!Array.isArray(results) || results.length === 0) {
            suggestionsEl.innerHTML = `
              <div class="p-3 text-center text-xs text-stone-500 bg-stone-50 rounded-xl">
                No matching delivery places found for "${query}". Try searching a nearby sector or landmark.
              </div>
            `;
            suggestionsEl.classList.remove('hidden');
            return;
          }

          suggestionsEl.innerHTML = results.map((item, idx) => `
            <button 
              type="button" 
              onclick="window.sabjihubLocation.selectSearchResult(${idx})" 
              class="w-full p-2.5 rounded-xl hover:bg-emerald-50 text-left transition-colors flex items-start gap-2.5 border border-stone-150 hover:border-emerald-400 group cursor-pointer bg-white"
            >
              <div class="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                <i data-lucide="map-pin" class="w-3.5 h-3.5"></i>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-bold text-emerald-950 truncate">${item.shortAddress}</p>
                <p class="text-[10px] text-stone-500 truncate leading-relaxed">${item.address}</p>
              </div>
            </button>
          `).join('');

          suggestionsEl.classList.remove('hidden');
          if (window.lucide) window.lucide.createIcons();

          window.__lastPlaceSearchResults = results;
        } catch (err) {
          if (spinner) spinner.classList.add('hidden');
          if (suggestionsEl) {
            suggestionsEl.innerHTML = `
              <div class="p-3 text-center text-xs text-stone-500 bg-stone-50 rounded-xl">
                Search unavailable. Please pick a nearby area from the map.
              </div>
            `;
            suggestionsEl.classList.remove('hidden');
          }
        }
      }, 240);
    },

    /**
     * Select a Place Suggestion -> Pan Map & Center Pin
     */
    async selectSearchResult(idx) {
      const results = window.__lastPlaceSearchResults || [];
      const item = results[idx];
      if (!item) return;

      const suggestionsEl = document.getElementById('location-search-suggestions');
      if (suggestionsEl) suggestionsEl.classList.add('hidden');
      const searchInput = document.getElementById('location-search-input');
      if (searchInput) searchInput.value = item.shortAddress;

      let lat = item.latitude;
      let lng = item.longitude;

      if (!lat || !lng) {
        const details = await geocodingService.resolvePlaceDetails(item.id || item.placeId, item.address);
        lat = details.lat;
        lng = details.lng;
      }

      currentCenterCoords = { lat, lng };
      currentGpsAccuracy = null; // Clear GPS accuracy badge for searched locations

      if (currentMapInstance) {
        currentMapInstance.panTo({ lat, lng });
        currentMapInstance.setZoom(16);
      } else if (leafletMapInstance) {
        leafletMapInstance.setView([lat, lng], 16, { animate: true });
        if (leafletAccuracyCircle) {
          leafletAccuracyCircle.remove();
          leafletAccuracyCircle = null;
        }
      } else {
        fallbackMapState.centerLat = lat;
        fallbackMapState.centerLng = lng;
        const coordsEl = document.getElementById('fallback-coords-display');
        if (coordsEl) coordsEl.textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }

      currentPendingAddress = {
        latitude: lat,
        longitude: lng,
        shortAddress: item.shortAddress,
        address: item.address,
        city: item.city || 'Noida',
        state: item.state || 'Uttar Pradesh',
        postalCode: item.postalCode || '201301'
      };

      updateSelectedAddressCard(currentPendingAddress);

      const avail = checkDeliveryAvailability(lat, lng);
      currentAvailability = avail;
      updateAvailabilityBadge(avail);
    },

    /**
     * Select Saved Address (1-Click selection)
     */
    selectSavedAddress(id) {
      const saved = locationService.getSavedAddresses();
      const item = saved.find(a => a.id === id);
      if (!item) return;

      locationService.saveLocation(item);
      try {
        localStorage.setItem('freshmart_location', JSON.stringify(item));
      } catch (e) {}

      if (typeof window.showToast === 'function') {
        window.showToast(`📍 Delivery location set to ${item.tag}: ${item.shortAddress}!`, 'success');
      }

      this.closeModal();
    },

    deleteSavedAddress(id) {
      locationService.deleteSavedAddress(id);
      renderSavedAddressesList();
    },

    toggleSavedAddressesList() {
      const drawer = document.getElementById('location-saved-drawer');
      if (drawer) {
        drawer.classList.toggle('hidden');
        renderSavedAddressesList();
      }
    },

    focusSearchInput() {
      const input = document.getElementById('location-search-input');
      if (input) {
        input.focus();
        input.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    },

    zoomMap(delta) {
      if (currentMapInstance) {
        const curZoom = currentMapInstance.getZoom() || 16;
        currentMapInstance.setZoom(curZoom + delta);
      } else if (leafletMapInstance) {
        const curZoom = leafletMapInstance.getZoom() || 16;
        leafletMapInstance.setZoom(curZoom + delta);
      } else {
        fallbackMapState.zoom = Math.max(12, Math.min(18, fallbackMapState.zoom + delta));
      }
    }
  };

  // Aliases for global HTML button calls
  window.openLocationModal = () => window.sabjihubLocation.openModal();
  window.closeLocationModal = () => window.sabjihubLocation.closeModal();
  window.detectLiveGPSLocation = () => window.sabjihubLocation.detectCurrentLocation();

  /**
   * Bootstrap on DOM Ready
   */
  function initLocationSystem() {
    ensureModalInDOM();
    updateNavbarUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLocationSystem);
  } else {
    initLocationSystem();
  }

})();
