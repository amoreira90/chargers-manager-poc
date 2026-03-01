package com.chargersmanager.domain.model;

import java.util.UUID;

/**
 * Domain root entity (Aggregate Root).
 * Contains pure business logic with no external dependencies.
 */
public class Charger {

    private final ChargerId id;
    private String name;
    private ChargerStatus status;
    private Location location;
    private PowerOutput powerOutput;

    public Charger(ChargerId id, String name, Location location, PowerOutput powerOutput) {
        this.id = id;
        this.name = name;
        this.location = location;
        this.powerOutput = powerOutput;
        this.status = ChargerStatus.AVAILABLE;
    }

    public static Charger create(String name, Location location, PowerOutput powerOutput) {
        return new Charger(ChargerId.generate(), name, location, powerOutput);
    }

    public void activate() {
        if (this.status == ChargerStatus.OUT_OF_SERVICE) {
            throw new IllegalStateException("Cannot activate a charger that is out of service");
        }
        this.status = ChargerStatus.AVAILABLE;
    }

    public void deactivate() {
        this.status = ChargerStatus.OUT_OF_SERVICE;
    }

    public void startCharging() {
        if (this.status != ChargerStatus.AVAILABLE) {
            throw new IllegalStateException("Charger is not available for charging");
        }
        this.status = ChargerStatus.CHARGING;
    }

    public void stopCharging() {
        if (this.status != ChargerStatus.CHARGING) {
            throw new IllegalStateException("Charger is not currently charging");
        }
        this.status = ChargerStatus.AVAILABLE;
    }

    public boolean isAvailable() {
        return this.status == ChargerStatus.AVAILABLE;
    }

    public ChargerId getId() { return id; }
    public String getName() { return name; }
    public ChargerStatus getStatus() { return status; }
    public Location getLocation() { return location; }
    public PowerOutput getPowerOutput() { return powerOutput; }
}
