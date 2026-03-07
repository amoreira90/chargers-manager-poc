package com.chargersmanager.application.service;

import com.chargersmanager.domain.exception.ChargerNotFoundException;
import com.chargersmanager.domain.model.Charger;
import com.chargersmanager.domain.model.ChargerId;
import com.chargersmanager.domain.model.ChargerStatus;
import com.chargersmanager.domain.model.Location;
import com.chargersmanager.domain.model.PowerOutput;
import com.chargersmanager.domain.port.usecase.CreateChargerCommand;
import com.chargersmanager.domain.port.usecase.CreateChargerUseCase;
import com.chargersmanager.domain.port.usecase.FindChargerUseCase;
import com.chargersmanager.domain.port.usecase.UpdateChargerStatusUseCase;
import com.chargersmanager.domain.port.repository.ChargerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Application service that implements the use cases.
 * Orchestrates the flow between ports without holding business logic.
 *
 * Implements multiple use case interfaces (ISP): each interface has a single responsibility.
 */
@Service
@Transactional
public class ChargerService implements CreateChargerUseCase, FindChargerUseCase, UpdateChargerStatusUseCase {

    private final ChargerRepository chargerRepository;

    // Constructor injection (DIP): depends on the abstraction, not the implementation
    public ChargerService(ChargerRepository chargerRepository) {
        this.chargerRepository = chargerRepository;
    }

    @Override
    public Charger createCharger(CreateChargerCommand command) {
        Charger charger = Charger.create(
                command.name(),
                new Location(command.address(), command.latitude(), command.longitude()),
                PowerOutput.of(command.powerKilowatts())
        );
        return chargerRepository.save(charger);
    }

    @Override
    @Transactional(readOnly = true)
    public Charger findById(ChargerId id) {
        return chargerRepository.findById(id)
                .orElseThrow(() -> new ChargerNotFoundException(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Charger> findAll() {
        return chargerRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Charger> findAvailable() {
        return chargerRepository.findByStatus(ChargerStatus.AVAILABLE);
    }

    @Override
    public Charger activate(ChargerId id) {
        Charger charger = findById(id);
        charger.activate();
        return chargerRepository.save(charger);
    }

    @Override
    public Charger deactivate(ChargerId id) {
        Charger charger = findById(id);
        charger.deactivate();
        return chargerRepository.save(charger);
    }

    @Override
    public Charger startCharging(ChargerId id) {
        Charger charger = findById(id);
        charger.startCharging();
        return chargerRepository.save(charger);
    }

    @Override
    public Charger stopCharging(ChargerId id) {
        Charger charger = findById(id);
        charger.stopCharging();
        return chargerRepository.save(charger);
    }
}
