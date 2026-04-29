package com.hientranc2.socialapi.config;

import com.hientranc2.socialapi.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // 1. Nhìn vào Header xem có mang thẻ "Authorization" không?
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String username;

        // Nếu không có thẻ hoặc thẻ không bắt đầu bằng chữ "Bearer ", đuổi ra ngoài ngay
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 2. Cắt lấy đoạn mã Token (Bỏ đi 7 ký tự chữ "Bearer " ở đầu)
        jwt = authHeader.substring(7);

        try {
            // Nhờ JwtService soi mã xem thẻ của ai
            username = jwtService.extractUsername(jwt);

            // 3. Nếu soi ra tên và người này chưa được mở cửa
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                if (jwtService.isTokenValid(jwt)) {
                    // Đóng mộc "Đã kiểm duyệt", mở cửa cho vào hệ thống
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            username, null, new ArrayList<>()
                    );
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
            // Thẻ giả mạo -> Kệ nó, hệ thống sẽ tự trả về lỗi 403
        }

        filterChain.doFilter(request, response);
    }
}