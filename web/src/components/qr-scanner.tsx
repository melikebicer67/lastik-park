"use client";

import jsQR from "jsqr";
import { useEffect, useRef, useState } from "react";
import { secondaryButton } from "./ui/styles";

// Kamerayla etiketteki QR kodunu okur. Kamera erişimi sadece HTTPS veya localhost'ta çalışır.
// El tipi barkod okuyucu klavye gibi davrandığından ona gerek yoktur: arama kutusuna okutmak yeterli.
export function QrScanner({ onResult, onClose }: { onResult: (text: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let frame = 0;
    let stopped = false;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const tick = () => {
      const video = videoRef.current;
      if (stopped || !video || !ctx) return;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
        if (code?.data) {
          stopped = true;
          onResult(code.data);
          return;
        }
      }
      frame = requestAnimationFrame(tick);
    };

    if (!navigator.mediaDevices?.getUserMedia) {
      queueMicrotask(() => setError("Bu tarayıcıda kamera kullanılamıyor (HTTPS gerekli)."));
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => {
        stream = s;
        if (stopped || !videoRef.current) return;
        videoRef.current.srcObject = s;
        videoRef.current.play().catch(() => undefined);
        frame = requestAnimationFrame(tick);
      })
      .catch(() => setError("Kameraya erişilemedi. Tarayıcı izinlerini kontrol edin."));

    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onResult]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-md space-y-3 rounded-lg bg-white p-4 dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
        <div className="font-semibold">Etiketteki QR kodunu kameraya gösterin</div>
        {error ? (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
        ) : (
          <div className="relative overflow-hidden rounded-md bg-black">
            <video ref={videoRef} muted playsInline className="aspect-square w-full object-cover" />
            <div className="pointer-events-none absolute inset-[15%] rounded-lg border-4 border-brand-bright/80" />
          </div>
        )}
        <button type="button" onClick={onClose} className={`${secondaryButton} w-full`}>
          Kapat
        </button>
      </div>
    </div>
  );
}
