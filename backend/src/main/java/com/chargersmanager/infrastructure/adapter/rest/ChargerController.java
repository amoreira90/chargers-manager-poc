package com.chargersmanager.infrastructure.adapter.rest;

import com.chargersmanager.domain.model.ChargerId;
import com.chargersmanager.domain.port.usecase.CreateChargerUseCase;
import com.chargersmanager.domain.port.usecase.FindChargerUseCase;
import com.chargersmanager.domain.port.usecase.UpdateChargerStatusUseCase;
import com.chargersmanager.infrastructure.adapter.rest.dto.ChargerRequest;
import com.chargersmanager.infrastructure.adapter.rest.dto.ChargerResponse;
import com.chargersmanager.infrastructure.adapter.rest.mapper.ChargerRestMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST adapter. Translates HTTP requests into domain use cases.
 * Only aware of DTOs and use case interfaces, not the service implementation.
 */
@RestController
@RequestMapping("/api/v1/chargers")
@Tag(name = "Chargers", description = "Gestión del ciclo de vida de cargadores eléctricos")
public class ChargerController {

    private final CreateChargerUseCase createChargerUseCase;
    private final FindChargerUseCase findChargerUseCase;
    private final UpdateChargerStatusUseCase updateChargerStatusUseCase;
    private final ChargerRestMapper mapper;

    public ChargerController(
            CreateChargerUseCase createChargerUseCase,
            FindChargerUseCase findChargerUseCase,
            UpdateChargerStatusUseCase updateChargerStatusUseCase,
            ChargerRestMapper mapper) {
        this.createChargerUseCase = createChargerUseCase;
        this.findChargerUseCase = findChargerUseCase;
        this.updateChargerStatusUseCase = updateChargerStatusUseCase;
        this.mapper = mapper;
    }

    @PostMapping
    @Operation(summary = "Crear cargador", description = "Registra un nuevo cargador eléctrico. El estado inicial es AVAILABLE.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Cargador creado exitosamente"),
        @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos")
    })
    public ResponseEntity<ChargerResponse> create(@Valid @RequestBody ChargerRequest request) {
        var charger = createChargerUseCase.createCharger(mapper.toCommand(request));
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toResponse(charger));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener cargador por ID", description = "Retorna los datos de un cargador específico.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Cargador encontrado"),
        @ApiResponse(responseCode = "404", description = "Cargador no encontrado")
    })
    public ResponseEntity<ChargerResponse> findById(@PathVariable String id) {
        var charger = findChargerUseCase.findById(ChargerId.of(id));
        return ResponseEntity.ok(mapper.toResponse(charger));
    }

    @GetMapping
    @Operation(summary = "Listar todos los cargadores", description = "Retorna la lista completa de cargadores registrados.")
    @ApiResponse(responseCode = "200", description = "Lista de cargadores")
    public ResponseEntity<List<ChargerResponse>> findAll() {
        var chargers = findChargerUseCase.findAll();
        return ResponseEntity.ok(mapper.toResponseList(chargers));
    }

    @GetMapping("/available")
    @Operation(summary = "Listar cargadores disponibles", description = "Retorna solo los cargadores en estado AVAILABLE.")
    @ApiResponse(responseCode = "200", description = "Lista de cargadores disponibles")
    public ResponseEntity<List<ChargerResponse>> findAvailable() {
        var chargers = findChargerUseCase.findAvailable();
        return ResponseEntity.ok(mapper.toResponseList(chargers));
    }

    @PatchMapping("/{id}/activate")
    @Operation(summary = "Activar cargador", description = "Activa un cargador poniendo su estado en AVAILABLE. No válido si está OUT_OF_SERVICE.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Cargador activado"),
        @ApiResponse(responseCode = "404", description = "Cargador no encontrado"),
        @ApiResponse(responseCode = "409", description = "Transición de estado inválida (estaba OUT_OF_SERVICE)")
    })
    public ResponseEntity<ChargerResponse> activate(@PathVariable String id) {
        var charger = updateChargerStatusUseCase.activate(ChargerId.of(id));
        return ResponseEntity.ok(mapper.toResponse(charger));
    }

    @PatchMapping("/{id}/deactivate")
    @Operation(summary = "Desactivar cargador", description = "Pone el cargador en estado OUT_OF_SERVICE.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Cargador desactivado"),
        @ApiResponse(responseCode = "404", description = "Cargador no encontrado")
    })
    public ResponseEntity<ChargerResponse> deactivate(@PathVariable String id) {
        var charger = updateChargerStatusUseCase.deactivate(ChargerId.of(id));
        return ResponseEntity.ok(mapper.toResponse(charger));
    }

    @PatchMapping("/{id}/start-charging")
    @Operation(summary = "Iniciar carga", description = "Inicia la carga en un cargador. Solo válido si el estado es AVAILABLE.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Carga iniciada"),
        @ApiResponse(responseCode = "404", description = "Cargador no encontrado"),
        @ApiResponse(responseCode = "409", description = "El cargador no está disponible para cargar")
    })
    public ResponseEntity<ChargerResponse> startCharging(@PathVariable String id) {
        var charger = updateChargerStatusUseCase.startCharging(ChargerId.of(id));
        return ResponseEntity.ok(mapper.toResponse(charger));
    }

    @PatchMapping("/{id}/stop-charging")
    @Operation(summary = "Detener carga", description = "Detiene la carga activa. Solo válido si el estado es CHARGING.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Carga detenida"),
        @ApiResponse(responseCode = "404", description = "Cargador no encontrado"),
        @ApiResponse(responseCode = "409", description = "El cargador no está en proceso de carga")
    })
    public ResponseEntity<ChargerResponse> stopCharging(@PathVariable String id) {
        var charger = updateChargerStatusUseCase.stopCharging(ChargerId.of(id));
        return ResponseEntity.ok(mapper.toResponse(charger));
    }
}
