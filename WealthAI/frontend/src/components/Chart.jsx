import { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

export default function Chart({ data }) {
  const chartContainerRef = useRef(null);

  useEffect(() => {
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 300,
      layout: { background: { color: 'transparent' }, textColor: '#333' },
      grid: { vertLines: { visible: false }, horzLines: { visible: false } },
    });

    const lineSeries = chart.addAreaSeries();
    lineSeries.setData(data);
    chart.timeScale().fitContent();

    return () => chart.remove(); // Cleanup on component unmount
  }, [data]);

  return <div ref={chartContainerRef} className="w-full h-full" />;
}