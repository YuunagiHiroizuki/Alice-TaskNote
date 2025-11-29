<template>
  <div class="h-full flex flex-col">
    <header
      class="h-16 flex-shrink-0 bg-[var(--alice-card)] border border-[var(--alice-border)] rounded-lg flex items-center justify-between px-6 mx-6 mt-6"
    >
      <h2 class="text-2xl font-semibold text-[var(--alice-text)]">Status</h2>
    </header>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex-1 flex justify-center items-center">
      <div class="text-center">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--alice-primary)] mx-auto"
        ></div>
        <p class="mt-2 text-[var(--alice-text-muted)]">加载数据中...</p>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="flex-1 flex justify-center items-center">
      <div class="text-center text-[var(--alice-text)]">
        <p class="text-lg">数据加载失败</p>
        <p class="text-sm mt-2 text-[var(--alice-text-muted)]">{{ error }}</p>
        <el-button @click="fetchData" type="primary" class="mt-4">重试</el-button>
      </div>
    </div>

    <!-- 主内容 -->
    <div v-else class="flex-1 overflow-y-auto p-6">
      <!-- 主展示面板 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <!-- 今日进度 -->
        <div class="bg-[var(--alice-card)] border border-[var(--alice-border)] rounded-lg p-6">
          <h2 class="text-lg font-semibold text-[var(--alice-text)] mb-4">今日进度</h2>
          <div class="flex items-center justify-center">
            <ProgressRing
              :completed="todayStats.completed"
              :inProgress="todayStats.inProgress"
              :remaining="todayStats.remaining"
              :total="todayStats.total"
              :size="200"
            />
          </div>
          <div class="mt-4 grid grid-cols-3 gap-2 text-center">
            <div class="text-[var(--chart-primary)]">
              <div class="text-2xl font-bold">{{ todayStats.completed }}</div>
              <div class="text-sm text-[var(--alice-text-muted)]">已完成</div>
            </div>
            <div class="text-[var(--chart-secondary)]">
              <div class="text-2xl font-bold">{{ todayStats.inProgress }}</div>
              <div class="text-sm text-[var(--alice-text-muted)]">进行中</div>
            </div>
            <div class="text-[var(--chart-accent)]">
              <div class="text-2xl font-bold">{{ todayStats.remaining }}</div>
              <div class="text-sm text-[var(--alice-text-muted)]">待完成</div>
            </div>
          </div>
        </div>

        <!-- 月度总览 -->
        <div class="bg-[var(--alice-card)] border border-[var(--alice-border)] rounded-lg p-6">
          <h2 class="text-lg font-semibold text-[var(--alice-text)] mb-4">月度总览</h2>
          <AreaChart :data="monthData" />
        </div>
      </div>

      <!-- 可切换面板 -->
      <div class="bg-[var(--alice-card)] border border-[var(--alice-border)] rounded-lg p-6 mb-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold text-[var(--alice-text)]">进度趋势</h2>
          <div class="flex space-x-2">
            <el-button :type="activeView === 'week' ? 'primary' : ''" @click="activeView = 'week'">
              本周
            </el-button>
            <el-button :type="activeView === 'year' ? 'primary' : ''" @click="activeView = 'year'">
              年度
            </el-button>
          </div>
        </div>

        <div v-if="activeView === 'week'">
          <BarChart :data="weekData" />
        </div>
        <div v-else>
          <AreaChart :data="yearData" />
        </div>
      </div>

      <!-- 任务优先级分布 -->
      <div
        v-if="priorityData"
        class="bg-[var(--alice-card)] border border-[var(--alice-border)] rounded-lg p-6"
      >
        <h2 class="text-lg font-semibold text-[var(--alice-text)] mb-4">任务优先级分布</h2>

        <!-- 图例 -->
        <div class="flex justify-center mb-6">
          <div class="flex items-center space-x-6 text-sm">
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 bg-[var(--chart-primary)] rounded-full"></div>
              <span class="text-[var(--alice-text-muted)]">已完成</span>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 bg-[var(--chart-secondary)] rounded-full"></div>
              <span class="text-[var(--alice-text-muted)]">进行中</span>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-3 h-3 bg-[var(--chart-accent)] rounded-full"></div>
              <span class="text-[var(--alice-text-muted)]">待完成</span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div v-for="priority in priorityData" :key="priority.level" class="text-center">
            <ProgressRing
              :completed="priority.completed"
              :inProgress="priority.inProgress"
              :remaining="priority.remaining"
              :total="priority.total"
              :size="150"
            />

            <h3 :class="['mt-2 font-medium', priorityClasses[priority.level]]">
              {{ priorityLabels[priority.level] }}
            </h3>

            <div class="mt-3 space-y-1 text-sm">
              <div class="flex justify-between text-[var(--chart-primary)]">
                <span>已完成:</span>
                <span class="font-medium">{{ priority.completed }}</span>
              </div>
              <div class="flex justify-between text-[var(--chart-secondary)]">
                <span>进行中:</span>
                <span class="font-medium">{{ priority.inProgress }}</span>
              </div>
              <div class="flex justify-between text-[var(--chart-accent)]">
                <span>待完成:</span>
                <span class="font-medium">{{ priority.remaining }}</span>
              </div>
              <div
                class="border-t border-[var(--alice-border)] pt-1 mt-1 flex justify-between text-[var(--alice-text)]"
              >
                <span>总计:</span>
                <span class="font-medium">{{ priority.total }}</span>
              </div>
            </div>

            <div class="mt-2 text-xs text-[var(--alice-text-muted)]">
              完成率: {{ Math.round((priority.completed / priority.total) * 100) }}%
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElButton, ElMessage } from 'element-plus';
import ProgressRing from '../components/ProgressRing.vue';
import BarChart from '../components/BarChart.vue';
import AreaChart from '../components/AreaChart.vue';

