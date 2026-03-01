package com.chargersmanager.infrastructure.adapter.persistence.entity;

import jakarta.persistence.*;

/**
 * JPA persistence entity. Completely separate from the domain model.
 * Allows the database schema to evolve independently from the domain.
 */
@Entity
@Table(name = "chargers")
public class ChargerEntity {

    @Id
    @Column(name = "id", nullable = false, unique = true)
    private String id;

    @Column(name = "name", nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ChargerStatusEntity status;

    @Column(name = "address", nullable = false)
    private String address;

    @Column(name = "latitude", nullable = false)
    private double latitude;

    @Column(name = "longitude", nullable = false)
    private double longitude;

    @Column(name = "power_kilowatts", nullable = false)
    private double powerKilowatts;

    protected ChargerEntity() {}

    public ChargerEntity(String id, String name, ChargerStatusEntity status,
                         String address, double latitude, double longitude, double powerKilowatts) {
        this.id = id;
        this.name = name;
        this.status = status;
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
        this.powerKilowatts = powerKilowatts;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public ChargerStatusEntity getStatus() { return status; }
    public String getAddress() { return address; }
    public double getLatitude() { return latitude; }
    public double getLongitude() { return longitude; }
    public double getPowerKilowatts() { return powerKilowatts; }

    public void setStatus(ChargerStatusEntity status) { this.status = status; }
}
