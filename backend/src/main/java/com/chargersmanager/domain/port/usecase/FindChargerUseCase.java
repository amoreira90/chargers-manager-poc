package com.chargersmanager.domain.port.usecase;

import com.chargersmanager.domain.model.Charger;
import com.chargersmanager.domain.model.ChargerId;

import java.util.List;

/**
 * Use case for querying Chargers.
 */
public interface FindChargerUseCase {
    Charger findById(ChargerId id);
    List<Charger> findAll();
    List<Charger> findAvailable();
}
