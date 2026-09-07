"use client";

import { useRef, useState } from "react";

const builtInIcons = [
  ["cart", "🛒"], ["home", "🏠"], ["children", "🧸"], ["health", "💊"],
  ["clothes", "👕"], ["transport", "🚗"], ["fun", "🎭"], ["travel", "✈️"],
  ["bill", "🧾"], ["income", "💼"],
] as const;

export function FamilyIconPicker({ initialValue = "cart" }: { initialValue?: string }) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  async function upload(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Выберите изображение."); return; }
    try {
      const resized = await resizeIcon(file);
      setValue(resized); setError("");
    } catch { setError("Не удалось обработать изображение."); }
  }

  return <fieldset className="family-icon-picker"><legend>Выберите иконку</legend><input type="hidden" name="icon" value={value}/>{builtInIcons.map(([name, icon]) => <button type="button" className={value === name ? "selected" : ""} onClick={() => { setValue(name); setError(""); }} key={name} aria-label={`Иконка ${icon}`}><span>{icon}</span></button>)}<button type="button" className={value.startsWith("data:image/") ? "selected custom" : "custom"} onClick={() => fileInput.current?.click()} aria-label="Загрузить свою иконку">{value.startsWith("data:image/") ? <img src={value} alt="Своя иконка"/> : <><span>•••</span><small>Своя</small></>}</button><input ref={fileInput} className="family-icon-file" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => upload(event.target.files?.[0])}/>{error && <small className="form-error family-icon-error">{error}</small>}</fieldset>;
}

function resizeIcon(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const image = new Image();
      image.onerror = reject;
      image.onload = () => {
        const size = 96; const canvas = document.createElement("canvas"); canvas.width = size; canvas.height = size;
        const context = canvas.getContext("2d"); if (!context) { reject(new Error("canvas")); return; }
        const scale = Math.max(size / image.width, size / image.height); const width = image.width * scale; const height = image.height * scale;
        context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
        resolve(canvas.toDataURL("image/webp", .82));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
