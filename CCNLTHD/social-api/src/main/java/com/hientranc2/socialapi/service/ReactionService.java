package com.hientranc2.socialapi.service;

import com.hientranc2.socialapi.model.NotificationType;
import com.hientranc2.socialapi.model.Post;
import com.hientranc2.socialapi.model.Reaction;
import com.hientranc2.socialapi.model.ReactionType;
import com.hientranc2.socialapi.model.User;
import com.hientranc2.socialapi.repository.PostRepository;
import com.hientranc2.socialapi.repository.ReactionRepository;
import com.hientranc2.socialapi.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.hientranc2.socialapi.model.Comment;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReactionService {

    private final ReactionRepository reactionRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final NotificationService notificationService;
    private final com.hientranc2.socialapi.repository.CommentRepository commentRepository;
    @Transactional // Đảm bảo an toàn dữ liệu: Hoặc là lưu thành công hết, hoặc là rollback (hủy) toàn bộ nếu có lỗi
    public String toggleReaction(String username, UUID postId, ReactionType type) {
        
        // 1. Tìm User và Post trong Database (Kiểm tra xem người dùng và bài viết có tồn tại thật không)
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài viết"));

        // 2. Tìm xem User này đã từng thả cảm xúc vào Post này chưa?
        Optional<Reaction> existingReaction = reactionRepository.findByUserIdAndPostId(user.getId(), post.getId());

        // Nếu ĐÃ TỪNG thả rồi:
        if (existingReaction.isPresent()) {
            Reaction reaction = existingReaction.get();
            
            if (reaction.getType() == type) {
                // Nhấn trùng với cảm xúc cũ -> Thu hồi (Xóa khỏi DB)
                reactionRepository.delete(reaction);
                return "Đã thu hồi cảm xúc";
            } else {
                // Nhấn cảm xúc mới khác với cái cũ -> Cập nhật sang loại mới
                reaction.setType(type);
                reactionRepository.save(reaction);
                return "Đã đổi sang " + type.name();
            }
        } 
        // Nếu CHƯA TỪNG thả:
        else {
            Reaction newReaction = Reaction.builder()
                    .user(user)
                    .post(post)
                    .type(type)
                    .build();
            reactionRepository.save(newReaction);
           notificationService.createNotification(
                post.getUser(), 
                user, 
                NotificationType.REACTION, 
                post.getId(), 
                user.getFullName() + " đã bày tỏ cảm xúc " + type.name() + " vào bài viết của bạn."
            );
            return "Đã thả " + type.name();
        }
    }
    @Transactional
    public String toggleCommentReaction(String username, UUID commentId, ReactionType type) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bình luận"));

        Optional<Reaction> existingReaction = reactionRepository.findByUserIdAndCommentId(user.getId(), comment.getId());

        if (existingReaction.isPresent()) {
            Reaction reaction = existingReaction.get();
            if (reaction.getType() == type) {
                // 1. Thu hồi tim (Xóa khỏi bảng reactions)
                reactionRepository.delete(reaction);
                
                // 2. Trừ đi 1 lượt thích trong bảng comments
                int currentReactions = comment.getTotalReactions() != null ? comment.getTotalReactions() : 0;
                comment.setTotalReactions(Math.max(0, currentReactions - 1));
                commentRepository.save(comment);

                return "Đã thu hồi cảm xúc bình luận";
            } else {
                reaction.setType(type);
                reactionRepository.save(reaction);
                return "Đã đổi cảm xúc bình luận sang " + type.name();
            }
        } else {
            // 1. Thả tim mới (Lưu vào bảng reactions)
            Reaction newReaction = Reaction.builder()
                    .user(user)
                    .comment(comment) // Trỏ vào Comment
                    .type(type)
                    .build();
            reactionRepository.save(newReaction);
            
            // 2. Cộng thêm 1 lượt thích vào bảng comments
            int currentReactions = comment.getTotalReactions() != null ? comment.getTotalReactions() : 0;
            comment.setTotalReactions(currentReactions + 1);
            commentRepository.save(comment);

            notificationService.createNotification(
                comment.getUser(), 
                user, 
                NotificationType.REACTION, 
                comment.getPost().getId(), 
                user.getFullName() + " đã bày tỏ cảm xúc vào bình luận của bạn."
            );
            return "Đã thả " + type.name() + " vào bình luận";
        }
    }
}