import { UNIVERSITY_CENTRE, loadGoogleMaps } from "@/lib/google-maps";

export interface ProximityToCampus {
  distance_to_campus_km: number;
  walk_time_minutes: number;
  bus_time_minutes: number;
  drive_time_minutes: number;
}

type TravelMode = "WALKING" | "TRANSIT" | "DRIVING";

async function getMatrixLeg(
  google: any,
  origin: { lat: number; lng: number },
  mode: TravelMode
): Promise<{ durationMinutes: number; distanceKm: number } | null> {
  const service = new google.maps.DistanceMatrixService();
  return new Promise((resolve) => {
    const request: any = {
      origins: [origin],
      destinations: [UNIVERSITY_CENTRE],
      travelMode: google.maps.TravelMode[mode],
      unitSystem: google.maps.UnitSystem.METRIC,
    };
    if (mode === "TRANSIT") {
      request.transitOptions = {
        modes: [google.maps.TransitMode.BUS],
        routingPreference: google.maps.TransitRoutePreference.FEWER_TRANSFERS,
      };
    }
    service.getDistanceMatrix(request, (response: any, status: string) => {
      if (status !== "OK" || !response) {
        resolve(null);
        return;
      }
      const element = response.rows?.[0]?.elements?.[0];
      if (!element || element.status !== "OK") {
        resolve(null);
        return;
      }
      resolve({
        durationMinutes: Math.round((element.duration?.value ?? 0) / 60),
        distanceKm: (element.distance?.value ?? 0) / 1000,
      });
    });
  });
}

/**
 * Returns walk / transit / drive times + distance from `origin` to the
 * University Centre. Any leg that fails (e.g. transit unavailable) returns 0.
 */
export async function fetchProximityToUC(origin: {
  lat: number;
  lng: number;
}): Promise<ProximityToCampus> {
  const google = await loadGoogleMaps();
  const [walk, transit, drive] = await Promise.all([
    getMatrixLeg(google, origin, "WALKING"),
    getMatrixLeg(google, origin, "TRANSIT"),
    getMatrixLeg(google, origin, "DRIVING"),
  ]);

  // Driving leg has the most reliable straight-line-ish distance reading.
  // Fall back to walking distance if driving is missing.
  const distance_to_campus_km = drive?.distanceKm ?? walk?.distanceKm ?? 0;

  return {
    distance_to_campus_km: Number(distance_to_campus_km.toFixed(2)),
    walk_time_minutes: walk?.durationMinutes ?? 0,
    bus_time_minutes: transit?.durationMinutes ?? 0,
    drive_time_minutes: drive?.durationMinutes ?? 0,
  };
}
