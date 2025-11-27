import React, { useEffect, useState } from "react";

interface GaugeProps {
  valor: number; // 0 – 100
  titulo?: string;
}

export const ScoringVisual: React.FC<GaugeProps> = ({
  valor,
  titulo = "Termómetro de Score",
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setTimeout(() => setProgress(valor), 200);
  }, [valor]);

  const angle = (progress * 180) / 100;

  return (
    <>
      {/* ESTILOS INTERNOS */}
      <style>
        {`
          .gauge-wrapper {
            text-align: center;
            width: 300px;
            margin: auto;
            padding-top: 10px;
          }

          .gauge-title {
            font-size: 18px;
            font-weight: 600;
            color: #444;
            margin-bottom: 10px;
          }

          .gauge-svg {
            width: 100%;
            filter: drop-shadow(0 6px 12px rgba(0,0,0,0.15));
          }

          .gauge-value {
            font-size: 36px;
            font-weight: 700;
            fill: #111;
          }

          .gauge-label {
            font-size: 12px;
            fill: #666;
          }
        `}
      </style>

      {/* GAUGE */}
      <div className="gauge-wrapper">
        <div className="gauge-title">{titulo}</div>

        <svg viewBox="0 0 200 120" className="gauge-svg">
          {/* Fondo gris */}
          <path
            d="M20 110 A80 80 0 0 1 180 110"
            fill="none"
            stroke="#e6e6e6"
            strokeWidth="18"
            strokeLinecap="round"
          />

          {/* Barra de progreso */}
          <path
            d="M20 110 A80 80 0 0 1 180 110"
            fill="none"
            stroke="url(#grad)"
            strokeWidth="18"
            strokeLinecap="round"
            strokeDasharray="250"
            strokeDashoffset={250 - (250 * progress) / 100}
            style={{ transition: "stroke-dashoffset 1.4s ease" }}
          />

          {/* Degradado verde premium */}
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#37e04b" />
              <stop offset="100%" stopColor="#28c53c" />
            </linearGradient>
          </defs>

          {/* Valor */}
          <text x="100" y="90" textAnchor="middle" className="gauge-value">
            {progress}%
          </text>

          {/* Labels 0 - 100 */}
          <text x="20" y="115" className="gauge-label">0</text>
          <text x="180" y="115" className="gauge-label">100</text>
        </svg>
      </div>
    </>
  );
};
