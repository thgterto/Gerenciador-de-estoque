
import { useState, useEffect, MutableRefObject } from 'react';
import type { ECharts } from 'echarts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EChartsGlobal = any; // Quick escape for window.echarts since its full type isn't necessarily available globally

export const useECharts = (chartRef: MutableRefObject<HTMLDivElement | null>) => {
    const [chartInstance, setChartInstance] = useState<ECharts | null>(null);

    useEffect(() => {
        let instance: ECharts | null = null;
        let resizeObserver: ResizeObserver | null = null;

        const initChart = () => {
            const globalEcharts = (window as unknown as { echarts: EChartsGlobal }).echarts;
            if (chartRef.current && globalEcharts) {
                instance = globalEcharts.getInstanceByDom(chartRef.current);
                if (!instance) {
                    instance = globalEcharts.init(chartRef.current);
                }
                setChartInstance(instance);
                
                resizeObserver = new ResizeObserver(() => {
                    instance.resize();
                });
                resizeObserver.observe(chartRef.current);
            }
        };

        // Small delay to ensure DOM is ready and layout is stable
        const timer = setTimeout(initChart, 100);

        return () => {
            clearTimeout(timer);
            if (resizeObserver) resizeObserver.disconnect();
            if (instance) instance.dispose();
        };
    }, [chartRef]); // Added chartRef to dependencies as requested

    return chartInstance;
};
