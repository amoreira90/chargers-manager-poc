package com.chargersmanager.infrastructure.adapter.rest.mapper;

import com.chargersmanager.domain.model.Charger;
import com.chargersmanager.domain.port.usecase.CreateChargerCommand;
import com.chargersmanager.infrastructure.adapter.rest.dto.ChargerRequest;
import com.chargersmanager.infrastructure.adapter.rest.dto.ChargerResponse;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Mapper between REST DTOs and domain objects/commands.
 * Keeps the domain isolated from the HTTP representation.
 */
@Component
public class ChargerRestMapper {

    public CreateChargerCommand toCommand(ChargerRequest request) {
        return new CreateChargerCommand(
                request.name(),
                request.address(),
                request.latitude(),
                request.longitude(),
                request.powerKilowatts()
        );
    }

    public ChargerResponse toResponse(Charger charger) {
        return new ChargerResponse(
                charger.getId().getValue(),
                charger.getName(),
                charger.getStatus().name(),
                charger.getLocation().getAddress(),
                charger.getLocation().getLatitude(),
                charger.getLocation().getLongitude(),
                charger.getPowerOutput().getKilowatts()
        );
    }

    public List<ChargerResponse> toResponseList(List<Charger> chargers) {
        return chargers.stream().map(this::toResponse).toList();
    }
}