// 响应式数据
const loading = ref(true);
const error = ref(null);
const activeView = ref('week');

// 数据结构
const statsData = ref({
  today: {},
  week: [],
  month: [],
  year: [],
  priority: [],
});

// 配置
const priorityLabels = {
  high: '高优先级',
  medium: '中优先级',
  low: '低优先级',
};

const priorityClasses = {
  high: 'text-[var(--alice-primary)]',
  medium: 'text-[var(--chart-secondary)]',
  low: 'text-[var(--chart-accent)]',
};

// 数据获取
const fetchData = async () => {
  try {
    loading.value = true;
    error.value = null;

    const response = await fetch('/api/stats', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    statsData.value = await response.json();
  } catch (err) {
    console.error('获取数据失败:', err);
    error.value = err.message || '未知错误';
    ElMessage.error('数据加载失败');
  } finally {
    loading.value = false;
  }
};

// 模拟数据
const fetchMockData = async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  statsData.value = {
    today: { completed: 8, inProgress: 3, remaining: 2, total: 13 },
    week: [
      { day: '周一', completed: 1, inProgress: 1, remaining: 1 },
      { day: '周二', completed: 2, inProgress: 1, remaining: 0 },
      { day: '周三', completed: 1, inProgress: 1, remaining: 1 },
      { day: '周四', completed: 0, inProgress: 2, remaining: 1 },
      { day: '周五', completed: 3, inProgress: 0, remaining: 1 },
      { day: '周六', completed: 1, inProgress: 1, remaining: 1 },
      { day: '周日', completed: 4, inProgress: 1, remaining: 0 },
    ],
    month: Array.from({ length: 30 }, (_, i) => ({
      label: `${i + 1}日`,
      completed: Math.floor(Math.random() * 5) + 1,
      inProgress: Math.floor(Math.random() * 3) + 1,
      remaining: Math.floor(Math.random() * 4) + 1,
    })),
    year: [
      '1月',
      '2月',
      '3月',
      '4月',
      '5月',
      '6月',
      '7月',
      '8月',
      '9月',
      '10月',
      '11月',
      '12月',
    ].map((month) => ({
      label: month,
      completed: Math.floor(Math.random() * 15) + 5,
      inProgress: Math.floor(Math.random() * 8) + 2,
      remaining: Math.floor(Math.random() * 5) + 1,
    })),
    priority: [
      { level: 'high', completed: 8, inProgress: 3, remaining: 2, total: 13 },
      { level: 'medium', completed: 12, inProgress: 5, remaining: 4, total: 21 },
      { level: 'low', completed: 15, inProgress: 2, remaining: 8, total: 25 },
    ],
  };
};

// 计算属性
const todayStats = computed(() => statsData.value.today);
const weekData = computed(() => statsData.value.week);
const monthData = computed(() => statsData.value.month);
const yearData = computed(() => statsData.value.year);
const priorityData = computed(() => statsData.value.priority);

// 初始化
onMounted(async () => {
  await fetchMockData();
  loading.value = false;
});
</script>

<style scoped>
/* 使用与 TodoView 和 NoteView 一致的样式 */
</style>
