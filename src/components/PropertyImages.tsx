"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
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
  const [current, setCurrent] = useState(0);
  const [previewImage, setPreviewImage] = useState<PropertyImage | null>(null);
  const [managing, setManaging] = useState(false);

  const fetchImages = useCallback(async () => {
    try {
      const res = await fetch(`/api/properties/${propertyId}/images`);
      if (res.ok) setImages(await res.json());
    } catch {
      /* */
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
      if (current >= images.length - 1) setCurrent(Math.max(0, current - 1));
      if (previewImage?.id === imageId) setPreviewImage(null);
    } catch {
      setError("削除に失敗しました");
    }
  }

  if (loading) {
    return (
      <div className="flex gap-3 mb-6">
        <div className="skeleton w-48 h-32 rounded-lg shrink-0" />
        <div className="flex gap-1.5 overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton w-16 h-16 rounded shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="mb-6">
        <div
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-3 rounded-lg border-2 border-dashed border-border-light hover:border-accent px-5 py-4 cursor-pointer transition-colors hover:bg-accent-subtle/50"
        >
          <Building2 size={28} className="text-text-muted/40" />
          <div>
            <p className="text-[12px] text-text-secondary">物件画像を追加</p>
            <p className="text-[11px] text-text-muted">JPEG / PNG / WebP</p>
          </div>
        </div>
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
        {error && (
          <p className="text-danger text-[11px] mt-2">{error}</p>
        )}
      </div>
    );
  }

  const mainImage = images[current];

  return (
    <div className="mb-6">
      <div className="flex gap-3 items-start">
        {/* メイン画像 */}
        <div
          className="relative w-48 h-32 shrink-0 rounded-lg overflow-hidden bg-bg-secondary cursor-pointer group"
          onClick={() => setPreviewImage(mainImage)}
        >
          <img
            src={mainImage.url}
            alt={mainImage.file_name}
            className="w-full h-full object-cover"
          />
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrent((current - 1 + images.length) % images.length);
                }}
                className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrent((current + 1) % images.length);
                }}
                className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ChevronRight size={14} />
              </button>
            </>
          )}
          <div className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[10px] rounded px-1.5 py-0.5 tabular-nums">
            {current + 1}/{images.length}
          </div>
        </div>

        {/* サムネイル列 */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex gap-1.5 flex-wrap">
            {images.slice(0, 8).map((img, i) => (
              <div
                key={img.id}
                onClick={() => setCurrent(i)}
                className={`
                  w-[38px] h-[38px] rounded overflow-hidden cursor-pointer shrink-0 transition-all
                  ${i === current ? "ring-2 ring-accent ring-offset-1" : "opacity-70 hover:opacity-100"}
                `}
              >
                <img
                  src={img.url}
                  alt={img.file_name}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {images.length > 8 && (
              <div
                onClick={() => setManaging(true)}
                className="w-[38px] h-[38px] rounded bg-bg-secondary flex items-center justify-center cursor-pointer text-[10px] font-medium text-text-muted hover:bg-border-light transition-colors"
              >
                +{images.length - 8}
              </div>
            )}
          </div>
          <button
            onClick={() => setManaging(true)}
            className="text-[11px] text-text-muted hover:text-accent transition-colors text-left"
          >
            画像を管理
          </button>
        </div>
      </div>

      {error && (
        <p className="text-danger text-[11px] mt-2">{error}</p>
      )}

      {/* フルスクリーンプレビュー */}
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
        </div>
      )}

      {/* 管理パネル */}
      {managing && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setManaging(false)}
        >
          <div
            className="bg-card rounded-2xl shadow-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-semibold">
                画像管理
                <span className="text-text-muted font-normal ml-2">
                  {images.length}/10
                </span>
              </h2>
              <div className="flex items-center gap-2">
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
                <button
                  onClick={() => setManaging(false)}
                  className="text-text-muted hover:text-text transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-danger-bg text-danger text-[12px] rounded-lg px-3 py-2 mb-4">
                {error}
              </div>
            )}

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="group relative aspect-[4/3] rounded-lg overflow-hidden bg-bg-secondary cursor-pointer"
                  onClick={() => {
                    setPreviewImage(img);
                    setManaging(false);
                  }}
                >
                  <img
                    src={img.url}
                    alt={img.file_name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteImage(img.id);
                    }}
                    className="absolute top-1.5 right-1.5 bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              {images.length < 10 && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-[4/3] rounded-lg border-2 border-dashed border-border-light hover:border-accent flex flex-col items-center justify-center cursor-pointer transition-colors hover:bg-accent-subtle/50"
                >
                  <ImagePlus size={18} className="text-text-muted mb-1" />
                  <span className="text-[10px] text-text-muted">追加</span>
                </div>
              )}
            </div>
          </div>
        </div>
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
  );
}
