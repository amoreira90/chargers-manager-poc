package com.chargersmanager.domain.model;

import java.util.Objects;

/**
 * Value Object representing the power output of a Charger in kW.
 */
public final class PowerOutput {

    private final double kilowatts;

    private PowerOutput(double kilowatts) {
        if (kilowatts <= 0) {
            throw new IllegalArgumentException("Power output must be positive");
        }
        this.kilowatts = kilowatts;
    }

    public static PowerOutput of(double kilowatts) {
        return new PowerOutput(kilowatts);
    }

    public double getKilowatts() {
        return kilowatts;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof PowerOutput)) return false;
        PowerOutput that = (PowerOutput) o;
        return Double.compare(that.kilowatts, kilowatts) == 0;
    }

    @Override
    public int hashCode() {
        return Objects.hash(kilowatts);
    }

    @Override
    public String toString() {
        return kilowatts + " kW";
    }
}
