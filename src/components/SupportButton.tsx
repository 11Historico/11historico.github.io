// src/components/SupportButton.tsx

import "./SupportButton.css";

const KOFI_URL = "https://ko-fi.com/I6M721AN3H";
const PAYPAL_URL = "https://www.paypal.com/paypalme/ikeritus";

interface SupportButtonProps {
  variant?: "home" | "final";
  className?: string;
}

export function SupportButton({
  variant = "home",
  className = "",
}: SupportButtonProps) {
  return (
    <aside className={`support-card support-card--${variant} ${className}`.trim()}>
      <div className="support-card-text">
        <strong>Te gusta Once Histórico?</strong>
        <span>Ayuda a mantener y mejorar el proyecto.</span>
      </div>

      <div className="support-actions" aria-label="Opciones de apoyo">
        <a
          className="support-button support-button--kofi"
          href={KOFI_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="Apoyar Once Histórico en Ko-fi"
        >
          <span aria-hidden="true">☕</span>
          <span>Ko-fi</span>
        </a>

        <a
          className="support-button support-button--paypal"
          href={PAYPAL_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="Apoyar Once Histórico en PayPal"
        >
          <span aria-hidden="true">💙</span>
          <span>PayPal.me</span>
        </a>
      </div>
    </aside>
  );
}

export default SupportButton;
