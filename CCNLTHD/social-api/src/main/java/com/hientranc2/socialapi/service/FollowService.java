package com.hientranc2.socialapi.service;

import com.hientranc2.socialapi.model.NotificationType;
import com.hientranc2.socialapi.model.User;
import com.hientranc2.socialapi.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FollowService {

    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public String toggleFollow(String followerUsername, UUID targetUserId) {
        // 1. Tìm người đi Follow và người được Follow
        User follower = userRepository.findByUsername(followerUsername)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng hiện tại"));
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng muốn theo dõi"));

        // 2. Không cho phép tự follow mình
        if (follower.getId().equals(targetUser.getId())) {
            throw new RuntimeException("Bạn không thể tự theo dõi chính mình!");
        }

        // 3. Xử lý Toggle Logic bằng NATIVE QUERY (Chắc chắn 100% ăn xuống DB)
        boolean isAlreadyFollowing = userRepository.checkFollowing(follower.getId(), targetUser.getId()) > 0;

        if (isAlreadyFollowing) {
            // Đã follow rồi -> Xóa khỏi database bằng lệnh DELETE
            userRepository.unfollow(follower.getId(), targetUser.getId());
            return "Đã bỏ theo dõi " + targetUser.getFullName();
        } else {
            // Chưa follow -> Thêm thẳng vào database bằng lệnh INSERT
            userRepository.follow(follower.getId(), targetUser.getId());
            
            // 4. Kích hoạt thông báo
            notificationService.createNotification(
                targetUser, 
                follower,   
                NotificationType.FOLLOW, 
                follower.getId(), 
                follower.getFullName() + " đã bắt đầu theo dõi bạn."
            );
            
            return "Đã theo dõi " + targetUser.getFullName();
        }
    }
}