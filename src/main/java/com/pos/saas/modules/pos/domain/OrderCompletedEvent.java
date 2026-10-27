package com.pos.saas.modules.pos.domain;

import java.util.UUID;

public record OrderCompletedEvent(UUID tenantId, UUID orderId) {
}
