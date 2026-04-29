package com.hientranc2.socialapi.dto;

import lombok.Data;

@Data
public class ChatMessageDTO {
    private String senderUsername;   // Ai gửi?
    private String receiverUsername; // Gửi cho ai?
    private String content;          // Nội dung là gì?
}