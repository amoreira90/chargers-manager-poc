package com.chargersmanager.domain.port.usecase;

/**
 * Immutable command for the CreateCharger use case.
 * Encapsulates validated input data.
 */
public record CreateChargerCommand(
        String name,
        String address,
        double latitude,
        double longitude,
        double powerKilowatts
) {
    public CreateChargerCommand {
        if (name == null || name.isBlank()) throw new IllegalArgumentException("Name is required");
        if (address == null || address.isBlank()) throw new IllegalArgumentException("Address is required");
        if (powerKilowatts <= 0) throw new IllegalArgumentException("Power output must be positive");
    }
}
