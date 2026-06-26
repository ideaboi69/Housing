"use client";

import { useEffect, useRef } from "react";
import { GOOGLE_MAPS_KEY, GUELPH_BOUNDS, loadGoogleMaps } from "@/lib/google-maps";

export interface AddressSelection {
  address: string;         // Street-level address (e.g., "78 College Ave W")
  fullAddress: string;     // Full formatted address from Google
  postalCode?: string;
  city?: string;
  region?: string;
  country?: string;
  lat: number;
  lng: number;
}

interface Props {
  value: string;
  onChange: (text: string) => void;
  onSelect: (selection: AddressSelection) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  required?: boolean;
  disabled?: boolean;
  id?: string;
}

/**
 * Google Places Autocomplete input restricted to addresses around Guelph.
 * Falls back to a plain controlled input if the Maps API can't load.
 */
export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  className,
  style,
  required,
  disabled,
  id,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const listenerRef = useRef<any>(null);

  useEffect(() => {
    if (!GOOGLE_MAPS_KEY || !inputRef.current) return;
    let cancelled = false;

    async function init() {
      try {
        const google = await loadGoogleMaps(["places"]);
        if (cancelled || !inputRef.current) return;

        const bounds = new google.maps.LatLngBounds(
          { lat: GUELPH_BOUNDS.south, lng: GUELPH_BOUNDS.west },
          { lat: GUELPH_BOUNDS.north, lng: GUELPH_BOUNDS.east }
        );

        const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          fields: ["formatted_address", "address_components", "geometry", "name"],
          componentRestrictions: { country: "ca" },
          bounds,
          strictBounds: false,
          types: ["address"],
        });
        autocompleteRef.current = autocomplete;

        listenerRef.current = autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (!place?.geometry?.location) return;

          const components: Array<{ long_name: string; short_name: string; types: string[] }> =
            place.address_components || [];

          const find = (...types: string[]) =>
            components.find((c) => types.every((t) => c.types.includes(t)));

          const streetNumber = find("street_number")?.long_name ?? "";
          const route = find("route")?.long_name ?? "";
          const city =
            find("locality")?.long_name ||
            find("postal_town")?.long_name ||
            find("administrative_area_level_2")?.long_name ||
            "";
          const region = find("administrative_area_level_1")?.short_name ?? "";
          const country = find("country")?.short_name ?? "";
          const postalCode = find("postal_code")?.long_name ?? "";

          const streetAddress = [streetNumber, route].filter(Boolean).join(" ").trim();
          const fullAddress: string = place.formatted_address ?? streetAddress;
          // Prefer street-level if available; otherwise fall back to formatted.
          const address = streetAddress
            ? [streetAddress, city].filter(Boolean).join(", ")
            : fullAddress;

          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();

          onChange(address);
          onSelect({
            address,
            fullAddress,
            postalCode,
            city,
            region,
            country,
            lat,
            lng,
          });
        });

        // Prevent Enter from submitting the form when picking from the dropdown.
        const onKeyDown = (e: KeyboardEvent) => {
          if (e.key === "Enter") e.preventDefault();
        };
        inputRef.current.addEventListener("keydown", onKeyDown);
        (inputRef.current as any).__autocompleteKeyHandler = onKeyDown;
      } catch (err) {
        console.error("AddressAutocomplete init failed:", err);
      }
    }

    init();

    return () => {
      cancelled = true;
      if (listenerRef.current?.remove) listenerRef.current.remove();
      listenerRef.current = null;
      if (inputRef.current && (inputRef.current as any).__autocompleteKeyHandler) {
        inputRef.current.removeEventListener(
          "keydown",
          (inputRef.current as any).__autocompleteKeyHandler
        );
      }
      autocompleteRef.current = null;
    };
    // We intentionally don't re-run on onChange/onSelect changes — Autocomplete
    // attaches once to the input. The latest callbacks are read via refs in
    // userland code (caller manages stable refs via useCallback when needed).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      autoComplete="off"
      className={className}
      style={style}
    />
  );
}
