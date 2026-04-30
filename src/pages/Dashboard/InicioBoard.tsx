import { useEffect, useState } from "react";
import { useAppSelector } from "@app/store/store";

const CSS = `
@keyframes gradientShift {
  0%   { background-position: 0% 50%;   }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%;   }
}
@keyframes floatA {
  0%, 100% { transform: translateY(0px);   }
  50%      { transform: translateY(-14px); }
}
@keyframes floatB {
  0%, 100% { transform: translateY(0px);   }
  50%      { transform: translateY(-9px);  }
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0);    }
}
`;

export default function InicioBoard() {
  const user = useAppSelector((state) => state.auth.currentUser);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const hour = now.getHours();
  const saludo =
    hour < 12 ? "Buenos dias" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const fecha = now.toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <style>{CSS}</style>

      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 12,
          background:
            "linear-gradient(135deg, #3a70b5, #1e4d8c, #14305e, #3a70b5)",
          backgroundSize: "300% 300%",
          animation: "gradientShift 10s ease infinite",
          padding: "52px 48px 48px",
          color: "#fff",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -60,
            right: -30,
            width: 260,
            height: 260,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.06)",
            animation: "floatA 7s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -90,
            left: 40,
            width: 340,
            height: 340,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
            animation: "floatB 11s ease-in-out infinite 1s",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 20,
            left: -50,
            width: 160,
            height: 160,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
            animation: "floatA 9s ease-in-out infinite 3.5s",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <p
            style={{
              margin: "0 0 10px",
              fontSize: 14,
              opacity: 0.6,
              animation: "fadeIn 0.5s ease both",
            }}
          >
            {saludo}
          </p>

          <h2
            style={{
              margin: "0 0 18px",
              fontSize: 34,
              fontWeight: 700,
              lineHeight: 1.2,
              animation: "fadeIn 0.5s ease 0.1s both",
            }}
          >
            {user?.fullName ?? "Bienvenido"}
          </h2>

          <p
            style={{
              margin: 0,
              fontSize: 13,
              opacity: 0.5,
              animation: "fadeIn 0.5s ease 0.2s both",
              textTransform: "capitalize",
            }}
          >
            <i className="far fa-calendar-alt" style={{ marginRight: 7 }} />
            {fecha}
          </p>
        </div>
      </div>

      <p
        style={{
          marginTop: 20,
          fontSize: 13,
          color: "#aab4c0",
          paddingLeft: 4,
          animation: "fadeIn 0.5s ease 0.3s both",
        }}
      >
        Selecciona una pestana para comenzar.
      </p>
    </>
  );
}
