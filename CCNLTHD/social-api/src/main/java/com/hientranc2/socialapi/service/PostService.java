package com.hientranc2.socialapi.service;

import com.hientranc2.socialapi.dto.PostResponseDTO;
import com.hientranc2.socialapi.model.Post;
import com.hientranc2.socialapi.model.ReactionType;
import com.hientranc2.socialapi.model.Share;
import com.hientranc2.socialapi.model.User;
import com.hientranc2.socialapi.repository.CommentRepository;
import com.hientranc2.socialapi.repository.PostRepository;
import com.hientranc2.socialapi.repository.ReactionRepository;
import com.hientranc2.socialapi.repository.ShareRepository;
import com.hientranc2.socialapi.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final ReactionRepository reactionRepository;
    private final CommentRepository commentRepository;
    private final ShareRepository shareRepository;

    // Hàm Helper: Đóng gói code biến hình DTO để dùng chung, giúp code gọn và chuyên nghiệp hơn
    private PostResponseDTO mapToPostResponseDTO(Post post, User currentUser) {
        Map<ReactionType, Long> breakdown = new EnumMap<>(ReactionType.class);
        Arrays.stream(ReactionType.values()).forEach(t -> breakdown.put(t, 0L));
        reactionRepository.countByPostIdGroupByType(post.getId())
                .forEach(row -> breakdown.put((ReactionType) row[0], (Long) row[1]));

        // Kiểm tra xem User hiện tại đã like bài này chưa
        boolean hasLiked = reactionRepository.findByUserIdAndPostId(currentUser.getId(), post.getId()).isPresent();

        boolean hasShared = shareRepository.findByUserIdAndPostId(currentUser.getId(), post.getId()).isPresent();
        return PostResponseDTO.builder()
                .id(post.getId())
                .authorUsername(post.getUser().getUsername())
                .authorName(post.getUser().getFullName())
                .authorAvatarUrl(post.getUser().getAvatarUrl())
                .content(post.getContent())
                .mediaUrl(post.getMediaUrl())
                .createdAt(post.getCreatedAt())
                .totalReactions(reactionRepository.countByPostId(post.getId()))
                .totalComments(commentRepository.countByPostId(post.getId()))
                .totalShares(shareRepository.countByPostId(post.getId()))
                .reactionBreakdown(breakdown)
                .isLiked(hasLiked)
                .isShared(hasShared) 
                .build();
    }

    // 1. Tạo bài viết mới
    public Post createPost(String username, String content, String mediaUrl) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        Post newPost = Post.builder()
                .user(user)
                .content(content)
                .mediaUrl(mediaUrl)
                .build();

        return postRepository.save(newPost);
    }

    // 2. Lấy bảng tin
    public List<PostResponseDTO> getNewsFeed(String username, int page, int size) {
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        Pageable pageable = PageRequest.of(page, size);
        Page<Post> postPage = postRepository.findAllByOrderByCreatedAtDesc(pageable);

        // Gọi hàm helper ở trên để map dữ liệu cực ngắn gọn
        return postPage.stream()
                .map(post -> mapToPostResponseDTO(post, currentUser))
                .collect(Collectors.toList());
    }

    // 3. THÊM MỚI: Lấy chi tiết 1 bài viết (Cho trang đọc Comment)
    public PostResponseDTO getPostById(String username, UUID postId) {
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bài viết"));

        return mapToPostResponseDTO(post, currentUser);
    }
    // THÊM MỚI: Lấy danh sách bài viết mà một User đã Share (Đăng lại)
    public List<PostResponseDTO> getSharedPostsByUser(String currentUsername, String targetUsername, int page, int size) {
        // 1. Lấy người ĐANG XEM (để tô màu trái tim cho đúng)
        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng hiện tại"));

        // 2. Lấy danh sách các bản ghi Share của người CHỦ TRANG CÁ NHÂN
        Pageable pageable = PageRequest.of(page, size);
        Page<Share> sharedPage = shareRepository.findByUserUsernameOrderByCreatedAtDesc(targetUsername, pageable);

        // 3. Biến hình từ bảng Share -> Bảng Post -> DTO cho Frontend
        return sharedPage.stream()
                .map(share -> mapToPostResponseDTO(share.getPost(), currentUser)) // Dùng lại hàm Helper thần thánh!
                .collect(Collectors.toList());
}}