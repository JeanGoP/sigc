type Props = {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
};

export default function KpiCard({ title, value, subtitle, color = "#4f86c6" }: Props) {
  return (
    <div className="card h-100" style={{ borderTop: `3px solid ${color}`, borderRadius: 8 }}>
      <div className="card-body" style={{ padding: "10px 14px" }}>
        <div style={{ fontSize: 11, color: "#888", marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>
          {title}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1.2 }}>{value}</div>
        {subtitle && (
          <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{subtitle}</div>
        )}
      </div>
    </div>
  );
}
