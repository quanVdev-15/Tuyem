export const reverseGeocode = async (latitude, longitude) => {
  try {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      console.error('Reverse geocoding failed: Latitude or longitude is not a number', { latitude, longitude });
      return {
        street: 'Unknown Street',
        city: 'Hanoi',
        fullAddress: 'Hanoi, Vietnam'
      };
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'quannm-tuy-em/1.0 (mquan15160@gmail.com)' // Replace with your app name, version, and contact email
        }
      }
    );

    if (!response.ok) {
      console.error(`Reverse geocoding failed with status: ${response.status}`);
      const errorText = await response.text();
      console.error('Response body:', errorText);
      return {
        street: 'Unknown Street',
        city: 'Hanoi',
        fullAddress: 'Hanoi, Vietnam'
      };
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Reverse geocoding failed: Non-JSON response received');
      const errorText = await response.text();
      console.error('Response body:', errorText);
      return {
        street: 'Unknown Street',
        city: 'Hanoi',
        fullAddress: 'Hanoi, Vietnam'
      };
    }

    const data = await response.json();

    const address = data.address;
    return {
      street: address.road || address.pedestrian || address.footway || '',
      quarter: address.suburb || address.neighbourhood || address.quarter || '',
      city: address.city || address.town || address.village || 'Hanoi',
      fullAddress: data.display_name
    };
  } catch (error) {
    console.error('Reverse geocoding failed (network error):', error);
    return {
      street: 'Unknown Street',
      city: 'Hanoi',
      fullAddress: 'Hanoi, Vietnam'
    };
  }
};