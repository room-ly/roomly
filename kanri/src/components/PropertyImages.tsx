"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePermission } from "@/lib/use-permission";
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

// 物件・部屋写真の最大長辺。これ以上大きい画像は縮小する。
// 一覧カードや詳細のプレビュー用途には2000pxあれば十分で、原寸(スマホ/カメラは4000px級・数MB)を
// そのまま保存・配信するのは転送量と表示速度の無駄になる。
const MAX_DIMENSION = 2000;
const WEBP_QUALITY = 0.82;

// JPEG/PNG等のラスタ画像をcanvasでリサイズしつつWebPに再エンコードする。
// 劣化がほぼ分からない品質(0.82)で数MB→数百KBに落とし、表示と転送を軽くする。
// HEICはブラウザがcanvasに描けないため対象外（convertHeicToWebpで別途変換）。
async function resizeToWebp(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file; // 変換不可なら原本のまま（アップロード自体は通す）
    }
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/webp", WEBP_QUALITY)
    );
    if (!blob) return file;

    // 万一WebP化で逆に大きくなった場合（既に十分小さい画像等）は原本を使う
    if (blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], name, { type: "image/webp" });
  } catch {
    // createImageBitmap失敗（未対応形式等）は原本のままアップロードする
    return file;
  }
}

