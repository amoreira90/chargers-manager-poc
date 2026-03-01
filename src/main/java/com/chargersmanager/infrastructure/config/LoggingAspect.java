package com.chargersmanager.infrastructure.config;

import com.chargersmanager.domain.exception.DomainException;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.AfterThrowing;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Cross-cutting logging aspect.
 * Automatically intercepts use cases, REST and persistence adapters.
 * Log levels are controlled by configuration — no code changes needed to switch them.
 *
 * Levels used:
 *   DEBUG  → persistence operations
 *   INFO   → use case executions, REST adapter calls
 *   WARN   → domain rule violations (DomainException, IllegalStateException)
 *   ERROR  → unexpected exceptions
 */
@Aspect
@Component
public class LoggingAspect {

    private static final Logger log = LoggerFactory.getLogger(LoggingAspect.class);

    // --- Pointcuts ---

    @Pointcut("execution(* com.chargersmanager.application.service..*(..))")
    private void applicationLayer() {}

    @Pointcut("execution(* com.chargersmanager.infrastructure.adapter.rest..*(..))")
    private void restAdapter() {}

    @Pointcut("execution(* com.chargersmanager.infrastructure.adapter.persistence..*(..))")
    private void persistenceAdapter() {}

    @Pointcut("applicationLayer() || restAdapter() || persistenceAdapter()")
    private void allLayers() {}

    // --- Advices ---

    /**
     * Logs use case executions at INFO level with duration.
     */
    @Around("applicationLayer()")
    public Object logUseCases(ProceedingJoinPoint pjp) throws Throwable {
        String method = pjp.getSignature().toShortString();
        log.info("[USE CASE] >> {}", method);
        long start = System.currentTimeMillis();
        try {
            Object result = pjp.proceed();
            log.info("[USE CASE] << {} completed in {}ms", method, elapsed(start));
            return result;
        } catch (Exception ex) {
            log.info("[USE CASE] << {} failed after {}ms", method, elapsed(start));
            throw ex;
        }
    }

    /**
     * Logs REST adapter calls at INFO level with duration.
     */
    @Around("restAdapter()")
    public Object logRest(ProceedingJoinPoint pjp) throws Throwable {
        String method = pjp.getSignature().toShortString();
        log.info("[REST] >> {}", method);
        long start = System.currentTimeMillis();
        try {
            Object result = pjp.proceed();
            log.info("[REST] << {} completed in {}ms", method, elapsed(start));
            return result;
        } catch (Exception ex) {
            log.info("[REST] << {} failed after {}ms", method, elapsed(start));
            throw ex;
        }
    }

    /**
     * Logs persistence adapter calls at DEBUG level with duration.
     */
    @Around("persistenceAdapter()")
    public Object logPersistence(ProceedingJoinPoint pjp) throws Throwable {
        String method = pjp.getSignature().toShortString();
        log.debug("[PERSISTENCE] >> {}", method);
        long start = System.currentTimeMillis();
        try {
            Object result = pjp.proceed();
            log.debug("[PERSISTENCE] << {} completed in {}ms", method, elapsed(start));
            return result;
        } catch (Exception ex) {
            log.debug("[PERSISTENCE] << {} failed after {}ms", method, elapsed(start));
            throw ex;
        }
    }

    /**
     * Logs domain and business rule violations at WARN level.
     */
    @AfterThrowing(pointcut = "allLayers()", throwing = "ex")
    public void logDomainException(DomainException ex) {
        log.warn("[DOMAIN VIOLATION] {}: {}", ex.getClass().getSimpleName(), ex.getMessage());
    }

    /**
     * Logs illegal state violations at WARN level.
     */
    @AfterThrowing(pointcut = "allLayers()", throwing = "ex")
    public void logIllegalState(IllegalStateException ex) {
        log.warn("[BUSINESS RULE] {}: {}", ex.getClass().getSimpleName(), ex.getMessage());
    }

    /**
     * Logs unexpected exceptions at ERROR level with full stack trace.
     */
    @AfterThrowing(pointcut = "allLayers()", throwing = "ex")
    public void logUnexpectedException(Exception ex) {
        if (ex instanceof DomainException || ex instanceof IllegalStateException) return;
        log.error("[ERROR] Unexpected exception: {}", ex.getMessage(), ex);
    }

    private long elapsed(long startMs) {
        return System.currentTimeMillis() - startMs;
    }
}
