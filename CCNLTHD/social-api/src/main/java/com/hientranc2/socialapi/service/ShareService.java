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

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ShareService {

    private final ShareRepository shareRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    
    // 1. Tiêm chip Notification
    private final NotificationService notificationService;

    public String sharePost(String username, UUID postId) {
        // 1. Tìm người dùng và bài viết
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài viết"));

        // 2. Lưu lịch sử chia sẻ
        Share share = Share.builder()
                .user(user)
                .post(post)
                .build();
        shareRepository.save(share);
        
        // 3. Kích hoạt thông báo
        notificationService.createNotification(
            post.getUser(), 
            user, 
            NotificationType.SHARE, 
            post.getId(), 
            user.getFullName() + " đã chia sẻ bài viết của bạn."
        );
        
        return "Đã chia sẻ bài viết thành công!";
    }
}