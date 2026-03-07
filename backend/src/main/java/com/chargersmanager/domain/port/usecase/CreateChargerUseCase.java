package com.chargersmanager.domain.port.usecase;

import com.chargersmanager.domain.model.Charger;

/**
 * Use case for creating a Charger.
 * Follows ISP: small, focused interface per use case.
 */
public interface CreateChargerUseCase {
    Charger createCharger(CreateChargerCommand command);
}
