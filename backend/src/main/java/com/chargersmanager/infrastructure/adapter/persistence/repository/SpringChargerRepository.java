package com.chargersmanager.infrastructure.adapter.persistence.repository;

import com.chargersmanager.infrastructure.adapter.persistence.entity.ChargerEntity;
import com.chargersmanager.infrastructure.adapter.persistence.entity.ChargerStatusEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Spring Data JPA repository (infrastructure detail).
 * Never exposed outside the infrastructure layer.
 */
public interface SpringChargerRepository extends JpaRepository<ChargerEntity, String> {
    List<ChargerEntity> findByStatus(ChargerStatusEntity status);
}
