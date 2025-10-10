"use client";

import React from "react";

interface MailtoProps {
  email: string;
  subject?: string;
  body?: string;
  children?: React.ReactNode;
}

/**
 * Komponen Mailto — digunakan untuk membuat link mailto dengan subject & body bawaan.
 * Bisa membungkus button, text, atau icon.
 */
export default function Mailto({ email, subject, body, children }: MailtoProps) {
  // Encode subject & body untuk URL mailto
  const params = new URLSearchParams();
  if (subject) params.append("subject", subject);
  if (body) params.append("body", body);

  const href = `mailto:${email}${params.toString() ? `?${params.toString()}` : ""}`;

  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}
