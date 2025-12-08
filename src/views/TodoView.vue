<template>
  <div class="h-full flex flex-col p-6 overflow-y-auto">
    <header class="h-16 bg-white rounded-lg flex items-center justify-between px-6">
      <h2 class="text-2xl font-semibold">TODOs</h2>
      <div class="flex items-center space-x-2">
        <el-input
          placeholder="搜索..."
          :prefix-icon="Search"
          class="w-60"
          v-model="searchQuery"
          @keyup.enter="handleSearch"
        />
        <el-button
          :icon="Filter"
          @click="toggleFilter"
          :type="isReverseFilter ? 'primary' : 'default'"
        >
          过滤
        </el-button>
        <el-button :icon="Plus" @click="showInput = !showInput">添加</el-button>
      </div>
    </header>
    <transition name="slide-fade">
      <div v-if="showInput" class="mt-4 mb-2">
        <el-input
          v-model="newTaskTitle"
          placeholder="一句话快速创建任务 (例如：下午3点开会) ... 按 Enter 提交"
          size="large"
          @keyup.enter="handleQuickCreate"
        >
          <template #prepend>
            <el-icon><Plus /></el-icon>
          </template>
        </el-input>
        <el-button text class="mt-1" @click="dialogVisible = true"> 或使用手动创建... </el-button>
      </div>
    </transition>
    <h2 class="text-lg font-semibold text-gray-700 mb-3" :class="{ 'mt-8': !showInput }">
      未完成 ({{ pendingTasks.length }})
    </h2>
    <div v-if="pendingTasks.length > 0">
      <ItemCard
        v-for="task in pendingTasks"
        :key="task.id"
        :item="task"
        @toggleStatus="handleToggleStatus"
        @togglePin="handleTogglePin"
        @updatePriority="handleUpdatePriority"
        @delete="handleDeleteTask"
        @openDialog="handleOpenDialog"
      />
    </div>
    <el-empty v-else description="太棒了，全部完成了！" />
    <div class="my-8 border-t border-gray-200"></div>
    <h2 class="text-lg font-semibold text-gray-700 mb-3">已完成 ({{ completedTasks.length }})</h2>
    <div v-if="completedTasks.length > 0">
      <ItemCard
        v-for="task in completedTasks"
        :key="task.id"
        :item="task"
        @toggleStatus="handleToggleStatus"
        @togglePin="handleTogglePin"
        @updatePriority="handleUpdatePriority"
        @delete="handleDeleteTask"
        @openDialog="handleOpenDialog"
      />
    </div>
    <el-empty v-else description="暂无已完成任务" />
  </div>
  <CreateItemDialog v-model="dialogVisible" type="task" @confirm="handleCreateTask" />
  <EditTaskDialog
    v-if="currentEditingItem"
    v-model="isEditDialogOpen"
    :item="currentEditingItem"
    @confirm="handleUpdateTask"
  />
  <ManageTagsDialog
    v-if="currentEditingItem"
    v-model="isTagsDialogOpen"
    :item="currentEditingItem"
    @confirm-tags="handleUpdateTags"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { fetchTasks, createTask, updateTask, deleteTask, searchTasks } from '@/api/task';
import ItemCard from '@/components/ItemCard.vue';
import CreateItemDialog from '@/components/CreateItemDialog.vue';
import { Search, Filter, Plus } from '@element-plus/icons-vue';
import EditTaskDialog from '@/components/EditTaskDialog.vue';
import ManageTagsDialog from '@/components/ManageTagsDialog.vue';
import { type Item, type Tag } from '@/types';

const tasks = ref<Item[]>([]);
const searchQuery = ref('');
const newTaskTitle = ref('');
const dialogVisible = ref(false);
const isEditDialogOpen = ref(false);
const isTagsDialogOpen = ref(false);
const currentEditingItem = ref<Item | null>(null);
const showInput = ref(false);
// 反向过滤状态：true表示过滤掉包含搜索关键词的卡片，false表示正常搜索（显示包含关键词的卡片）
const isReverseFilter = ref(false);
const selectedPriority = ref<string | null>(null);
let searchTimer: ReturnType<typeof setTimeout> | null = null;
const SEARCH_DEBOUNCE_MS = 300;

onActivated(() => {
  loadTasks();
});

const loadTasks = async (query?: string) => {
  try {
    let res;
    if (query && !isReverseFilter.value) {
      // 正向搜索时，向后端发送搜索请求
      res = await searchTasks(query);
    } else {
      // 反向搜索或没有搜索词时，获取所有任务，在前端过滤
      res = await fetchTasks();
    }

    console.log('加载的任务数据:', res);
    if (res.length > 0) {
      console.log('第一个任务的标签:', res[0].tags);
      console.log('标签类型:', typeof res[0].tags);
    }

    // 确保任务的tags属性被正确初始化
    tasks.value = (res as Item[]).map((item) => ({
      ...item,
      tags: item.tags || [],
    }));
  } catch (error) {
    ElMessage.error('加载任务失败，请刷新重试');
  }
};

