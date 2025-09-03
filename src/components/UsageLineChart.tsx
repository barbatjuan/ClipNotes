import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface UsageLineChartProps {
  jobs: Array<{
    id: string;
    created_at: string;
    audio_duration?: number;
    title?: string;
  }>;
}

export const UsageLineChart: React.FC<UsageLineChartProps> = ({ jobs }) => {
  const [isDark, setIsDark] = React.useState<boolean>(false);

  React.useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains('dark'));
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  // Ordenar por fecha ascendente
  const sortedJobs = [...jobs].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // Series numéricas (evitar strings) para que el relleno funcione correctamente
  const videoData = sortedJobs.map((job) =>
    job.audio_duration ? job.audio_duration / 60 : 0
  );
  const readingData = sortedJobs.map((job) =>
    job.audio_duration ? (job.audio_duration / 60) * 0.25 : 0
  );
  const maxY = Math.max(1, ...videoData, ...readingData);

  const data = {
    labels: sortedJobs.map((job, index) =>
      job.title || `Trabajo ${index + 1}`
    ),
    datasets: [
      {
        label: "Tiempo de video",
        data: videoData,
        borderColor: "#6366f1",
        backgroundColor: (ctx: any) => {
          const chart = ctx.chart;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return "rgba(99,102,241,0.3)"; // fallback on initial render
          const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, "rgba(99,102,241,0.30)");
          gradient.addColorStop(1, "rgba(99,102,241,0.05)");
          return gradient;
        },
        pointBackgroundColor: "#fff",
        pointBorderColor: "#6366f1",
        pointBorderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointHoverBorderWidth: 4,
        borderWidth: 3,
        tension: 0.4,
        fill: 'origin',
        order: 1,
        shadowOffsetX: 0,
        shadowOffsetY: 4,
        shadowBlur: 12,
        shadowColor: "rgba(99,102,241,0.3)",
      },
      {
        label: "Tiempo de lectura",
        data: readingData,
        borderColor: "#10b981",
        backgroundColor: (ctx: any) => {
          const chart = ctx.chart;
          const { ctx: c, chartArea } = chart;
          if (!chartArea) return "rgba(16,185,129,0.3)"; // fallback on initial render
          const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, "rgba(16,185,129,0.30)");
          gradient.addColorStop(1, "rgba(16,185,129,0.05)");
          return gradient;
        },
        pointBackgroundColor: "#fff",
        pointBorderColor: "#10b981",
        pointBorderWidth: 3,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointHoverBorderWidth: 4,
        borderWidth: 3,
        tension: 0.4,
        fill: 'origin',
        order: 2, // ensure green draws above blue
        shadowOffsetX: 0,
        shadowOffsetY: 4,
        shadowBlur: 12,
        shadowColor: "rgba(16,185,129,0.25)",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    animation: {
      duration: 800,
      easing: 'easeOutQuart' as const,
    },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: isDark ? "#cbd5e1" : "#1e293b",
          font: {
            size: 12,
            weight: 'bold' as const,
          },
          padding: 20,
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: "Comparación: Tiempo de Video vs Lectura",
        color: isDark ? "#e2e8f0" : "#1e293b",
        font: {
          size: 18,
          weight: 'bold' as const,
        },
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: isDark ? "#0f172a" : "#ffffff",
        titleColor: isDark ? "#e2e8f0" : "#0f172a",
        bodyColor: isDark ? "#cbd5e1" : "#0f172a",
        borderColor: isDark ? "#334155" : "#e2e8f0",
        borderWidth: 1,
        usePointStyle: true,
        callbacks: {
          label: function (context: any) {
            const datasetLabel = context.dataset.label;
            const y = typeof context.parsed.y === 'number' ? context.parsed.y : Number(context.parsed.y);
            return `${datasetLabel}: ${y.toFixed(1)} min`;
          },
          labelPointStyle: function () {
            return {
              pointStyle: 'circle' as const,
              rotation: 0,
            };
          },
        },
        padding: 12,
        cornerRadius: 8,
      },
    },
    layout: {
      padding: 20,
    },
    scales: {
      y: {
        title: {
          display: true,
          text: "Minutos",
          color: isDark ? "#93c5fd" : "#6366f1",
          font: { size: 14, weight: 'bold' as const },
        },
        beginAtZero: true,
        suggestedMax: maxY * 1.15,
        grid: {
          color: isDark ? "rgba(148,163,184,0.15)" : "#e0e7ff",
          drawBorder: false,
          borderDash: [4, 4],
        },
        ticks: {
          color: isDark ? "#93c5fd" : "#6366f1",
          font: { size: 12 },
          padding: 8,
          callback: (value: any) => {
            const v = typeof value === 'number' ? value : Number(value);
            return v.toFixed(1);
          },
        },
        border: {
          display: false,
        },
      },
      x: {
        title: {
          display: true,
          text: "Trabajos",
          color: isDark ? "#93c5fd" : "#6366f1",
          font: { size: 14, weight: 'bold' as const },
        },
        grid: {
          color: isDark ? "rgba(148,163,184,0.10)" : "#f1f5f9",
          drawBorder: false,
          borderDash: [2, 4],
        },
        ticks: {
          color: isDark ? "#cbd5e1" : "#64748b",
          font: { size: 12 },
          maxRotation: 0,
          minRotation: 0,
          autoSkip: true,
          maxTicksLimit: 6,
          padding: 8,
        },
        border: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="w-full card p-6">
      <div style={{ height: 400 }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
};
