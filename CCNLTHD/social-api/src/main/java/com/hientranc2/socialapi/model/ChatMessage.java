package com.hientranc2.socialapi.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "chat_messages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender; // Người gửi

    @ManyToOne
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver; // Người nhận

    private String content; // Nội dung tin nhắn

    @CreationTimestamp
    private LocalDateTime timestamp;
}