function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function movePoint(lat, lon, dLatMeters, dLonMeters) {
  const earthRadius = 6378137;
  const dLat = (dLatMeters / earthRadius) * (180 / Math.PI);
  const dLon = (dLonMeters / (earthRadius * Math.cos(Math.PI * lat / 180))) * (180 / Math.PI);
  return { lat: lat + dLat, lon: lon + dLon };
}

export function spreadPoints(points, minDistanceMeters = 10, iterations = 30, damping = 0.3) {
  const spread = [...points.map(p => ({ ...p }))];

  for (let iter = 0; iter < iterations; iter++) {
    const displacements = spread.map(() => ({ dx: 0, dy: 0 }));

    for (let i = 0; i < spread.length; i++) {
      for (let j = 0; j < spread.length; j++) {
        if (i === j) continue;

        const p1 = spread[i];
        const p2 = spread[j];
        const dist = haversineDistance(p1.lat, p1.lon, p2.lat, p2.lon);

        if (dist < minDistanceMeters) {
        let dx, dy, angle;

        if (dist === 0) {
            // Deterministic angle based on index
            const radiusFactor = 0.5; // smaller to gently separate exact overlaps
            angle = (i + 1) * 137.508; // golden angle in degrees (~137.5°)
            const angleRad = angle * Math.PI / 180;

            dx = Math.cos(angleRad) * radiusFactor;
            dy = Math.sin(angleRad) * radiusFactor;
        } else {
            dx = p1.lon - p2.lon;
            dy = p1.lat - p2.lat;
            angle = Math.atan2(dy, dx);
            dx = Math.cos(angle);
            dy = Math.sin(angle);
        }

        const push = (minDistanceMeters - dist) * damping;
        displacements[i].dx += dx * push;
        displacements[i].dy += dy * push;
        }
      }
    }

    // Apply displacements
    for (let i = 0; i < spread.length; i++) {
      const { lat, lon } = spread[i];
      const { dx, dy } = displacements[i];
      spread[i] = movePoint(lat, lon, dy, dx);
    }
  }

  return spread;
}
