package com.chargersmanager.infrastructure.adapter.persistence.mapper;

import com.chargersmanager.domain.model.Charger;
import com.chargersmanager.domain.model.ChargerId;
import com.chargersmanager.domain.model.Location;
import com.chargersmanager.domain.model.PowerOutput;
import com.chargersmanager.infrastructure.adapter.persistence.entity.ChargerEntity;
import com.chargersmanager.infrastructure.adapter.persistence.entity.ChargerStatusEntity;
import org.springframework.stereotype.Component;

/**
 * Mapper between JPA entities and domain objects.
 * Ensures both worlds remain completely decoupled.
 */
@Component
public class ChargerPersistenceMapper {

    public ChargerEntity toEntity(Charger charger) {
        return new ChargerEntity(
                charger.getId().getValue(),
                charger.getName(),
                ChargerStatusEntity.valueOf(charger.getStatus().name()),
                charger.getLocation().getAddress(),
                charger.getLocation().getLatitude(),
                charger.getLocation().getLongitude(),
                charger.getPowerOutput().getKilowatts()
        );
    }

    public Charger toDomain(ChargerEntity entity) {
        return new Charger(
                ChargerId.of(entity.getId()),
                entity.getName(),
                new Location(entity.getAddress(), entity.getLatitude(), entity.getLongitude()),
                PowerOutput.of(entity.getPowerKilowatts())
        ) {{
            if (entity.getStatus() == ChargerStatusEntity.OUT_OF_SERVICE) deactivate();
            else if (entity.getStatus() == ChargerStatusEntity.CHARGING) startCharging();
        }};
    }
}