async function prepareFiles(files: File[]): Promise<File[]> {
  return Promise.all(
    files.map(async (f) => {
      // HEIC/HEIF は専用ライブラリでWebP化
      if (/\.heic$/i.test(f.name) || f.type === "image/heic" || f.type === "image/heif") {
        return convertHeicToWebp(f);
      }
      // GIF はアニメーションが壊れるのでcanvas変換しない
      if (f.type === "image/gif") return f;
      // その他のラスタ画像(JPEG/PNG/WebP等)はリサイズ+WebP再エンコード
      if (/^image\//.test(f.type)) return resizeToWebp(f);
      return f;
    })
  );
}

interface PropertyImagesProps {
  propertyId: string;
  unitId?: string;
  // trueにすると閲覧のみ（追加・削除・メイン設定ボタンを出さない）
  readOnly?: boolean;
  // falseのとき画像を取得しない。閉じたモーダル内にマウントされている間の無駄なfetchを防ぐ
  // （物件一覧では各カードが編集モーダルを内包しており、全カード分の画像APIが裏で走っていた）
  enabled?: boolean;
}

export default function PropertyImages({ propertyId, unitId, readOnly: readOnlyProp, enabled = true }: PropertyImagesProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  // 画像CRUDは properties:edit / units:edit を満たせば許可（呼出側で readOnly を渡すこともできる）
  const canEditProperty = usePermission("properties:edit");
  const canEditUnit = usePermission("units:edit");
  const canManage = unitId ? canEditUnit : canEditProperty;
  const readOnly = readOnlyProp || !canManage;
  // ドラッグ/スワイプ用の状態。pointerdownでstartXに記録、pointermoveでdragXを更新
  const dragStartRef = useRef<number | null>(null);
  const [dragX, setDragX] = useState(0);
  // ドラッグ離した後のスライドアニメーション方向（次へ:1、前へ:-1、戻す:0）
  const [slideTo, setSlideTo] = useState<-1 | 0 | 1>(0);
  // スライドアニメ完了直後、基準位置へ瞬時に戻すためのフラグ（transitionを切る）
  const [snapping, setSnapping] = useState(false);
  const SWIPE_THRESHOLD = 50;

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
    if (!enabled) return;
    fetchImages();
  }, [fetchImages, enabled]);

  // 同じ物件/部屋の画像セクションが複数ある場合（編集モーダル内と詳細ページ）に
  // 互いを再取得させるためのイベントキー
  const eventKey = unitId ? `unit:${unitId}` : `property:${propertyId}`;

  useEffect(() => {
    function handleChange(e: Event) {
      const ce = e as CustomEvent<{ key: string }>;
      if (ce.detail?.key === eventKey) {
        fetchImages();
      }
    }
    window.addEventListener("property-images:changed", handleChange);
    return () => window.removeEventListener("property-images:changed", handleChange);
  }, [eventKey, fetchImages]);

  function notifyChanged() {
    window.dispatchEvent(
      new CustomEvent("property-images:changed", { detail: { key: eventKey } })
    );
  }

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
      notifyChanged();
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
      notifyChanged();
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
      notifyChanged();
      router.refresh();
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
            {!readOnly && (
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
            )}
          </div>
        ))}
        {!readOnly && images.length < 10 && (
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
        {readOnly && images.length === 0 && (
          <p className="text-[12px] text-ink-3">画像はまだ登録されていません</p>
        )}
      </div>

      {error && (
        <p className="text-danger text-[11px] mt-2">{error}</p>
      )}

      {previewIndex !== null && images[previewIndex] && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-8"
          onClick={() => setPreviewIndex(null)}
        >
          <div
            className="relative bg-surface rounded-2xl shadow-xl max-w-3xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-line">
              <div className="flex items-center gap-3">
                <span className="text-ink-3 text-[13px] tabular-nums">
                  {previewIndex + 1} / {images.length}
                </span>
                {!readOnly && !images[previewIndex].is_primary && (
                  <button
                    onClick={() => setPrimaryImage(images[previewIndex].id)}
                    className="flex items-center gap-1 text-ink-3 hover:text-amber-500 text-[12px] transition-colors"
                  >
                    <Star size={12} />
                    メインに設定
                  </button>
                )}
                {images[previewIndex].is_primary && (
                  <span className="flex items-center gap-1 text-amber-500 text-[12px]">
                    <Star size={12} className="fill-amber-500" />
                    メイン画像
                  </span>
                )}
              </div>
              <button
                onClick={() => setPreviewIndex(null)}
                className="text-ink-3 hover:text-ink transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div
              className="relative flex items-center justify-center bg-bg-2 min-h-[300px] h-[70vh] overflow-hidden touch-pan-y select-none"
              onPointerDown={(e) => {
                if (images.length <= 1) return;
                // アニメーション中は受け付けない
                if (slideTo !== 0) return;
                dragStartRef.current = e.clientX;
                (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (dragStartRef.current === null) return;
                setDragX(e.clientX - dragStartRef.current);
              }}
              onPointerUp={(e) => {
                if (dragStartRef.current === null) return;
                const delta = e.clientX - dragStartRef.current;
                dragStartRef.current = null;
                if (delta <= -SWIPE_THRESHOLD) {
                  // 左へスワイプ → 次の画像へ送る（右から流れてくる）
                  setSlideTo(1);
                } else if (delta >= SWIPE_THRESHOLD) {
                  setSlideTo(-1);
                } else {
                  // 閾値未満 → 元の位置に戻す
                  setDragX(0);
                }
              }}
              onPointerCancel={() => {
                dragStartRef.current = null;
                setDragX(0);
              }}
            >
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => slideTo === 0 && setSlideTo(-1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-surface/80 hover:bg-surface text-ink-2 hover:text-ink rounded-full p-1.5 shadow transition-colors z-10"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => slideTo === 0 && setSlideTo(1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-surface/80 hover:bg-surface text-ink-2 hover:text-ink rounded-full p-1.5 shadow transition-colors z-10"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
              {/* 現在画像と前後画像を横に並べて translateX で動かすカルーセル
                  基準位置(中央スロット) = translateX(-33.3333%)
                  次へ送る = 左にもう1スロット分動かす = translateX(-66.6666%)
                  前へ送る = 右に1スロット分戻す    = translateX(0%) */}
              <div
                className="absolute top-0 bottom-0 flex items-center pointer-events-none"
                style={{
                  transform:
                    slideTo === 1
                      ? "translateX(-66.6666%)"
                      : slideTo === -1
                      ? "translateX(0%)"
                      : `translateX(calc(-33.3333% + ${dragX}px))`,
                  transitionProperty: "transform",
                  // ドラッグ中(slideTo=0)やスナップ復帰中はtransitionを切る、それ以外は200ms
                  transitionDuration:
                    snapping || (dragX && slideTo === 0) ? "0ms" : "200ms",
                  transitionTimingFunction: "ease-out",
                  width: "300%",
                  left: 0,
                }}
                onTransitionEnd={() => {
                  if (slideTo === 0) return;
                  // スライドアニメ完了 → インデックスを送り、transitionを切って基準位置へ瞬時に戻す
                  const next =
                    slideTo === 1
                      ? (previewIndex + 1) % images.length
                      : (previewIndex - 1 + images.length) % images.length;
                  setSnapping(true);
                  setPreviewIndex(next);
                  setSlideTo(0);
                  setDragX(0);
                  // 次フレームで transition を復活させる（瞬時スナップが描画された後）
                  requestAnimationFrame(() => {
                    requestAnimationFrame(() => setSnapping(false));
                  });
                }}
              >
                {/* 左スロット(前画像)：右ドラッグ(dragX>0)または前へスライド中(slideTo=-1)のときだけ表示 */}
                <div className="w-1/3 h-full flex items-center justify-center px-2">
                  {(dragX > 0 || slideTo === -1) && (
                    <img
                      src={images[(previewIndex - 1 + images.length) % images.length].url}
                      alt=""
                      draggable={false}
                      className="max-w-full max-h-full object-contain"
                    />
                  )}
                </div>
                {/* 現在の画像（中央） */}
                <div className="w-1/3 h-full flex items-center justify-center px-2">
                  <img
                    src={images[previewIndex].url}
                    alt={images[previewIndex].file_name}
                    draggable={false}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                {/* 右スロット(次画像)：左ドラッグ(dragX<0)または次へスライド中(slideTo=1)のときだけ表示 */}
                <div className="w-1/3 h-full flex items-center justify-center px-2">
                  {(dragX < 0 || slideTo === 1) && (
                    <img
                      src={images[(previewIndex + 1) % images.length].url}
                      alt=""
                      draggable={false}
                      className="max-w-full max-h-full object-contain"
                    />
                  )}
                </div>
              </div>
            </div>

            {images.length > 1 && (
              <div className="flex justify-center gap-1.5 py-3 border-t border-line">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => slideTo === 0 && setPreviewIndex(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === previewIndex ? "bg-accent" : "bg-ink-3/20 hover:bg-ink-3/40"
                    }`}
                  />
                ))}
              </div>
            )}
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
