'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
}

export function ImageViewerModal({ isOpen, onClose, images, initialIndex = 0 }: ImageViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Cập nhật lại vị trí ảnh mỗi khi mở modal
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      // Khóa cuộn chuột ở trang nền khi đang xem ảnh
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialIndex]);

  if (!images || images.length === 0) return null;

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex < images.length - 1) setCurrentIndex(prev => prev + 1);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose} // Bấm ra ngoài rìa đen sẽ đóng
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center select-none"
        >
          {/* Nút Đóng */}
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 md:top-6 md:right-6 p-2 text-white/70 hover:text-white bg-black/20 hover:bg-black/50 rounded-full transition-all z-50"
          >
            <X size={28} />
          </button>

          {/* Bộ đếm ảnh (Ví dụ: 1 / 4) */}
          {images.length > 1 && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 text-white/80 bg-black/40 px-4 py-1.5 rounded-full text-sm font-medium z-50 tracking-wider">
              {currentIndex + 1} / {images.length}
            </div>
          )}

          {/* Nút Lùi */}
          {images.length > 1 && currentIndex > 0 && (
            <button 
              onClick={handlePrev} 
              className="absolute left-4 md:left-10 p-3 text-white/70 hover:text-white bg-black/20 hover:bg-black/50 rounded-full transition-all z-50"
            >
              <ChevronLeft size={36} />
            </button>
          )}

          {/* Khu vực hiển thị ảnh chính */}
          <div 
            className="w-full h-full p-4 md:p-12 flex items-center justify-center relative"
            onClick={(e) => e.stopPropagation()} // Chặn click xuyên qua ảnh
          >
            <motion.img
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              src={images[currentIndex]}
              alt={`Viewed image ${currentIndex}`}
              className="max-w-full max-h-full object-contain drop-shadow-2xl"
            />
          </div>

          {/* Nút Tiến */}
          {images.length > 1 && currentIndex < images.length - 1 && (
            <button 
              onClick={handleNext} 
              className="absolute right-4 md:right-10 p-3 text-white/70 hover:text-white bg-black/20 hover:bg-black/50 rounded-full transition-all z-50"
            >
              <ChevronRight size={36} />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}