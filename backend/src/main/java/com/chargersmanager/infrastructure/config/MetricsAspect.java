package com.chargersmanager.infrastructure.config;

import com.chargersmanager.domain.exception.DomainException;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.AfterThrowing;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

/**
 * Cross-cutting metrics aspect.
 * Automatically records timers and counters for use cases and adapters.
 * Metrics are exposed via /actuator/prometheus for Prometheus scraping.
 *
 * Custom metrics recorded:
 *   usecase.executions       (counter, tags: name, status=success|error)
 *   usecase.duration         (timer,   tags: name)
 *   rest.requests            (counter, tags: method, status=success|error)
 *   persistence.operations   (counter, tags: operation, status=success|error)
 *   domain.violations        (counter, tags: type)
 */
@Aspect
@Component
public class MetricsAspect {

    private final MeterRegistry registry;

    public MetricsAspect(MeterRegistry registry) {
        this.registry = registry;
    }

    // --- Pointcuts ---

    @Pointcut("execution(* com.chargersmanager.application.service..*(..))")
    private void applicationLayer() {}

    @Pointcut("execution(* com.chargersmanager.infrastructure.adapter.rest..*(..))")
    private void restAdapter() {}

    @Pointcut("execution(* com.chargersmanager.infrastructure.adapter.persistence..*(..))")
    private void persistenceAdapter() {}

    @Pointcut("applicationLayer() || restAdapter() || persistenceAdapter()")
    private void allLayers() {}

    // --- Use case metrics ---

    @Around("applicationLayer()")
    public Object recordUseCaseMetrics(ProceedingJoinPoint pjp) throws Throwable {
        String useCaseName = pjp.getSignature().getName();
        long start = System.currentTimeMillis();
        String status = "success";
        try {
            Object result = pjp.proceed();
            return result;
        } catch (Exception ex) {
            status = "error";
            throw ex;
        } finally {
            long duration = System.currentTimeMillis() - start;
            Counter.builder("usecase.executions")
                    .tag("name", useCaseName)
                    .tag("status", status)
                    .description("Total use case executions")
                    .register(registry)
                    .increment();
            Timer.builder("usecase.duration")
                    .tag("name", useCaseName)
                    .description("Use case execution duration")
                    .register(registry)
                    .record(duration, TimeUnit.MILLISECONDS);
        }
    }

    // --- REST adapter metrics ---

    @Around("restAdapter()")
    public Object recordRestMetrics(ProceedingJoinPoint pjp) throws Throwable {
        String methodName = pjp.getSignature().getName();
        String status = "success";
        try {
            return pjp.proceed();
        } catch (Exception ex) {
            status = "error";
            throw ex;
        } finally {
            Counter.builder("rest.requests")
                    .tag("method", methodName)
                    .tag("status", status)
                    .description("Total REST adapter requests")
                    .register(registry)
                    .increment();
        }
    }

    // --- Persistence adapter metrics ---

    @Around("persistenceAdapter()")
    public Object recordPersistenceMetrics(ProceedingJoinPoint pjp) throws Throwable {
        String operation = pjp.getSignature().getName();
        String status = "success";
        try {
            return pjp.proceed();
        } catch (Exception ex) {
            status = "error";
            throw ex;
        } finally {
            Counter.builder("persistence.operations")
                    .tag("operation", operation)
                    .tag("status", status)
                    .description("Total persistence adapter operations")
                    .register(registry)
                    .increment();
        }
    }

    // --- Domain violation metrics ---

    @AfterThrowing(pointcut = "allLayers()", throwing = "ex")
    public void recordDomainViolation(DomainException ex) {
        Counter.builder("domain.violations")
                .tag("type", ex.getClass().getSimpleName())
                .description("Total domain rule violations")
                .register(registry)
                .increment();
    }

    @AfterThrowing(pointcut = "allLayers()", throwing = "ex")
    public void recordBusinessRuleViolation(IllegalStateException ex) {
        Counter.builder("domain.violations")
                .tag("type", "IllegalStateException")
                .description("Total business rule violations")
                .register(registry)
                .increment();
    }
}
