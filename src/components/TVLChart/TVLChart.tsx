import React, { useEffect, useRef } from "react";
import * as echarts from "echarts";

interface RingChartProps {
  data: { tvl: number; timestamp: string }[];
}
const style = { width: "100%", height: "300px" };

const TvlChart: React.FC<RingChartProps> = ({ data }) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartRef.current) {
      const xData: { value: number; date: string; type: boolean }[] = [];
      const yData: string[] = [];

      data.forEach((item, index) => {
        if (index) {
          xData.unshift({ value: item.tvl, date: item.timestamp, type: false });
          const timer = format(item.timestamp, "yLine", false);
          yData.unshift(timer);
        } else {
          xData.unshift({ value: item.tvl, date: item.timestamp, type: true });
          yData.unshift("Now");
        }
      });

      const option = {
        title: {
          text: "zkLink Nova Daily TVL Chart",
          left: "center",
        },
        tooltip: {
          trigger: "axis",
          formatter: (params: any) => {
            const timer = format(params[0].data.date, "tooltip", params[0].data.type || false);
            const yValue = params[0].data.value;
            return timer + "<br />" + "TVL: $ " + yValue.toLocaleString();
          },
        },
        grid: {
          left: "18%",
          right: "10%",
        },
        xAxis: {
          type: "category",
          data: yData,
        },
        yAxis: {
          type: "value",
          axisLabel: {
            formatter: (value: any, index: number) => {
              if (value < 1000) {
                return "$ " + value;
              } else if (value < 1000000) {
                return "$ " + (value / 1000).toFixed(0) + "K";
              } else {
                return "$ " + (value / 1000000).toFixed(0) + "M";
              }
            },
          },
        },
        dataZoom: [
          {
            type: "slider",
            start: 0,
            end: 100,
          },
        ],
        series: [
          {
            type: "line",
            smooth: true,
            data: xData,
            symbol: "none",
            emphasis: {
              focus: "series",
            },
            // onclick: (params: any) => {
            //   console.log(params);
            // },
          },
        ],
      };

      const myChart = echarts.init(chartRef.current);
      // myChart.setOption(option);

      return () => {
        myChart.dispose();
      };
    }
  }, [data]);

  const format = (str: string, type: string, isNow: boolean) => {
    const date = new Date(str);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const hour = hours < 10 ? "0" + hours : hours;
    const minute = minutes < 10 ? "0" + minutes : minutes;
    const second = seconds < 10 ? "0" + seconds : seconds;
    let formattedDate = type === "yLine" ? month + " '" + day : month + " " + day + ", " + year;
    formattedDate = isNow ? formattedDate + "  " + hour + ":" + minute + ":" + second : formattedDate;
    return formattedDate;
  };

  return <div ref={chartRef} style={style} className="chart" />;
};

export default TvlChart;
