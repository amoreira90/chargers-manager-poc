package com.chargersmanager.application.service;

import com.chargersmanager.domain.exception.ChargerNotFoundException;
import com.chargersmanager.domain.model.*;
import com.chargersmanager.domain.port.usecase.CreateChargerCommand;
import com.chargersmanager.domain.port.repository.ChargerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for the application service.
 * Uses Mockito to mock the repository (DIP in action).
 */
@ExtendWith(MockitoExtension.class)
class ChargerServiceTest {

    @Mock
    private ChargerRepository chargerRepository;

    private ChargerService chargerService;

    @BeforeEach
    void setUp() {
        chargerService = new ChargerService(chargerRepository);
    }

    @Test
    void createChargerShouldSaveAndReturn() {
        var command = new CreateChargerCommand("Test", "Av. Siempre Viva", -34.6, -58.4, 22.0);
        var charger = Charger.create("Test", new Location("Av. Siempre Viva", -34.6, -58.4), PowerOutput.of(22.0));
        when(chargerRepository.save(any())).thenReturn(charger);

        var result = chargerService.createCharger(command);

        assertNotNull(result);
        verify(chargerRepository, times(1)).save(any());
    }

    @Test
    void findByIdShouldThrowWhenNotFound() {
        var id = ChargerId.generate();
        when(chargerRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ChargerNotFoundException.class, () -> chargerService.findById(id));
    }
}
