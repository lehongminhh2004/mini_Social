package com.hientranc2.socialapi.service;

import com.hientranc2.socialapi.model.*;
import com.hientranc2.socialapi.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CommentService {
    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    
    // 1. Tiêm chip Notification
    private final NotificationService notificationService; 

    public Comment addComment(String username, UUID postId, String content) {
        User user = userRepository.findByUsername(username).orElseThrow();
        Post post = postRepository.findById(postId).orElseThrow();

        Comment comment = Comment.builder()
                .user(user)
                .post(post)
                .content(content)
                .build();
                
        // Lưu comment vào DB trước
        Comment savedComment = commentRepository.save(comment);

        // 2. Kích hoạt thông báo cho chủ bài viết
        notificationService.createNotification(
            post.getUser(), 
            user, 
            NotificationType.COMMENT, 
            post.getId(), 
            user.getFullName() + " đã bình luận về bài viết của bạn: \"" + content + "\""
        );

        return savedComment;
    }

    public List<Comment> getCommentsByPost(UUID postId) {
        return commentRepository.findAllByPostIdOrderByCreatedAtDesc(postId);
    }
}