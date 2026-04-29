package com.hientranc2.socialapi.service;

import com.hientranc2.socialapi.dto.ChatHistoryDTO;
import com.hientranc2.socialapi.model.ChatMessage;
import com.hientranc2.socialapi.model.User;
import com.hientranc2.socialapi.repository.ChatMessageRepository;
import com.hientranc2.socialapi.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    public List<ChatHistoryDTO> getChatHistory(String myUsername, String partnerUsername) {
        User me = userRepository.findByUsername(myUsername)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng hiện tại"));
        User partner = userRepository.findByUsername(partnerUsername)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đối tác chat"));

        // Lấy list tin nhắn thô từ DB
        List<ChatMessage> messages = chatMessageRepository.findChatHistory(me, partner);

        // Biến đổi (Map) thành DTO sạch sẽ
        return messages.stream().map(msg -> ChatHistoryDTO.builder()
                .senderUsername(msg.getSender().getUsername())
                .receiverUsername(msg.getReceiver().getUsername())
                .content(msg.getContent())
                .timestamp(msg.getTimestamp())
                .build()
        ).collect(Collectors.toList());
    }
}   