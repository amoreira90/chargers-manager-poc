package com.chargersmanager.infrastructure.adapter.rest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

/**
 * DTO de entrada para la API REST. Desacoplado del modelo de dominio.
 */
public record ChargerRequest(
        @NotBlank(message = "Name is required")
        String name,

        @NotBlank(message = "Address is required")
        String address,

        double latitude,
        double longitude,

        @Positive(message = "Power output must be positive")
        double powerKilowatts
) {}
