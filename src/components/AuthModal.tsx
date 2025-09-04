"use client";
import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import AuthForm from "@/components/AuthForm";
import React from "react";

export default function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} className="fixed z-50 inset-0">
      {/* Fondo más oscuro para resaltar el modal */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
      <div className="flex items-center justify-center min-h-screen px-4">
        <Dialog.Panel
          className="relative bg-white dark:bg-secondary-900 rounded-2xl shadow-2xl border border-secondary-200 dark:border-white/20 w-full max-w-md mx-auto p-8 z-10"
        >
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:text-gray-600 dark:hover:text-black"
            aria-label="Cerrar"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
          <AuthForm onSuccess={onClose} />
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
