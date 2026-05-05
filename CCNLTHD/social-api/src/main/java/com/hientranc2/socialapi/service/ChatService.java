package com.hientranc2.socialapi.service;

import com.hientranc2.socialapi.dto.ChatHistoryDTO;
import com.hientranc2.socialapi.dto.ConversationDTO; // 🔥 Import DTO mới
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
                .timestamp(msg.getTimestamp())
                .build()
        ).collect(Collectors.toList());
    }

    // 🔥 HÀM MỚI: Lấy danh sách hội thoại (Giống Messenger)
    public List<ConversationDTO> getConversations(String username) {
        User me = userRepository.findByUsername(username).orElseThrow();
        // Lấy tất cả tin nhắn, đã sắp xếp mới nhất lên đầu
        List<ChatMessage> allMessages = chatMessageRepository.findAllMessagesByUserId(me.getId());

        List<ConversationDTO> conversations = new ArrayList<>();
        Set<String> processedPartners = new HashSet<>(); // Để ghi nhớ ai đã được đưa vào danh sách rồi

        for (ChatMessage msg : allMessages) {
            // Xác định xem "đối tác" trong tin nhắn này là ai (mình gửi hay họ gửi)
            User partner = msg.getSender().equals(me) ? msg.getReceiver() : msg.getSender();

            // Nếu người này chưa có trong danh sách thì thêm vào (vì tin nhắn đang xếp giảm dần nên đây chắc chắn là tin mới nhất)
            if (!processedPartners.contains(partner.getUsername())) {
                long unreadCount = chatMessageRepository.countUnreadFromPartner(me.getId(), partner.getUsername());
                
                conversations.add(ConversationDTO.builder()
                        .partnerUsername(partner.getUsername())
                        .partnerFullName(partner.getFullName())
                        .partnerAvatarUrl(partner.getAvatarUrl())
                        .lastMessage(msg.getContent())
                        .lastMessageAt(msg.getTimestamp())
                        .unreadCount(unreadCount)
                        .build());
                processedPartners.add(partner.getUsername());
            }
        }
        return conversations;
    }
}