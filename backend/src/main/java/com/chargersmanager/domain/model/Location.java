package com.chargersmanager.domain.model;

import java.util.Objects;

/**
 * Value Object representing the physical location of a Charger.
 * Immutable by design.
 */
public final class Location {

    private final String address;
    private final double latitude;
    private final double longitude;

    public Location(String address, double latitude, double longitude) {
        this.address = Objects.requireNonNull(address, "Address cannot be null");
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public String getAddress() { return address; }
    public double getLatitude() { return latitude; }
    public double getLongitude() { return longitude; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Location)) return false;
        Location that = (Location) o;
        return Double.compare(that.latitude, latitude) == 0
                && Double.compare(that.longitude, longitude) == 0
                && Objects.equals(address, that.address);
    }

    @Override
    public int hashCode() {
        return Objects.hash(address, latitude, longitude);
    }
}
