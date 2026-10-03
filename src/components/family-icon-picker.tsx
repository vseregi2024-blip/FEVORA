"use client";

import { useId, useRef, useState } from "react";

import { categoryIconImage, categoryIconPresets, categoryIconValue } from "@/lib/family-category-icons";

export function FamilyIconPicker({ initialValue = "expense-shopping" }: { initialValue?: string }) {
  const selectedValue = categoryIconValue(initialValue);
  const [customValue, setCustomValue] = useState(initialValue.startsWith("data:image/") ? initialValue : "");
  const [preview, setPreview] = useState(initialValue.startsWith("data:image/") ? initialValue : "");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const inputId = useId();

  async function upload(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Выберите изображение."); return; }
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview); setStatus("Подготавливаем иконку…"); setError("");
    try {
      const resized = await resizeIcon(file);
      URL.revokeObjectURL(localPreview); setCustomValue(resized); setPreview(resized); setStatus("Иконка выбрана");
    } catch { setCustomValue(""); setStatus(""); setError("Не удалось обработать изображение. Выберите PNG, JPG или WebP."); }
  }

  return <fieldset className="family-icon-picker"><legend>Выберите иконку</legend>
    {categoryIconPresets.map(({ value, label }) => <label key={value} aria-label={`Иконка: ${label}`}><input type="radio" name="icon" value={value} defaultChecked={selectedValue === value}/><span><img src={categoryIconImage(value)} alt=""/></span></label>)}
    <label className={preview ? "custom selected" : "custom"} htmlFor={inputId} aria-label="Загрузить свою иконку">{preview ? <img src={preview} alt="Своя иконка"/> : <><span>•••</span><small>Своя</small></>}<input ref={fileInput} id={inputId} name="customIconFile" className="family-icon-file" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => upload(event.target.files?.[0])}/></label><input type="hidden" name="customIcon" value={customValue}/>{status && <small className="family-icon-status">{status}</small>}{error && <small className="form-error family-icon-error">{error}</small>}
  </fieldset>;
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
