package com.hientranc2.socialapi.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "comments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Comment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;
    @Column(name = "media_url")
    private String mediaUrl;

    // 🔥 TÍNH NĂNG MỚI: Tự trỏ về chính nó để làm Reply (Bình luận con)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_comment_id")
    private Comment parentComment;

    @OneToMany(mappedBy = "parentComment", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Comment> replies;

    // 🔥 TÍNH NĂNG MỚI: Biến đếm (Y chang Post)
   @Builder.Default
    @Column(name = "total_reactions")
    private Integer totalReactions = 0;

    @Builder.Default
    @Column(name = "total_replies")
    private Integer totalReplies = 0;

    @Builder.Default
    @Column(name = "total_shares")
    private Integer totalShares = 0;

    @CreationTimestamp
    private LocalDateTime createdAt;
    
}