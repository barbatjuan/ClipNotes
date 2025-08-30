"use client";
import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import AuthForm from "@/components/AuthForm";
import React from "react";

export default function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} className="fixed z-50 inset-0">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="flex items-center justify-center min-h-screen px-4">
        <Dialog.Panel className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-auto p-6 z-10">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            aria-label="Cerrar"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
          <AuthForm />
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
