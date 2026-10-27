package com.pos.saas.common.tenant;

import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class TenantIdentifierResolver implements CurrentTenantIdentifierResolver<UUID> {

    @Override
    public UUID resolveCurrentTenantIdentifier() {
        UUID tenantId = TenantContext.getCurrentTenant();
        // Fallback for startup or queries executed outside a web request
        if (tenantId != null) {
            return tenantId;
        }
        return UUID.fromString("00000000-0000-0000-0000-000000000000"); // default/system tenant
    }

    @Override
    public boolean validateExistingCurrentSessions() {
        return true;
    }
}
