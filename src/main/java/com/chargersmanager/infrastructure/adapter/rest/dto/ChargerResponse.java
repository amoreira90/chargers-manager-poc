package com.chargersmanager.infrastructure.adapter.rest.dto;

/**
 * DTO de salida para la API REST. Desacoplado del modelo de dominio.
 */
public record ChargerResponse(
        String id,
        String name,
        String status,
        String address,
        double latitude,
        double longitude,
        double powerKilowatts
) {}
