<template>
  <div class="progress-ring">
    <canvas ref="canvas" :width="size" :height="size" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Chart from 'chart.js/auto';

const canvas = ref(null);
const props = defineProps({
  completed: Number,
  inProgress: Number,
  remaining: Number,
  total: Number,
  size: { type: Number, default: 150 },
});

// 图表配置
const colors = ['#4CAF50', '#FF9800', '#B0BEC5'];
const options = {
  responsive: false,
  maintainAspectRatio: true,
  circumference: 360,
  rotation: -90,
  cutout: '70%',
  plugins: { tooltip: false, legend: false },
};

onMounted(() => {
  const ctx = canvas.value?.getContext('2d');
  if (!ctx || props.total <= 0) return;

  // 计算百分比
  let completed = (props.completed / props.total) * 100 || 0;
  let inProgress = (props.inProgress / props.total) * 100 || 0;
  let remaining = (props.remaining / props.total) * 100 || 0;

  // 修正百分比总和
  const total = completed + inProgress + remaining;
  if (Math.abs(total - 100) > 0.1) {
    const factor = 100 / total;
    completed *= factor;
    inProgress *= factor;
    remaining *= factor;
  }

  // 创建图表
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      datasets: [
        {
          data: [completed, inProgress, remaining],
          backgroundColor: colors,
          borderWidth: 0,
        },
      ],
    },
    options,
  });
});
</script>

<style scoped>
.progress-ring {
  width: v-bind('size + "px"');
  height: v-bind('size + "px"');
  display: inline-block;
}

.progress-ring canvas {
  display: block;
}
</style>
