package com.pos.saas.modules.payment.application;

import com.pos.saas.modules.payment.domain.*;
import java.util.UUID;

public interface PaymentGatewayPort {
    PaymentProviderType getProviderType();
    PaymentResponse authorizeAndCapture(UUID tenantId, PaymentRequest request);
    RefundResponse refund(UUID tenantId, RefundRequest request);
}
