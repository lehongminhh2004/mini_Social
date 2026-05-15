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
import java.util.UUID;

@RestController 
@RequestMapping("/api/chat") 
@RequiredArgsConstructor
@CrossOrigin("*")
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate; 
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final ChatService chatService; 

    // 1. XỬ LÝ TIN NHẮN QUA WEBSOCKET (REAL-TIME)
    @MessageMapping("/chat")
    public void processMessage(@Payload ChatMessageDTO chatDTO) {
        User sender = userRepository.findByUsername(chatDTO.getSenderUsername())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người gửi"));
        User receiver = userRepository.findByUsername(chatDTO.getReceiverUsername())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người nhận"));

        // Lưu tin nhắn vào DB (kèm cả link ảnh và nội dung reply nếu có)
        ChatMessage message = ChatMessage.builder()
                .sender(sender)
                .receiver(receiver)
                .content(chatDTO.getContent() != null ? chatDTO.getContent() : "")
                .imageUrl(chatDTO.getImageUrl())
                .replyToContent(chatDTO.getReplyToContent()) // 🔥 LƯU NỘI DUNG REPLY
                .build();
        
        ChatMessage savedMessage = chatMessageRepository.save(message);

        // Chuẩn bị dữ liệu phản hồi
        ChatHistoryDTO responseDTO = ChatHistoryDTO.builder()
                .id(savedMessage.getId().toString()) // 🔥 TRẢ VỀ ID ĐỂ FRONTEND THAO TÁC
                .senderUsername(sender.getUsername())
                .receiverUsername(receiver.getUsername())
                .content(savedMessage.getContent())
                .imageUrl(savedMessage.getImageUrl())
                .replyToContent(savedMessage.getReplyToContent()) // 🔥 TRẢ VỀ NỘI DUNG REPLY
                .timestamp(savedMessage.getTimestamp())
                .isDeletedForEveryone(false)
                .reaction(null)
                .build();

        // Gửi đích danh cho người nhận
        messagingTemplate.convertAndSendToUser(
                receiver.getUsername(), 
                "/queue/messages", 
                responseDTO
        );
    }

    // 2. XỬ LÝ TIN NHẮN QUA REST API (BACKUP)
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
                .imageUrl(chatDTO.getImageUrl())
                .replyToContent(chatDTO.getReplyToContent()) // 🔥 LƯU NỘI DUNG REPLY
                .build();
        
        ChatMessage savedMessage = chatMessageRepository.save(message);

        ChatHistoryDTO responseDTO = ChatHistoryDTO.builder()
                .id(savedMessage.getId().toString())
                .senderUsername(sender.getUsername())
                .receiverUsername(receiver.getUsername())
                .content(savedMessage.getContent())
                .imageUrl(savedMessage.getImageUrl())
                .replyToContent(savedMessage.getReplyToContent())
                .timestamp(savedMessage.getTimestamp())
                .build();

        // Vẫn bắn WebSocket để bên kia thấy tin nhắn hiện lên ngay
        messagingTemplate.convertAndSendToUser(
                receiver.getUsername(), 
                "/queue/messages", 
                responseDTO
        );

        return ResponseEntity.ok(responseDTO);
    }

    // 3. API MỚI: XỬ LÝ THU HỒI, THẢ TIM
    @PutMapping("/action/{messageId}")
    public ResponseEntity<String> messageAction(
            Principal principal,
            @PathVariable UUID messageId,
            @RequestParam String action,
            @RequestParam(required = false) String value) {

        ChatMessage message = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tin nhắn"));

        String partnerUsername = message.getSender().getUsername().equals(principal.getName()) 
                                 ? message.getReceiver().getUsername() 
                                 : message.getSender().getUsername();

        if ("REVOKE_EVERYONE".equals(action)) {
            if (!message.getSender().getUsername().equals(principal.getName())) {
                return ResponseEntity.status(403).body("Bạn không có quyền");
            }
            message.setIsDeletedForEveryone(true);
        } else if ("REVOKE_ME".equals(action)) {
            message.setDeletedByUser(principal.getName());
        } else if ("REACT".equals(action)) {
            message.setReaction(value);
        }

        ChatMessage saved = chatMessageRepository.save(message);

        // 🔥 QUAN TRỌNG: Bắn tín hiệu cập nhật qua WebSocket cho người kia
        ChatHistoryDTO updateSignal = ChatHistoryDTO.builder()
                .id(saved.getId().toString())
                .senderUsername(saved.getSender().getUsername())
                .receiverUsername(saved.getReceiver().getUsername())
                .content(saved.getContent())
                .isDeletedForEveryone(saved.getIsDeletedForEveryone())
                .reaction(saved.getReaction())
                .timestamp(saved.getTimestamp())
                .build();

        messagingTemplate.convertAndSendToUser(partnerUsername, "/queue/messages", updateSignal);

        return ResponseEntity.ok("Thành công");
    }

    // 4. LẤY LỊCH SỬ CHAT
    @GetMapping("/history/{partnerUsername}")
    public ResponseEntity<List<ChatHistoryDTO>> getChatHistory(Principal principal, @PathVariable String partnerUsername) {
        User me = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        User partner = userRepository.findByUsername(partnerUsername)
                .orElseThrow(() -> new RuntimeException("Partner not found"));

        List<ChatMessage> history = chatMessageRepository.findChatHistory(me, partner);
        
        // Map từ Entity sang DTO để trả về
        List<ChatHistoryDTO> dtos = history.stream().map(m -> ChatHistoryDTO.builder()
                .id(m.getId().toString())
                .senderUsername(m.getSender().getUsername())
                .receiverUsername(m.getReceiver().getUsername())
                .content(m.getContent())
                .imageUrl(m.getImageUrl())
                .timestamp(m.getTimestamp())
                .isDeletedForEveryone(m.getIsDeletedForEveryone())
                .deletedByUser(m.getDeletedByUser())
                .reaction(m.getReaction())
                .replyToContent(m.getReplyToContent())
                .build()).toList();

        return ResponseEntity.ok(dtos);
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