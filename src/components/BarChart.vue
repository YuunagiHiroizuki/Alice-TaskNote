<template>
  <div class="bar-chart">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Chart from 'chart.js/auto';

const canvas = ref(null);
const props = defineProps({
  data: Array,
});

// 图表配置
const colors = {
  completed: '#4CAF50',
  inProgress: '#FF9800',
  remaining: '#B0BEC5',
};

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        usePointStyle: true,
        padding: 15,
      },
    },
    tooltip: {
      mode: 'index',
      intersect: false,
    },
  },
  scales: {
    x: { grid: { display: false } },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(0, 0, 0, 0.1)' },
      ticks: { precision: 0 },
    },
  },
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false,
  },
};

onMounted(() => {
  const ctx = canvas.value?.getContext('2d');
  if (!ctx) {
    console.error('Canvas context not found for BarChart!');
    return;
  }

  // 准备数据
  const labels = props.data.map((item) => item.day);
  const completed = props.data.map((item) => item.completed);
  const inProgress = props.data.map((item) => item.inProgress || 0);
  const remaining = props.data.map((item) => item.remaining);

  // 创建图表
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Completed',
          data: completed,
          backgroundColor: colors.completed,
          borderColor: colors.completed,
          borderWidth: 1,
        },
        {
          label: 'In Progress',
          data: inProgress,
          backgroundColor: colors.inProgress,
          borderColor: colors.inProgress,
          borderWidth: 1,
        },
        {
          label: 'Remaining',
          data: remaining,
          backgroundColor: colors.remaining,
          borderColor: colors.remaining,
          borderWidth: 1,
        },
      ],
    },
    options,
  });
});
</script>

<style scoped>
.bar-chart {
  width: 100%;
  height: 400px;
}
</style>
