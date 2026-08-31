import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

/**
 * EChart — ECharts 封装：初始化、resize、销毁
 * props: option, className, onClick (事件回调)
 */
export default function EChart({ option, className = '', onClick, onEvents = {} }) {
  const ref = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current);
    chartRef.current = chart;

    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(ref.current);

    if (onClick) {
      chart.on('click', onClick);
    }
    for (const [evt, fn] of Object.entries(onEvents)) {
      chart.on(evt, fn);
    }

    return () => {
      ro.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (chartRef.current && option) {
      chartRef.current.setOption(option, true);
    }
  }, [option]);

  return <div ref={ref} className={className} />;
}
