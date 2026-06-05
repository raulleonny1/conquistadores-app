"use client";

import React from "react";
import { Delete } from "lucide-react";

type PinKeypadProps = {
  pin: string;
  onPinChange: (pin: string) => void;
  disabled?: boolean;
  maxLength?: number;
  titulo?: string;
};

export default function PinKeypad({
  pin,
  onPinChange,
  disabled = false,
  maxLength = 4,
  titulo = "Ingresa tu PIN",
}: PinKeypadProps) {
  const handleKeypad = (num: string) => {
    if (disabled || pin.length >= maxLength) return;
    onPinChange(pin + num);
  };

  const handleDelete = () => {
    if (disabled || pin.length === 0) return;
    onPinChange(pin.slice(0, -1));
  };

  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <h2 className="mb-4 text-lg font-bold text-white">{titulo}</h2>
        <div className="mb-2 flex justify-center gap-4">
          {[...Array(maxLength)].map((_, i) => (
            <div
              key={i}
              className={`h-4 w-4 rounded-full border-2 transition-all duration-300 ${
                pin.length > i
                  ? "scale-110 border-white bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                  : "border-white/30 bg-transparent"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            type="button"
            disabled={disabled}
            onClick={() => handleKeypad(num.toString())}
            className="flex aspect-square w-full touch-manipulation select-none items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl font-bold text-white transition-all hover:bg-white/20 active:scale-95 active:bg-white/30 disabled:opacity-50"
          >
            {num}
          </button>
        ))}
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleKeypad("*")}
          className="flex aspect-square w-full touch-manipulation select-none items-center justify-center rounded-2xl border border-yellow-500/20 bg-yellow-500/10 text-2xl font-bold text-yellow-400 transition-all hover:bg-yellow-500/20 active:scale-95 active:bg-yellow-500/30 disabled:opacity-50"
        >
          *
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleKeypad("0")}
          className="flex aspect-square w-full touch-manipulation select-none items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl font-bold text-white transition-all hover:bg-white/20 active:scale-95 active:bg-white/30 disabled:opacity-50"
        >
          0
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={handleDelete}
          className="flex aspect-square w-full touch-manipulation select-none items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400 transition-all hover:bg-red-500/20 active:scale-95 active:bg-red-500/30 disabled:opacity-50"
        >
          <Delete className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
