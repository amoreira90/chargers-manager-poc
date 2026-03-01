package com.chargersmanager.infrastructure.adapter.persistence;

import com.chargersmanager.domain.model.Charger;
import com.chargersmanager.domain.model.ChargerId;
import com.chargersmanager.domain.model.ChargerStatus;
import com.chargersmanager.domain.port.repository.ChargerRepository;
import com.chargersmanager.infrastructure.adapter.persistence.entity.ChargerStatusEntity;
import com.chargersmanager.infrastructure.adapter.persistence.mapper.ChargerPersistenceMapper;
import com.chargersmanager.infrastructure.adapter.persistence.repository.SpringChargerRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * Persistence adapter.
 * Implements the ChargerRepository contract using Spring Data JPA.
 * The domain has no knowledge of JPA, only of the contract.
 */
@Component
public class ChargerRepositoryAdapter implements ChargerRepository {

    private final SpringChargerRepository springRepository;
    private final ChargerPersistenceMapper mapper;

    public ChargerRepositoryAdapter(SpringChargerRepository springRepository, ChargerPersistenceMapper mapper) {
        this.springRepository = springRepository;
        this.mapper = mapper;
    }

    @Override
    public Charger save(Charger charger) {
        var entity = mapper.toEntity(charger);
        var savedEntity = springRepository.save(entity);
        return mapper.toDomain(savedEntity);
    }

    @Override
    public Optional<Charger> findById(ChargerId id) {
        return springRepository.findById(id.getValue()).map(mapper::toDomain);
    }

    @Override
    public List<Charger> findAll() {
        return springRepository.findAll().stream().map(mapper::toDomain).toList();
    }

    @Override
    public List<Charger> findByStatus(ChargerStatus status) {
        return springRepository.findByStatus(ChargerStatusEntity.valueOf(status.name()))
                .stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public void deleteById(ChargerId id) {
        springRepository.deleteById(id.getValue());
    }

    @Override
    public boolean existsById(ChargerId id) {
        return springRepository.existsById(id.getValue());
    }
}
