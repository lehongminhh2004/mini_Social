package com.hientranc2.socialapi.controller;

import com.hientranc2.socialapi.dto.ChatHistoryDTO; 
import com.hientranc2.socialapi.dto.ChatMessageDTO;
import com.hientranc2.socialapi.dto.ConversationDTO;
import com.hientranc2.socialapi.model.ChatMessage;
import com.hientranc2.socialapi.model.User;
import com.hientranc2.socialapi.repository.ChatMessageRepository;
import com.hientranc2.socialapi.repository.UserRepository;
import com.hientranc2.socialapi.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController 
@RequestMapping("/api/chat") 
@RequiredArgsConstructor
@CrossOrigin("*")
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate; 
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final ChatService chatService; 

    @MessageMapping("/chat")
    public void processMessage(@Payload ChatMessageDTO chatDTO) {
        User sender = userRepository.findByUsername(chatDTO.getSenderUsername())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người gửi"));
        User receiver = userRepository.findByUsername(chatDTO.getReceiverUsername())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người nhận"));

        ChatMessage message = ChatMessage.builder()
                .sender(sender)
                .receiver(receiver)
                .content(chatDTO.getContent() != null ? chatDTO.getContent() : "") // Tránh lỗi null nếu chỉ gửi ảnh
                .imageUrl(chatDTO.getImageUrl()) // 🔥 LƯU ẢNH
                .build();
        ChatMessage savedMessage = chatMessageRepository.save(message);

        ChatHistoryDTO responseDTO = ChatHistoryDTO.builder()
                .senderUsername(sender.getUsername())
                .receiverUsername(receiver.getUsername())
                .content(savedMessage.getContent())
                .imageUrl(savedMessage.getImageUrl()) // 🔥 TRẢ VỀ ẢNH
                .timestamp(savedMessage.getTimestamp())
                .build();

        messagingTemplate.convertAndSendToUser(
                receiver.getUsername(), 
                "/queue/messages", 
                responseDTO
        );
    }

    @PostMapping("/send")
    public ResponseEntity<ChatHistoryDTO> sendMessageRest(Principal principal, @RequestBody ChatMessageDTO chatDTO) {
        String senderUsername = principal.getName(); 

        User sender = userRepository.findByUsername(senderUsername)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người gửi"));
        User receiver = userRepository.findByUsername(chatDTO.getReceiverUsername())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người nhận"));

        ChatMessage message = ChatMessage.builder()
                .sender(sender)
                .receiver(receiver)
                .content(chatDTO.getContent() != null ? chatDTO.getContent() : "")
                .imageUrl(chatDTO.getImageUrl()) // 🔥 LƯU ẢNH
                .build();
        ChatMessage savedMessage = chatMessageRepository.save(message);

        ChatHistoryDTO responseDTO = ChatHistoryDTO.builder()
                .senderUsername(sender.getUsername())
                .receiverUsername(receiver.getUsername())
                .content(savedMessage.getContent())
                .imageUrl(savedMessage.getImageUrl()) // 🔥 TRẢ VỀ ẢNH
                .timestamp(savedMessage.getTimestamp())
                .build();

        messagingTemplate.convertAndSendToUser(
                receiver.getUsername(), 
                "/queue/messages", 
                responseDTO
        );

        return ResponseEntity.ok(responseDTO);
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationDTO>> getConversations(Principal principal) {
        return ResponseEntity.ok(chatService.getConversations(principal.getName()));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadMessageCount(Principal principal) {
        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));
        long count = chatMessageRepository.countByReceiverIdAndIsReadFalse(user.getId());
        return ResponseEntity.ok(count);
    }

    @PutMapping("/mark-read/{partnerUsername}")
    public ResponseEntity<String> markMessagesAsRead(Principal principal, @PathVariable String partnerUsername) {
        User me = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy user"));
        
        chatMessageRepository.markMessagesAsRead(me.getId(), partnerUsername);
        return ResponseEntity.ok("Đã đánh dấu đã đọc");
    }
}