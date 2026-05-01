package com.hientranc2.socialapi.service;

import com.hientranc2.socialapi.dto.CommentResponseDTO;
import com.hientranc2.socialapi.dto.UserSummaryDTO;
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

    // Hàm "biến hình" từ Entity sang DTO để Frontend gọi comment.author.avatarUrl không bị lỗi
    public CommentResponseDTO mapToDTO(Comment comment) {
        UserSummaryDTO authorDTO = UserSummaryDTO.builder()
                .username(comment.getUser().getUsername())
                .fullName(comment.getUser().getFullName())
                .avatarUrl(comment.getUser().getAvatarUrl())
                .build();

        return CommentResponseDTO.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .author(authorDTO) // Gán tác giả (author) vào đây
                .build();
    }

    public CommentResponseDTO addComment(String username, UUID postId, String content) {
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

        // Trả về DTO thay vì Entity
        return mapToDTO(savedComment);
    }

    public List<CommentResponseDTO> getCommentsByPost(UUID postId) {
        List<Comment> comments = commentRepository.findAllByPostIdOrderByCreatedAtDesc(postId); // Hoặc tên hàm findByPostId tùy bạn đặt trong Repo
        
        // Dùng Stream để biến hình toàn bộ danh sách Comment thành CommentResponseDTO
        return comments.stream()
                .map(this::mapToDTO)
                .toList();
    }
}