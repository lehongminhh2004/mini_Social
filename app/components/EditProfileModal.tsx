'use client';

import { useState, useRef } from 'react';
import { X, Loader2, Camera } from 'lucide-react';
import { api } from '@/app/lib/api';
import { useQueryClient } from '@tanstack/react-query';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: {
    fullName: string;
    bio: string;
    avatarUrl: string;
  };
}

export function EditProfileModal({ isOpen, onClose, initialData }: EditProfileModalProps) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null); 

  const [formData, setFormData] = useState({
    fullName: initialData.fullName || '',
    bio: initialData.bio || '',
    avatarUrl: initialData.avatarUrl || '',
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(initialData.avatarUrl || '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file)); 
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let finalAvatarUrl = formData.avatarUrl; // Mặc định giữ link cũ

      // 🔥 BƯỚC 1: Nếu có chọn file ảnh mới, gọi API FileUploadController của bạn
      if (selectedFile) {
        const uploadData = new FormData();
        uploadData.append('file', selectedFile); // 'file' phải khớp với @RequestParam("file") bên Spring Boot

        // Bắn qua API upload bạn viết sẵn
        const uploadRes = await api.post('/upload/image', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        
        // uploadRes.data chính là cái String URL trả về từ Cloudinary
        finalAvatarUrl = uploadRes.data; 
      }

      // 🔥 BƯỚC 2: Gọi API cập nhật thông tin user như bình thường (JSON)
      await api.put('/users/profile', {
        fullName: formData.fullName,
        bio: formData.bio,
        avatarUrl: finalAvatarUrl,
      });
      
      // Load lại giao diện
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] }); 
      
      onClose(); 
    } catch (error) {
      console.error("Lỗi cập nhật profile:", error);
      alert("Cập nhật thất bại. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        className="bg-background w-full max-w-[500px] rounded-2xl shadow-xl border border-border overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Edit profile</h2>
          <button onClick={onClose} className="p-2 bg-secondary text-foreground rounded-full hover:bg-secondary/80 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-5">
          
          {/* KHU VỰC UP ẢNH */}
          <div className="flex flex-col items-center gap-3">
            <div 
              className="relative group cursor-pointer" 
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-border group-hover:opacity-70 transition-opacity bg-secondary flex items-center justify-center">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera size={32} className="text-muted" />
                )}
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white" size={24} />
              </div>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <p className="text-sm text-blue-500 font-medium cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              Thay đổi ảnh đại diện
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">Tên hiển thị</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Nhập tên của bạn..."
              className="w-full bg-secondary text-foreground border border-border rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:border-foreground transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">Tiểu sử</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Viết gì đó về bạn..."
              rows={3}
              className="w-full bg-secondary text-foreground border border-border rounded-xl px-4 py-3 text-[15px] focus:outline-none focus:border-foreground transition-colors resize-none custom-scrollbar"
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-foreground text-background font-bold py-3 rounded-xl mt-2 hover:bg-foreground/80 transition-colors flex justify-center items-center gap-2 disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Lưu thay đổi'}
          </button>
        </form>
      </div>
    </div>
  );
}