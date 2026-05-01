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

    // ĐÃ GỘP TẤT CẢ VÀO 1 TRẠM GÁC DUY NHẤT Ở ĐÂY:
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults()) // <--- Đã chèn lệnh bật CORS vào đây
            .csrf(csrf -> csrf.disable())
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

    // Bean cấu hình chi tiết luật CORS (Giữ nguyên, không lỗi)
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Cho phép Frontend ở cổng 3000 truy cập
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000")); 
        
        // Cho phép các loại request này
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS")); 
        
        // Cho phép Frontend gửi lên các Header này (đặc biệt là cái Authorization chứa Token)
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type")); 
        
        // Cho phép Frontend nhận cookie/thông tin xác thực
        configuration.setAllowCredentials(true); 

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // Áp dụng luật này cho TẤT CẢ đường dẫn API của bạn
        source.registerCorsConfiguration("/**", configuration); 
        return source;
    }
}