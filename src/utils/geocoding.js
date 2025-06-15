import fetch from 'node-fetch';

/**
 * Geocoding service using OpenStreetMap Nominatim API (completely free)
 * No API key required, no usage limits
 */

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const USER_AGENT = 'GenHands-Charity-App/1.0'; // Required by Nominatim

/**
 * Geocode an address to coordinates using OpenStreetMap Nominatim
 * @param {string} address - The address to geocode
 * @param {string} countryCode - Country code for better results (default: 'ke' for Kenya)
 * @returns {Promise<Object>} - Geocoding result with coordinates and formatted address
 */
export const geocodeAddress = async (address, countryCode = 'ke') => {
  try {
    if (!address || typeof address !== 'string') {
      throw new Error('Address is required and must be a string');
    }

    const searchParams = new URLSearchParams({
      format: 'json',
      q: address.trim(),
      limit: '1',
      countrycodes: countryCode,
      addressdetails: '1'
    });

    const response = await fetch(
      `${NOMINATIM_BASE_URL}/search?${searchParams.toString()}`,
      {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      throw new Error('Address not found or could not be geocoded');
    }

    const result = data[0];

    return {
      success: true,
      coordinates: [parseFloat(result.lat), parseFloat(result.lon)],
      formattedAddress: result.display_name,
      confidence: result.importance || 0.5,
      addressComponents: {
        country: result.address?.country,
        state: result.address?.state,
        city: result.address?.city || result.address?.town || result.address?.village,
        suburb: result.address?.suburb,
        road: result.address?.road,
        houseNumber: result.address?.house_number,
        postcode: result.address?.postcode
      },
      boundingBox: result.boundingbox ? {
        south: parseFloat(result.boundingbox[0]),
        north: parseFloat(result.boundingbox[1]),
        west: parseFloat(result.boundingbox[2]),
        east: parseFloat(result.boundingbox[3])
      } : null
    };

  } catch (error) {
    console.error('Geocoding error:', error.message);

    return {
      success: false,
      error: error.message,
      coordinates: null,
      formattedAddress: null
    };
  }
};

/**
 * Reverse geocode coordinates to address
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>} - Reverse geocoding result
 */
export const reverseGeocode = async (lat, lon) => {
  try {
    if (typeof lat !== 'number' || typeof lon !== 'number') {
      throw new Error('Latitude and longitude must be numbers');
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      throw new Error('Invalid coordinates provided');
    }

    const searchParams = new URLSearchParams({
      format: 'json',
      lat: lat.toString(),
      lon: lon.toString(),
      addressdetails: '1'
    });

    const response = await fetch(
      `${NOMINATIM_BASE_URL}/reverse?${searchParams.toString()}`,
      {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'application/json'
        },
        timeout: 10000
      }
    );

    if (!response.ok) {
      throw new Error(`Reverse geocoding API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data || data.error) {
      throw new Error('Location not found or could not be reverse geocoded');
    }

    return {
      success: true,
      address: data.display_name,
      addressComponents: {
        country: data.address?.country,
        state: data.address?.state,
        city: data.address?.city || data.address?.town || data.address?.village,
        suburb: data.address?.suburb,
        road: data.address?.road,
        houseNumber: data.address?.house_number,
        postcode: data.address?.postcode
      }
    };

  } catch (error) {
    console.error('Reverse geocoding error:', error.message);

    return {
      success: false,
      error: error.message,
      address: null
    };
  }
};

/**
 * Search for addresses with autocomplete suggestions
 * @param {string} query - Search query
 * @param {number} limit - Number of results to return (default: 5)
 * @param {string} countryCode - Country code (default: 'ke')
 * @returns {Promise<Array>} - Array of address suggestions
 */
export const searchAddresses = async (query, limit = 5, countryCode = 'ke') => {
  try {
    if (!query || typeof query !== 'string' || query.trim().length < 3) {
      return {
        success: true,
        suggestions: []
      };
    }

    const searchParams = new URLSearchParams({
      format: 'json',
      q: query.trim(),
      limit: Math.min(limit, 10).toString(), // Cap at 10 results
      countrycodes: countryCode,
      addressdetails: '1'
    });

    const response = await fetch(
      `${NOMINATIM_BASE_URL}/search?${searchParams.toString()}`,
      {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'application/json'
        },
        timeout: 8000
      }
    );

    if (!response.ok) {
      throw new Error(`Address search API error: ${response.status}`);
    }

    const data = await response.json();

    const suggestions = data.map(item => ({
      displayName: item.display_name,
      coordinates: [parseFloat(item.lat), parseFloat(item.lon)],
      type: item.type,
      importance: item.importance || 0,
      addressComponents: {
        country: item.address?.country,
        state: item.address?.state,
        city: item.address?.city || item.address?.town || item.address?.village,
        suburb: item.address?.suburb,
        road: item.address?.road,
        houseNumber: item.address?.house_number,
        postcode: item.address?.postcode
      }
    }));

    return {
      success: true,
      suggestions
    };

  } catch (error) {
    console.error('Address search error:', error.message);

    return {
      success: false,
      error: error.message,
      suggestions: []
    };
  }
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {Array<number>} coord1 - [lat, lon] of first point
 * @param {Array<number>} coord2 - [lat, lon] of second point
 * @returns {number} - Distance in kilometers
 */
export const calculateDistance = (coord1, coord2) => {
  if (!coord1 || !coord2 || coord1.length !== 2 || coord2.length !== 2) {
    throw new Error('Invalid coordinates provided');
  }

  const [lat1, lon1] = coord1;
  const [lat2, lon2] = coord2;

  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

/**
 * Validate coordinates
 * @param {Array<number>} coordinates - [lat, lon]
 * @returns {boolean} - True if coordinates are valid
 */
export const validateCoordinates = (coordinates) => {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    return false;
  }

  const [lat, lon] = coordinates;

  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    lat >= -90 && lat <= 90 &&
    lon >= -180 && lon <= 180
  );
};
