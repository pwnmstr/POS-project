package com.pos.saas.modules.payment.domain;

import java.math.BigDecimal;
import java.util.UUID;

public record PaymentRequest(UUID orderId, BigDecimal amount, String currency) {
}
