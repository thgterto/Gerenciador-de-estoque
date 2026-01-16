
import { useState, useEffect, MutableRefObject } from 'react';

export const useECharts = (chartRef: MutableRefObject<HTMLDivElement | null>) => {
    const [chartInstance, setChartInstance] = useState<any>(null);

    useEffect(() => {
        let instance: any = null;
        let resizeObserver: ResizeObserver | null = null;

        const initChart = () => {
            if (chartRef.current && (window as any).echarts) {
                instance = (window as any).echarts.getInstanceByDom(chartRef.current);
                if (!instance) {
                    instance = (window as any).echarts.init(chartRef.current);
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
    }, []);

    return chartInstance;
};
