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
    
    // 1. Tiêm chip Notification
    private final NotificationService notificationService;

    @Transactional
    public String toggleFollow(String followerUsername, UUID targetUserId) {
        // 1. Tìm người đi Follow (chính là bạn) và người được Follow
        User follower = userRepository.findByUsername(followerUsername)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng hiện tại"));
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng muốn theo dõi"));

        // 2. Không cho phép tự ái luyến (tự follow mình)
        if (follower.getId().equals(targetUser.getId())) {
            throw new RuntimeException("Bạn không thể tự theo dõi chính mình!");
        }

        // 3. Xử lý Toggle Logic
        if (follower.getFollowing().contains(targetUser)) {
            // Đã follow rồi -> Hủy follow (Im lặng, không gửi thông báo gì cả)
            follower.getFollowing().remove(targetUser);
            userRepository.save(follower);
            return "Đã bỏ theo dõi " + targetUser.getFullName();
        } else {
            // Chưa follow -> Thêm vào danh sách follow
            follower.getFollowing().add(targetUser);
            userRepository.save(follower);
            
            // 4. Kích hoạt thông báo cho người vừa được Follow
            notificationService.createNotification(
                targetUser, // Người nhận thông báo là idol
                follower,   // Người gây ra hành động là bạn
                NotificationType.FOLLOW, 
                follower.getId(), // Target là cái ID của bạn (để idol tò mò bấm vào xem bạn là ai)
                follower.getFullName() + " đã bắt đầu theo dõi bạn."
            );
            
            return "Đã theo dõi " + targetUser.getFullName();
        }
    }
}