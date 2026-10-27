package com.pos.saas.common.tenant;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
public class TenantContextFilter extends OncePerRequestFilter {

    private static final String TENANT_HEADER = "X-TenantID";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String tenantHeader = request.getHeader(TENANT_HEADER);

        if (tenantHeader != null && !tenantHeader.isBlank()) {
            try {
                TenantContext.setCurrentTenant(UUID.fromString(tenantHeader));
            } catch (IllegalArgumentException e) {
                // If invalid UUID, allow filter chain to continue without tenant context or handle error
                logger.warn("Invalid tenant ID format provided in header.");
            }
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }
}
