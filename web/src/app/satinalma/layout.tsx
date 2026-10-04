import { PurchasingTabs } from "./tabs";

export default function PurchasingLayout({ children }: LayoutProps<"/satinalma">) {
  return (
    <div className="max-w-6xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Satın Alma</h1>
        <p className="text-sm text-zinc-500">Ana bayiden ve dış tedarikçilerden yapılan lastik alımları</p>
      </div>
      <PurchasingTabs />
      {children}
    </div>
  );
}
