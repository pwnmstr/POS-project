package com.pos.saas.common.tenant;

import java.util.UUID;

public class TenantContext {

    private static final ThreadLocal<UUID> CURRENT_TENANT = new ThreadLocal<>();

    public static UUID getCurrentTenant() {
        return CURRENT_TENANT.get();
    }

    public static void setCurrentTenant(UUID tenant) {
        CURRENT_TENANT.set(tenant);
    }

    public static void clear() {
        CURRENT_TENANT.remove();
    }
}
