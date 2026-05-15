package com.hientranc2.socialapi.service;

import com.hientranc2.socialapi.dto.ChatHistoryDTO;
import com.hientranc2.socialapi.dto.ConversationDTO; 
import com.hientranc2.socialapi.model.ChatMessage;
import com.hientranc2.socialapi.model.User;
import com.hientranc2.socialapi.repository.ChatMessageRepository;
import com.hientranc2.socialapi.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    public List<ChatHistoryDTO> getChatHistory(String myUsername, String partnerUsername) {
        User me = userRepository.findByUsername(myUsername).orElseThrow();
        User partner = userRepository.findByUsername(partnerUsername).orElseThrow();

        List<ChatMessage> messages = chatMessageRepository.findChatHistory(me, partner);

        return messages.stream().map(msg -> ChatHistoryDTO.builder()
                .senderUsername(msg.getSender().getUsername())
                .receiverUsername(msg.getReceiver().getUsername())
                .content(msg.getContent())
                .imageUrl(msg.getImageUrl()) // 🔥 LẤY ẢNH TỪ DB
                .timestamp(msg.getTimestamp())
                .build()
        ).collect(Collectors.toList());
    }

    public List<ConversationDTO> getConversations(String username) {
        User me = userRepository.findByUsername(username).orElseThrow();
        List<ChatMessage> allMessages = chatMessageRepository.findAllMessagesByUserId(me.getId());

        List<ConversationDTO> conversations = new ArrayList<>();
        Set<String> processedPartners = new HashSet<>(); 

        for (ChatMessage msg : allMessages) {
            User partner = msg.getSender().equals(me) ? msg.getReceiver() : msg.getSender();

            if (!processedPartners.contains(partner.getUsername())) {
                long unreadCount = chatMessageRepository.countUnreadFromPartner(me.getId(), partner.getUsername());
                
                conversations.add(ConversationDTO.builder()
                        .partnerUsername(partner.getUsername())
                        .partnerFullName(partner.getFullName())
                        .partnerAvatarUrl(partner.getAvatarUrl())
                        // Nếu gửi ảnh không có chữ thì hiện "Đã gửi một ảnh"
                        .lastMessage(msg.getContent().isEmpty() && msg.getImageUrl() != null ? "📸 Đã gửi một ảnh" : msg.getContent())
                        .lastMessageAt(msg.getTimestamp())
                        .unreadCount(unreadCount)
                        .build());
                processedPartners.add(partner.getUsername());
            }
        }
        return conversations;
    }
}