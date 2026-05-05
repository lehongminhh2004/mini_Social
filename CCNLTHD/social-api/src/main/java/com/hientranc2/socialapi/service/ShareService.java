package com.hientranc2.socialapi.service;

import com.hientranc2.socialapi.model.Comment;
import com.hientranc2.socialapi.model.NotificationType;
import com.hientranc2.socialapi.model.Post;
import com.hientranc2.socialapi.model.Share;
import com.hientranc2.socialapi.model.User;
import com.hientranc2.socialapi.repository.CommentRepository;
import com.hientranc2.socialapi.repository.PostRepository;
import com.hientranc2.socialapi.repository.ShareRepository;
import com.hientranc2.socialapi.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ShareService {

    private final ShareRepository shareRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository; // 🔥 ĐÃ THÊM: Kho chứa Comment
    private final NotificationService notificationService;

    // ============================================
    // 1. REPOST BÀI VIẾT (POST)
    // ============================================
    @Transactional 
    public String toggleShare(String username, UUID postId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài viết"));

        Optional<Share> existingShare = shareRepository.findByUserIdAndPostId(user.getId(), post.getId());

        if (existingShare.isPresent()) {
            // Hủy đăng lại
            shareRepository.delete(existingShare.get());
            
            // 🔥 ĐÃ FIX: Trừ biến đếm đi 1
            int currentShares = post.getTotalShares() != null ? post.getTotalShares() : 0;
            post.setTotalShares(Math.max(0, currentShares - 1));
            postRepository.save(post);
            
            return "Đã hủy đăng lại bài viết";
        } else {
            // Đăng lại mới
            Share newShare = Share.builder().user(user).post(post).build();
            shareRepository.save(newShare);
            
            // 🔥 ĐÃ FIX: Cộng biến đếm lên 1
            int currentShares = post.getTotalShares() != null ? post.getTotalShares() : 0;
            post.setTotalShares(currentShares + 1);
            postRepository.save(post);
            
            notificationService.createNotification(
                post.getUser(), user, NotificationType.SHARE, post.getId(), 
                user.getFullName() + " đã đăng lại bài viết của bạn."
            );
            return "Đã đăng lại bài viết thành công!";
        }
    }

    // ============================================
    // 2. REPOST BÌNH LUẬN (COMMENT) - 🔥 MỚI THÊM
    // ============================================
    @Transactional
    public String toggleCommentShare(String username, UUID commentId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bình luận"));

        Optional<Share> existingShare = shareRepository.findByUserIdAndCommentId(user.getId(), comment.getId());

        if (existingShare.isPresent()) {
            // Hủy đăng lại bình luận
            shareRepository.delete(existingShare.get());
            
            // Trừ biến đếm
            int currentShares = comment.getTotalShares() != null ? comment.getTotalShares() : 0;
            comment.setTotalShares(Math.max(0, currentShares - 1));
            commentRepository.save(comment);

            return "Đã hủy đăng lại bình luận";
        } else {
            // Đăng lại bình luận
            Share newShare = Share.builder()
                    .user(user)
                    .comment(comment) // Trỏ vào bảng Comment
                    .build();
            shareRepository.save(newShare);
            
            // Cộng biến đếm
            int currentShares = comment.getTotalShares() != null ? comment.getTotalShares() : 0;
            comment.setTotalShares(currentShares + 1);
            commentRepository.save(comment);

            notificationService.createNotification(
                comment.getUser(), user, NotificationType.SHARE, comment.getPost().getId(), 
                user.getFullName() + " đã đăng lại bình luận của bạn."
            );
            return "Đã đăng lại bình luận thành công!";
        }
    }
}