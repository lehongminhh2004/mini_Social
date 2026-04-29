package com.hientranc2.socialapi.controller;

import com.hientranc2.socialapi.dto.ChatMessageDTO;
import com.hientranc2.socialapi.model.ChatMessage;
import com.hientranc2.socialapi.model.User;
import com.hientranc2.socialapi.repository.ChatMessageRepository;
import com.hientranc2.socialapi.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class ChatController {

    // Đây là "người đưa thư" giúp bắn tin nhắn qua ống nước
    private final SimpMessagingTemplate messagingTemplate; 
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    // Khi Frontend muốn gửi tin nhắn, họ sẽ ném vào cổng "/app/chat"
    @MessageMapping("/chat")
    public void processMessage(@Payload ChatMessageDTO chatDTO) {
        
        // 1. Tìm người gửi và người nhận dưới DB
        User sender = userRepository.findByUsername(chatDTO.getSenderUsername())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người gửi"));
        User receiver = userRepository.findByUsername(chatDTO.getReceiverUsername())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người nhận"));

        // 2. Lưu tin nhắn vào Database (để sau này load lại lịch sử)
        ChatMessage message = ChatMessage.builder()
                .sender(sender)
                .receiver(receiver)
                .content(chatDTO.getContent())
                .build();
        ChatMessage savedMessage = chatMessageRepository.save(message);

        // 3. MA THUẬT: Bắn tin nhắn trực tiếp qua màn hình người nhận!
        // Người nhận (User B) đang lắng nghe ở cái loa có tên là: /user/{usernameB}/queue/messages
        messagingTemplate.convertAndSend(
                "/user/" + receiver.getUsername() + "/queue/messages",
                savedMessage
        );
    }
}