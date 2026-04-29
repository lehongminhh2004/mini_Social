package com.hientranc2.socialapi.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter; // Tiêm anh bảo vệ vào đây

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                // CHỈ mở toang 2 cửa Đăng ký và Đăng nhập (Ai cũng vào được)
                .requestMatchers("/api/users/register", "/api/users/login", "/ws/**", "/api/users/search").permitAll()
                
                // CÒN LẠI TẤT CẢ các cửa khác (như xem danh sách, đăng bài) BẮT BUỘC CÓ THẺ
                .anyRequest().authenticated()
            )
            // Lệnh cho anh bảo vệ đứng ở cửa chính trước khi người dùng chạm vào API
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
            
        return http.build();
    }
}