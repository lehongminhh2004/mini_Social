package com.hientranc2.socialapi.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.UUID;

@Entity
// ĐÃ SỬA: Xóa cái UniqueConstraint cũ đi vì giờ post_id có thể bị rỗng (khi react comment)
@Table(name = "reactions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Reaction {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // ĐÃ SỬA: Bỏ nullable = false
    @ManyToOne
    @JoinColumn(name = "post_id") 
    private Post post;

    // 🔥 TÍNH NĂNG MỚI: Cho phép thả tim vào Comment
    @ManyToOne
    @JoinColumn(name = "comment_id")
    private Comment comment;

    @Enumerated(EnumType.STRING)
    private ReactionType type;
}