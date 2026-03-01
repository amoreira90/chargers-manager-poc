package com.chargersmanager.infrastructure.adapter.persistence.entity;

/**
 * Persistence enum. Separated from the domain enum for layer independence.
 */
public enum ChargerStatusEntity {
    AVAILABLE,
    CHARGING,
    OUT_OF_SERVICE
}
