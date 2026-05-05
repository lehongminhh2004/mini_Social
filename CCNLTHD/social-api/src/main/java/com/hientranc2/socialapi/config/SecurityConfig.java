package com.hientranc2.socialapi.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.security.config.Customizer;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.Arrays;

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
        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                // Cho phép tất cả request OPTIONS (CORS Preflight) đi qua
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll() 
                
                // 🔥 ĐÃ FIX: Mở cửa trang báo lỗi hệ thống để không bị giấu lỗi bằng mã 403
                .requestMatchers("/error").permitAll() 

                // 1. KHU VỰC CÔNG CỘNG (Mọi người đều được xem, không cần đăng nhập)
                .requestMatchers("/api/users/login", "/api/users/register").permitAll() 
                .requestMatchers(HttpMethod.GET, "/api/posts/**").permitAll() 
                .requestMatchers(HttpMethod.GET, "/api/comments/**").permitAll() 
                .requestMatchers(HttpMethod.GET, "/api/users/**").permitAll() 
                .requestMatchers("/ws/**").permitAll() 

                // 2. KHU VỰC VIP (Bắt buộc phải có Token / Đã đăng nhập mới được thao tác)
                .requestMatchers(HttpMethod.POST, "/api/comments/post/**").authenticated() 
                .requestMatchers(HttpMethod.POST, "/api/comments/**").authenticated() 
                .requestMatchers(HttpMethod.POST, "/api/users/follow/**").authenticated() 
                .requestMatchers(HttpMethod.POST, "/api/reactions/**").authenticated() 
                .requestMatchers(HttpMethod.POST, "/api/shares/**").authenticated() 
                
                // Bất kỳ request nào khác không nằm trong danh sách trên đều phải đăng nhập
                .anyRequest().authenticated() 
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
            
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000")); 
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS")); 
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept")); 
        configuration.setAllowCredentials(true); 

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration); 
        return source;
    }
}