const priorityWeight = {
  high: 4,
  medium: 3,
  low: 2,
  none: 1,
};

// 修改：排序函数 - 优先按置顶，然后按优先级，最后按更新时间
const sortTasks = (tasks: Item[]) => {
  return [...tasks].sort((a, b) => {
    // 1. 先按置顶排序（置顶的在前）
    if (a.isPinned !== b.isPinned) {
      return b.isPinned ? 1 : -1;
    }

    // 2. 按优先级权重排序（权重高的在前）
    const aPriorityWeight = priorityWeight[a.priority as keyof typeof priorityWeight] || 1;
    const bPriorityWeight = priorityWeight[b.priority as keyof typeof priorityWeight] || 1;
    if (aPriorityWeight !== bPriorityWeight) {
      return bPriorityWeight - aPriorityWeight;
    }

    // 3. 按更新时间排序（最新的在前）
    const aTime = new Date(a.updatedAt || a.updated_at || a.createdAt || a.created_at).getTime();
    const bTime = new Date(b.updatedAt || b.updated_at || b.createdAt || b.created_at).getTime();
    return bTime - aTime;
  });
};

// 修改：添加搜索和优先级筛选，以及反向过滤逻辑
const filteredTasks = computed(() => {
  let filtered = tasks.value;

  // 优先级筛选
  if (selectedPriority.value) {
    filtered = filtered.filter((task) => task.priority === selectedPriority.value);
  }

  // 搜索筛选
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();

    if (isReverseFilter.value) {
      // 反向过滤：只显示不包含搜索关键词的卡片
      filtered = filtered.filter(
        (task) =>
          !task.title.toLowerCase().includes(query) &&
          !task.content.toLowerCase().includes(query) &&
          !(task.tags && task.tags.some((tag) => tag.name.toLowerCase().includes(query)))
      );
    } else {
      // 正向过滤：正常搜索，显示包含搜索关键词的卡片
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.content.toLowerCase().includes(query) ||
          (task.tags && task.tags.some((tag) => tag.name.toLowerCase().includes(query)))
      );
    }
  }

  return filtered;
});

// 修改：应用排序和筛选
const pendingTasks = computed(() => {
  const pending = filteredTasks.value.filter((t) => t.status !== 'done');
  return sortTasks(pending);
});

const completedTasks = computed(() => {
  const completed = filteredTasks.value.filter((t) => t.status === 'done');
  return sortTasks(completed);
});

// 新增：带筛选的统计
const filteredPendingTasks = computed(() => pendingTasks.value);
const filteredCompletedTasks = computed(() => completedTasks.value);

const handleQuickCreate = async () => {
  if (!newTaskTitle.value.trim()) return;
  try {
    // 调用后端创建任务接口
    await createTask({
      type: 'task',
      title: newTaskTitle.value,
      content: '',
      status: 'todo',
      priority: 'none',
      tags: [], // 对齐后端 tags 字段（空数组避免 undefined）
    });
    newTaskTitle.value = '';
    ElMessage.success('快速创建成功');
    loadTasks(); // 刷新任务列表
  } catch (error) {
    ElMessage.error('快速创建失败，请重试');
    console.error('快速创建任务错误：', error);
  }
};

const handleCreateTask = async (data: {
  title: string;
  content: string;
  deadline: string;
  priority: 'high' | 'medium' | 'low';
}) => {
  try {
    await createTask({
      type: 'task',
      title: data.title,
      content: data.content,
      status: 'todo',
      // 直接传 '2023-12-05' 给后端
      deadline: data.deadline || undefined,
      priority: data.priority,
      tags: [],
    });
    ElMessage.success('任务创建成功');
    dialogVisible.value = false;
    loadTasks();
  } catch (error) {
    ElMessage.error('创建任务失败，请重试');
    console.error('详细创建任务错误：', error);
  }
};

const handleToggleStatus = async (id: number) => {
  const task = tasks.value.find((t) => t.id === id);
  if (!task) return;

  const newStatus = task.status === 'done' ? 'todo' : 'done';
  try {
    task.status = newStatus;

    await updateTask(id, { status: newStatus });

    ElMessage.success(newStatus === 'done' ? '任务已完成' : '任务已重启');
  } catch (error) {
    task.status = newStatus === 'done' ? 'todo' : 'done';
    ElMessage.error('更新状态失败');
    console.error(error);
  }
};

const handleTogglePin = async (item: Item) => {
  const newPinState = !item.isPinned;
  try {
    // 乐观更新
    const task = tasks.value.find((t) => t.id === item.id);
    if (task) task.isPinned = newPinState;

    await updateTask(item.id, { isPinned: newPinState });
    ElMessage.success(newPinState ? '已置顶' : '已取消置顶');
    // loadTasks(); // 可选：刷新列表以确保排序正确
  } catch (error) {
    const task = tasks.value.find((t) => t.id === item.id);
    if (task) task.isPinned = !newPinState; // 回滚
    ElMessage.error('操作失败');
  }
};

