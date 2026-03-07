package com.chargersmanager.domain.port.usecase;

import com.chargersmanager.domain.model.Charger;
import com.chargersmanager.domain.model.ChargerId;

/**
 * Use case for updating the status of a Charger.
 */
public interface UpdateChargerStatusUseCase {
    Charger activate(ChargerId id);
    Charger deactivate(ChargerId id);
    Charger startCharging(ChargerId id);
    Charger stopCharging(ChargerId id);
}
