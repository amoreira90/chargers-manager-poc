package com.chargersmanager.domain.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Domain unit tests. No Spring context, no database required.
 * Verifies the business logic of the Charger entity.
 */
class ChargerTest {

    private Charger createCharger() {
        return Charger.create(
                "Charger A",
                new Location("Calle Falsa 123", -34.6, -58.4),
                PowerOutput.of(22.0)
        );
    }

    @Test
    void newChargerShouldBeAvailable() {
        Charger charger = createCharger();
        assertEquals(ChargerStatus.AVAILABLE, charger.getStatus());
        assertTrue(charger.isAvailable());
    }

    @Test
    void startChargingShouldChangeStatusToCharging() {
        Charger charger = createCharger();
        charger.startCharging();
        assertEquals(ChargerStatus.CHARGING, charger.getStatus());
    }

    @Test
    void stopChargingShouldReturnToAvailable() {
        Charger charger = createCharger();
        charger.startCharging();
        charger.stopCharging();
        assertEquals(ChargerStatus.AVAILABLE, charger.getStatus());
    }

    @Test
    void startChargingWhenNotAvailableShouldThrow() {
        Charger charger = createCharger();
        charger.deactivate();
        assertThrows(IllegalStateException.class, charger::startCharging);
    }

    @Test
    void deactivateShouldSetOutOfService() {
        Charger charger = createCharger();
        charger.deactivate();
        assertEquals(ChargerStatus.OUT_OF_SERVICE, charger.getStatus());
    }
}
