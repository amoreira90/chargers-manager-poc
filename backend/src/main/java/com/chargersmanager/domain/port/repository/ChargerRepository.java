package com.chargersmanager.domain.port.repository;

import com.chargersmanager.domain.model.Charger;
import com.chargersmanager.domain.model.ChargerId;
import com.chargersmanager.domain.model.ChargerStatus;

import java.util.List;
import java.util.Optional;

/**
 * Domain persistence contract.
 * The domain depends on this abstraction (DIP), never on the concrete implementation.
 */
public interface ChargerRepository {
    Charger save(Charger charger);
    Optional<Charger> findById(ChargerId id);
    List<Charger> findAll();
    List<Charger> findByStatus(ChargerStatus status);
    void deleteById(ChargerId id);
    boolean existsById(ChargerId id);
}
