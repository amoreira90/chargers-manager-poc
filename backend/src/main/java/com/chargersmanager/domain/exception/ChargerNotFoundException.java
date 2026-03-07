package com.chargersmanager.domain.exception;

import com.chargersmanager.domain.model.ChargerId;

/**
 * Domain exception thrown when a Charger cannot be found.
 */
public class ChargerNotFoundException extends DomainException {

    public ChargerNotFoundException(ChargerId id) {
        super("Charger not found with id: " + id.getValue());
    }
}
