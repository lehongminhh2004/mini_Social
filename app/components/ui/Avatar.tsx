import Image from "next/image";
import { cn } from "@/app/lib/utils";

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function Avatar({ src, alt = "Avatar", size = "md", className }: AvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  return (
    <div
      className={cn(
        "relative rounded-full overflow-hidden bg-secondary shrink-0",
        sizeClasses[size],
        className
      )}
    >
      {src && src.trim() !== "" ? (
        <Image src={src} alt={alt} fill className="object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-400 font-medium">
          {alt.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}