const handleUpdatePriority = async (id: number, priority: 'high' | 'medium' | 'low' | 'none') => {
  try {
    const task = tasks.value.find((t) => t.id === id);
    if (task) task.priority = priority; // 乐观更新

    await updateTask(id, { priority });
    ElMessage.success('优先级已更新');
  } catch (error) {
    ElMessage.error('优先级更新失败');
    loadTasks(); // 失败则刷新回原状
  }
};

// 👇 替换：删除任务（对接后端接口）
const handleDeleteTask = async (id: number) => {
  try {
    // 调用后端删除任务接口
    await deleteTask(id);
    ElMessage.success('删除成功');
    loadTasks(); // 刷新任务列表
  } catch (error) {
    ElMessage.error('删除失败，请重试');
    console.error('删除任务错误：', error);
  }
};

const handleOpenDialog = (command: 'edit' | 'setTags' | 'setDate', item: Item) => {
  console.log(`打开对话框: ${command}, 任务ID: ${item.id}`);
  currentEditingItem.value = item;
  if (command === 'edit' || command === 'setDate') {
    isEditDialogOpen.value = true;
  } else if (command === 'setTags') {
    isTagsDialogOpen.value = true;
  }
};

const handleUpdateTask = async (updatedData: Partial<Item>) => {
  if (!currentEditingItem.value) return;

  const payload: any = {};

  // 处理其他字段
  if (updatedData.title !== undefined) payload.title = updatedData.title;
  if (updatedData.content !== undefined) payload.content = updatedData.content;
  if (updatedData.deadline !== undefined) payload.deadline = updatedData.deadline;
  if (updatedData.priority !== undefined) payload.priority = updatedData.priority;
  if (updatedData.status !== undefined) payload.status = updatedData.status;

  console.log('编辑任务，提交给后端的payload:', payload);

  try {
    await updateTask(currentEditingItem.value.id, payload);
    ElMessage.success('任务更新成功');
    isEditDialogOpen.value = false;
    currentEditingItem.value = null;
    loadTasks(); // 重新加载任务列表
  } catch (error) {
    ElMessage.error('更新失败，请重试');
    console.error('更新任务错误:', error);
  }
};

const handleSearch = () => {
  const query = searchQuery.value.trim();
  if (query) {
    // 如果启用了反向过滤，不要向后端发送搜索请求
    if (isReverseFilter.value) {
      // 反向过滤在前端处理，只需刷新任务列表（获取所有任务）
      loadTasks();
    } else {
      // 正向搜索，向后端发送搜索请求
      loadTasks(query);
    }
  } else {
    // 搜索框为空时，重置过滤状态并加载所有任务
    isReverseFilter.value = false;
    loadTasks();
  }
};

// 监听搜索框变化，实现自动搜索
watch(searchQuery, (newValue) => {
  if (searchTimer) {
    clearTimeout(searchTimer);
  }

  searchTimer = setTimeout(() => {
    handleSearch();
  }, SEARCH_DEBOUNCE_MS);
});

const toggleFilter = () => {
  if (searchQuery.value.trim()) {
    // 有搜索词时，切换反向过滤状态
    isReverseFilter.value = !isReverseFilter.value;

    // 立即应用新的过滤规则
    if (isReverseFilter.value) {
      // 切换到反向过滤：重新加载所有任务，在前端过滤
      loadTasks();
    } else {
      // 切换到正向过滤：向后端发送搜索请求
      loadTasks(searchQuery.value.trim());
    }
  } else {
    // 没有搜索词时，提示用户
    ElMessage.warning('请先在搜索框中输入关键词');
  }
};

// 在 TodoView.vue 中添加
const handleUpdateTags = async (tags: Tag[]) => {
  if (!currentEditingItem.value) {
    console.error('没有当前编辑的任务！');
    return;
  }

  try {
    // 提取标签 ID 数组
    const tagIds = tags.map((tag) => tag.id).filter((id) => id !== null && id !== undefined);

    console.log('更新标签，标签ID数组:', tagIds);

    // 调用更新任务接口，只更新 tags 字段
    await updateTask(currentEditingItem.value.id, {
      tags: tagIds,
    });

    ElMessage.success('标签更新成功');
    isTagsDialogOpen.value = false;
    loadTasks(); // 重新加载任务列表
  } catch (error) {
    ElMessage.error('标签更新失败');
    console.error('更新标签错误:', error);
  }
};

onMounted(() => loadTasks());
</script>

<style scoped>
.slide-fade-enter-active {
  transition: all 0.25s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
.mt-big {
  margin-top: 32px;
}
</style>
