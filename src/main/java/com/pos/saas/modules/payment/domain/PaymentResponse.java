package com.pos.saas.modules.payment.domain;

public record PaymentResponse(boolean success, String transactionId, String message) {
}
