package com.pos.saas.modules.payment.application;

import com.pos.saas.modules.payment.domain.*;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class StripePaymentAdapter implements PaymentGatewayPort {

    @Override
    public PaymentProviderType getProviderType() {
        return PaymentProviderType.STRIPE_TERMINAL;
    }

    @Override
    public PaymentResponse authorizeAndCapture(UUID tenantId, PaymentRequest request) {
        // Dummy implementation of external API call
        System.out.println("Processing Stripe payment for tenant " + tenantId + " and order " + request.orderId());
        return new PaymentResponse(true, "ch_dummy_" + UUID.randomUUID(), "Payment successful");
    }

    @Override
    public RefundResponse refund(UUID tenantId, RefundRequest request) {
        return new RefundResponse(true, "Refund successful for transaction " + request.transactionId());
    }
}
