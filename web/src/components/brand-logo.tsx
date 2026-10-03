import Image from "next/image";

// Resmi LastikPark logosu (lastikpark.com). Beyaz, şeffaf zemin: kırmızı bar üzerinde kullanılır.
export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/brand/lastikpark-logo.png"
      alt="LastikPark"
      width={277}
      height={59}
      priority
      className={`h-9 w-auto ${className}`}
    />
  );
}
