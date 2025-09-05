"use client";
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function SetLocaleClient({ locale }: { locale: string }) {
  const { i18n } = useTranslation();
  useEffect(() => {
    if (locale && i18n.language !== locale) {
      i18n.changeLanguage(locale).catch(() => {});
    }
  }, [locale, i18n]);
  return null;
}
