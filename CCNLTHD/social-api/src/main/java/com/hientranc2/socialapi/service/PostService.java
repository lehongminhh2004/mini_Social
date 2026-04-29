package com.hientranc2.socialapi.service;

import com.hientranc2.socialapi.dto.PostResponseDTO;
import com.hientranc2.socialapi.model.Post;
import com.hientranc2.socialapi.model.ReactionType;
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
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final ReactionRepository reactionRepository;
    private final CommentRepository commentRepository;
    private final ShareRepository shareRepository;

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

    // 2. Lấy bảng tin có phân trang
    public List<PostResponseDTO> getNewsFeed(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Post> postPage = postRepository.findAllByOrderByCreatedAtDesc(pageable);

        return postPage.stream().map(post -> {
            // Build reaction breakdown map (đảm bảo đủ 5 loại, loại nào 0 thì vẫn có key)
            Map<ReactionType, Long> breakdown = new EnumMap<>(ReactionType.class);
            Arrays.stream(ReactionType.values()).forEach(t -> breakdown.put(t, 0L));
            reactionRepository.countByPostIdGroupByType(post.getId())
                    .forEach(row -> breakdown.put((ReactionType) row[0], (Long) row[1]));

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
                    .build();
        }).collect(Collectors.toList());
    }
}
