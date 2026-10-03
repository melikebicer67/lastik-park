"use client";

import { useEffect, useState } from "react";
import { api, Employee } from "@/lib/api";
import { input } from "./ui/styles";

const STORAGE_KEY = "lastikpark.employeeId";

// İşlemi yapan personel. Son seçim bu tarayıcıda hatırlanır (tezgahtaki bilgisayar genelde aynı kişide).
export function EmployeeSelect({ value, onChange }: { value: number | null; onChange: (id: number | null) => void }) {
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    api<Employee[]>("/employees")
      .then((list) => {
        setEmployees(list);
        let saved: number | null = null;
        try {
          saved = Number(localStorage.getItem(STORAGE_KEY)) || null;
        } catch {
          // depolama kapalıysa hatırlama olmadan devam
        }
        if (saved && list.some((e) => e.id === saved)) onChange(saved);
      })
      .catch(() => setEmployees([]));
    // sadece ilk yüklemede
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <select
      value={value ?? ""}
      onChange={(e) => {
        const id = Number(e.target.value) || null;
        onChange(id);
        try {
          if (id) localStorage.setItem(STORAGE_KEY, String(id));
        } catch {
          // yok say
        }
      }}
      className={input}
    >
      <option value="">Seçilmedi</option>
      {employees.map((e) => (
        <option key={e.id} value={e.id}>
          {e.name}
        </option>
      ))}
    </select>
  );
}
