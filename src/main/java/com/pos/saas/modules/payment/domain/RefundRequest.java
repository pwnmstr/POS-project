package com.pos.saas.modules.payment.domain;

import java.math.BigDecimal;

public record RefundRequest(String transactionId, BigDecimal amount) {
}
