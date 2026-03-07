package com.chargersmanager.domain.model;

import java.util.Objects;
import java.util.UUID;

/**
 * Value Object representing the unique identifier of a Charger.
 * Immutable by design (SOLID - SRP, DIP).
 */
public final class ChargerId {

    private final String value;

    private ChargerId(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("ChargerId cannot be null or blank");
        }
        this.value = value;
    }

    public static ChargerId of(String value) {
        return new ChargerId(value);
    }

    public static ChargerId generate() {
        return new ChargerId(UUID.randomUUID().toString());
    }

    public String getValue() {
        return value;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ChargerId)) return false;
        ChargerId that = (ChargerId) o;
        return Objects.equals(value, that.value);
    }

    @Override
    public int hashCode() {
        return Objects.hash(value);
    }

    @Override
    public String toString() {
        return value;
    }
}
