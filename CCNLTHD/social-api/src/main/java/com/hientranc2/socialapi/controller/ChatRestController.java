package com.hientranc2.socialapi.controller;

import com.hientranc2.socialapi.dto.ChatHistoryDTO;
import com.hientranc2.socialapi.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
@CrossOrigin("*")
public class ChatRestController {

    private final ChatService chatService;

    // Lấy lịch sử chat với 1 user khác
    @GetMapping("/history/{partnerUsername}")
    public ResponseEntity<List<ChatHistoryDTO>> getHistory(Principal principal, @PathVariable String partnerUsername) {
        return ResponseEntity.ok(chatService.getChatHistory(principal.getName(), partnerUsername));
    }
}