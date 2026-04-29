package com.hientranc2.socialapi.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Đây là cái cổng "/ws" để Frontend cắm ống nước vào
        // setAllowedOriginPatterns("*") để cho phép mọi Frontend đều kết nối được
        // withSockJS() là phương án dự phòng nếu trình duyệt cũ không hỗ trợ chuẩn WebSocket
        registry.addEndpoint("/ws").setAllowedOriginPatterns("*").withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Frontend sẽ "đăng ký nhận tin" từ các kênh bắt đầu bằng "/user" (chat riêng) hoặc "/topic" (chat nhóm)
        registry.enableSimpleBroker("/user", "/topic");
        
        // Khi Frontend muốn GỬI tin nhắn lên Server, họ phải gọi đường dẫn bắt đầu bằng "/app"
        registry.setApplicationDestinationPrefixes("/app");
        
        // Cấu hình tiền tố để Server biết đường gửi tin nhắn đích danh cho 1 user cụ thể
        registry.setUserDestinationPrefix("/user");
    }
}