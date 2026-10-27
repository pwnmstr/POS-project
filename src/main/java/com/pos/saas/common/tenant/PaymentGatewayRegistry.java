package com.pos.saas.modules.payment.application;

import com.pos.saas.modules.payment.domain.PaymentProviderType;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class PaymentGatewayRegistry {

    private final Map<PaymentProviderType, PaymentGatewayPort> gateways;

    public PaymentGatewayRegistry(List<PaymentGatewayPort> gatewayList) {
        this.gateways = gatewayList.stream()
                .collect(Collectors.toMap(PaymentGatewayPort::getProviderType, Function.identity()));
    }

    public PaymentGatewayPort getGateway(PaymentProviderType type) {
        PaymentGatewayPort gateway = gateways.get(type);
        if (gateway == null) {
            throw new IllegalArgumentException("Unsupported payment provider type: " + type);
        }
        return gateway;
    }
}
