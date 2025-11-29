<template>
  <div class="area-chart">
    <canvas ref="areaChartCanvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Chart from 'chart.js/auto';

const areaChartCanvas = ref(null);
const props = defineProps({
  data: Array,
});

onMounted(() => {
  const ctx = areaChartCanvas.value?.getContext('2d');
  if (ctx) {
    const labels = props.data.map((item) => item.label);
    const completedData = props.data.map((item) => item.completed);
    const inProgressData = props.data.map((item) => item.inProgress);
    const remainingData = props.data.map((item) => item.remaining);

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Remaining',
            data: remainingData,
            fill: {
              target: 'origin',
              above: 'rgba(176, 190, 197, 0.3)',
            },
            backgroundColor: 'rgba(176, 190, 197, 0.3)',
            borderColor: '#B0BEC5',
            tension: 0.4,
            pointBackgroundColor: '#B0BEC5',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
          },
          {
            label: 'In Progress',
            data: inProgressData,
            fill: {
              target: 'origin',
              above: 'rgba(255, 152, 0, 0.3)',
            },
            backgroundColor: 'rgba(255, 152, 0, 0.3)',
            borderColor: '#FF9800',
            tension: 0.4,
            pointBackgroundColor: '#FF9800',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
          },
          {
            label: 'Completed',
            data: completedData,
            fill: {
              target: 'origin',
              above: 'rgba(76, 175, 80, 0.3)',
            },
            backgroundColor: 'rgba(76, 175, 80, 0.3)',
            borderColor: '#4CAF50',
            tension: 0.4,
            pointBackgroundColor: '#4CAF50',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20,
            },
          },
          tooltip: {
            mode: 'index',
            intersect: false,
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)',
            },
            ticks: {
              precision: 0,
            },
          },
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false,
        },
        elements: {
          line: {
            tension: 0.4,
          },
        },
      },
    });
  } else {
    console.error('Canvas context not found for AreaChart!');
  }
});
</script>

<style scoped>
.area-chart {
  width: 100%;
  height: 400px;
  position: relative;
}
</style>
