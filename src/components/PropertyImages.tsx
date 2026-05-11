"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Trash2, X, Upload } from "lucide-react";
import type { PropertyImage } from "@/types";

interface PropertyImagesProps {
  propertyId: string;
}

export default function PropertyImages({ propertyId }: PropertyImagesProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [previewImage, setPreviewImage] = useState<PropertyImage | null>(null);

  const fetchImages = useCallback(async () => {
    try {
      const res = await fetch(`/api/properties/${propertyId}/images`);
      if (res.ok) {
        setImages(await res.json());
      }
    } catch {
      // 取得失敗時は空配列のまま
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  async function uploadFiles(files: FileList | File[]) {
    setError("");
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      fileArray.forEach((f) => formData.append("files", f));

      const res = await fetch(`/api/properties/${propertyId}/images`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "アップロードに失敗しました");
        return;
      }

      await fetchImages();
      router.refresh();
    } catch {
      setError("アップロードに失敗しました");
    } finally {
      setUploading(false);
    }
  }

  async function deleteImage(imageId: string) {
    if (!confirm("この画像を削除しますか？")) return;
    setError("");

    try {
      const res = await fetch(`/api/properties/${propertyId}/images`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "削除に失敗しました");
        return;
      }

      setImages((prev) => prev.filter((img) => img.id !== imageId));
      if (previewImage?.id === imageId) setPreviewImage(null);
    } catch {
      setError("削除に失敗しました");
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[14px] font-semibold flex items-center gap-2">
          <ImagePlus size={16} className="text-accent" />
          物件画像
          <span className="text-text-muted font-normal">
            ({images.length}/10)
          </span>
        </h2>
        {images.length < 10 && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn-secondary text-[12px] py-1.5 px-3"
          >
            <Upload size={13} />
            {uploading ? "アップロード中..." : "追加"}
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) uploadFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <div className="bg-danger-bg text-danger text-[12px] rounded-lg px-3 py-2 mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="skeleton aspect-[4/3] rounded-lg"
            />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
            ${dragging
              ? "border-accent bg-accent-subtle"
              : "border-border-light hover:border-accent hover:bg-accent-subtle/50"
            }
          `}
        >
          <ImagePlus
            size={32}
            className="mx-auto mb-2 text-text-muted"
          />
          <p className="text-[13px] text-text-secondary">
            ドラッグ&ドロップ または クリックで画像を追加
          </p>
          <p className="text-[11px] text-text-muted mt-1">
            JPEG、PNG、WebP（最大5MB / 10枚まで）
          </p>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div
            className={`
              grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 transition-all
              ${dragging ? "ring-2 ring-accent ring-offset-2 rounded-xl" : ""}
            `}
          >
            {images.map((img) => (
              <div
                key={img.id}
                className="group relative aspect-[4/3] rounded-lg overflow-hidden bg-bg-secondary cursor-pointer"
                onClick={() => setPreviewImage(img)}
              >
                <img
                  src={img.url}
                  alt={img.file_name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteImage(img.id);
                  }}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}

            {images.length < 10 && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="aspect-[4/3] rounded-lg border-2 border-dashed border-border-light hover:border-accent flex flex-col items-center justify-center cursor-pointer transition-colors hover:bg-accent-subtle/50"
              >
                <ImagePlus size={20} className="text-text-muted mb-1" />
                <span className="text-[11px] text-text-muted">追加</span>
              </div>
            )}
          </div>
        </div>
      )}

      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          <img
            src={previewImage.url}
            alt={previewImage.file_name}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[12px] rounded-full px-4 py-1.5">
            {previewImage.file_name}
          </div>
        </div>
      )}
    </div>
  );
}
