"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import type { PropertyImage } from "@/types";

async function convertHeicToWebp(file: File): Promise<File> {
  const heic2any = (await import("heic2any")).default;
  const blob = await heic2any({ blob: file, toType: "image/webp", quality: 0.85 }) as Blob;
  const name = file.name.replace(/\.heic$/i, ".webp");
  return new File([blob], name, { type: "image/webp" });
}

async function prepareFiles(files: File[]): Promise<File[]> {
  return Promise.all(
    files.map((f) =>
      /\.heic$/i.test(f.name) || f.type === "image/heic" || f.type === "image/heif"
        ? convertHeicToWebp(f)
        : f
    )
  );
}

interface PropertyImagesProps {
  propertyId: string;
  unitId?: string;
}

export default function PropertyImages({ propertyId, unitId }: PropertyImagesProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const apiPath = unitId
    ? `/api/units/${unitId}/images`
    : `/api/properties/${propertyId}/images`;

  const fetchImages = useCallback(async () => {
    try {
      const res = await fetch(apiPath);
      if (res.ok) setImages(await res.json());
    } catch {
      /* */
    } finally {
      setLoading(false);
    }
  }, [apiPath]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  useEffect(() => {
    if (previewIndex === null) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") setPreviewIndex((i) => i !== null ? (i + 1) % images.length : null);
      else if (e.key === "ArrowLeft") setPreviewIndex((i) => i !== null ? (i - 1 + images.length) % images.length : null);
      else if (e.key === "Escape") setPreviewIndex(null);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [previewIndex, images.length]);

  async function uploadFiles(files: FileList | File[]) {
    setError("");
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;
    setUploading(true);
    try {
      const prepared = await prepareFiles(fileArray);
      const formData = new FormData();
      prepared.forEach((f) => formData.append("files", f));
      const res = await fetch(apiPath, {
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

  async function setPrimaryImage(imageId: string) {
    setError("");
    try {
      const res = await fetch(apiPath, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "メイン画像の設定に失敗しました");
        return;
      }
      setImages((prev) =>
        prev.map((img) => ({ ...img, is_primary: img.id === imageId }))
      );
      router.refresh();
    } catch {
      setError("メイン画像の設定に失敗しました");
    }
  }

  async function deleteImage(imageId: string) {
    if (!confirm("この画像を削除しますか？")) return;
    setError("");
    try {
      const res = await fetch(apiPath, {
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
      if (previewIndex !== null) {
        const deletedIdx = images.findIndex((img) => img.id === imageId);
        if (images.length <= 1) setPreviewIndex(null);
        else if (deletedIdx <= previewIndex) setPreviewIndex(Math.max(0, previewIndex - 1));
      }
    } catch {
      setError("削除に失敗しました");
    }
  }

  if (loading) {
    return (
      <div className="flex gap-2 mb-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton w-28 h-20 rounded-lg shrink-0" />
        ))}
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex gap-2 flex-wrap">
        {images.map((img, i) => (
          <div
            key={img.id}
            onClick={() => setPreviewIndex(i)}
            className="group/card relative w-28 h-20 rounded-lg overflow-hidden bg-bg-2 cursor-pointer shrink-0"
          >
            <img
              src={img.url}
              alt={img.file_name}
              className="w-full h-full object-cover"
            />
            {img.is_primary && (
              <Star size={10} className="absolute bottom-1 left-1 text-amber-400 fill-amber-400 drop-shadow" />
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteImage(img.id);
              }}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover/card:opacity-100 transition-opacity hover:bg-red-500"
              title="削除"
            >
              <X size={10} />
            </button>
          </div>
        ))}
        {images.length < 10 && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-28 h-20 rounded-lg border-2 border-dashed border-line hover:border-accent flex flex-col items-center justify-center cursor-pointer transition-colors hover:bg-accent-tint/50 shrink-0"
          >
            <ImagePlus size={18} className="text-ink-3/50 mb-0.5" />
            <span className="text-[10px] text-ink-3">
              {uploading ? "処理中..." : "追加"}
            </span>
          </div>
        )}
      </div>

      {error && (
        <p className="text-danger text-[11px] mt-2">{error}</p>
      )}

      {/* フルスクリーンプレビュー */}
      {previewIndex !== null && images[previewIndex] && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          onClick={() => setPreviewIndex(null)}
        >
          <button
            onClick={() => setPreviewIndex(null)}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors z-10"
          >
            <X size={24} />
          </button>

          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
            <span className="text-white/60 text-[13px] tabular-nums">
              {previewIndex + 1} / {images.length}
            </span>
            {!images[previewIndex].is_primary && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPrimaryImage(images[previewIndex].id);
                }}
                className="flex items-center gap-1 text-white/60 hover:text-amber-400 text-[12px] transition-colors"
              >
                <Star size={12} />
                メインに設定
              </button>
            )}
            {images[previewIndex].is_primary && (
              <span className="flex items-center gap-1 text-amber-400 text-[12px]">
                <Star size={12} className="fill-amber-400" />
                メイン画像
              </span>
            )}
          </div>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewIndex((previewIndex - 1 + images.length) % images.length);
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewIndex((previewIndex + 1) % images.length);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          <img
            src={images[previewIndex].url}
            alt={images[previewIndex].file_name}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewIndex(i);
                }}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === previewIndex ? "bg-white" : "bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
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
