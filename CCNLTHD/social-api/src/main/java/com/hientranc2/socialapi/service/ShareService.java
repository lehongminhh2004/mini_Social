package com.hientranc2.socialapi.service;

import com.hientranc2.socialapi.model.NotificationType;
import com.hientranc2.socialapi.model.Post;
import com.hientranc2.socialapi.model.Share;
import com.hientranc2.socialapi.model.User;
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
    private final NotificationService notificationService;

    @Transactional // Đảm bảo an toàn dữ liệu: Hoặc lưu, hoặc xóa, không bị lỗi giữa chừng
    public String toggleShare(String username, UUID postId) {
        
        // 1. Tìm người dùng và bài viết
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài viết"));

        // 2. Tìm xem người này đã từng "Đăng lại" bài này chưa?
        Optional<Share> existingShare = shareRepository.findByUserIdAndPostId(user.getId(), post.getId());

        // Nếu ĐÃ TỪNG đăng lại:
        if (existingShare.isPresent()) {
            // Hủy đăng lại (Xóa khỏi Database)
            shareRepository.delete(existingShare.get());
            return "Đã hủy đăng lại bài viết";
        } 
        // Nếu CHƯA TỪNG đăng lại:
        else {
            Share newShare = Share.builder()
                    .user(user)
                    .post(post)
                    .build();
            shareRepository.save(newShare);
            
            // Kích hoạt thông báo (Mình đổi chữ "chia sẻ" thành "đăng lại" cho sát nghĩa Threads)
            notificationService.createNotification(
                post.getUser(), 
                user, 
                NotificationType.SHARE, 
                post.getId(), 
                user.getFullName() + " đã đăng lại bài viết của bạn."
            );
            
            return "Đã đăng lại bài viết thành công!";
        }
    }
}