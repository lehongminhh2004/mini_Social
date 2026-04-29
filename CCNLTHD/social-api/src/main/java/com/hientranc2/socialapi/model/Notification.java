package com.hientranc2.socialapi.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notifications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient; // Người nhận thông báo

    @ManyToOne
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender; // Người tạo ra hành động (người like, người follow...)

    @Enumerated(EnumType.STRING)
    private NotificationType type;

    private UUID targetId; // ID của Post hoặc User liên quan để khi bấm vào thông báo sẽ dẫn đến đó
    private String message;
    
    @Builder.Default
    private boolean isRead = false; // Trạng thái đã xem hay chưa

    @CreationTimestamp
    private LocalDateTime createdAt;
}