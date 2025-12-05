<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="管理标签"
    width="400px"
  >
    <p class="text-sm text-gray-500 mb-3">为笔记添加或移除标签。</p>

    <!-- 现有标签显示 -->
    <div class="mb-4 flex flex-wrap gap-2">
      <el-tag
        v-for="tag in currentTags"
        :key="tag.id || tag.name"
        closable
        :disable-transitions="false"
        @close="handleTagClose(tag)"
        class="cursor-pointer"
        :style="{
          backgroundColor: (typeof tag === 'object' ? tag.color : '#409EFF') + '20',
          color: typeof tag === 'object' ? tag.color : '#409EFF',
          borderColor: typeof tag === 'object' ? tag.color : '#409EFF',
        }"
      >
        <span class="flex items-center gap-1">
          <el-icon><PriceTag /></el-icon>
          {{ typeof tag === 'object' ? tag.name : tag }}
        </span>
      </el-tag>
    </div>

    <!-- 添加新标签 -->
    <div class="flex items-center gap-2 mb-4">
      <el-input
        v-model="newTagInput"
        placeholder="输入新标签"
        class="flex-1"
        @keyup.enter="addTag"
        clearable
      />
      <el-button @click="addTag" type="primary">添加</el-button>
    </div>

    <!-- 预设标签 -->
    <div v-if="presetTags.length > 0" class="mb-4">
      <p class="text-sm text-gray-600 mb-2">预设标签：</p>
      <div class="flex flex-wrap gap-2">
        <el-tag
          v-for="tag in presetTags"
          :key="tag.id || tag.name"
          @click="togglePresetTag(tag)"
          class="cursor-pointer hover:opacity-80 transition-opacity"
          :type="isTagSelected(tag) ? '' : 'info'"
        >
          {{ typeof tag === 'object' ? tag.name : tag }}
        </el-tag>
      </div>
    </div>

    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" @click="handleConfirm">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { PriceTag } from '@element-plus/icons-vue';

const props = defineProps<{
  modelValue: boolean;
  item: any;
}>();

const emit = defineEmits(['update:modelValue', 'confirm']);

// 预设标签（可以根据需要扩展）
const presetTags = ref([
  { id: 1, name: '重要', color: '#ff6b6b' },
  { id: 2, name: '工作', color: '#4ecdc4' },
  { id: 3, name: '学习', color: '#45b7d1' },
  { id: 4, name: '个人', color: '#96ceb4' },
  { id: 5, name: '想法', color: '#feca57' },
]);

// 当前选中的标签
const currentTags = ref<any[]>([]);
// 新标签输入
const newTagInput = ref('');

// 初始化标签
watch(
  () => props.item,
  (newItem) => {
    if (newItem && newItem.tags) {
      if (Array.isArray(newItem.tags)) {
        currentTags.value = [...newItem.tags];
      } else {
        currentTags.value = [];
      }
    } else {
      currentTags.value = [];
    }
  },
  { immediate: true }
);

// 检查标签是否已选择
const isTagSelected = (tag: any) => {
  const tagName = typeof tag === 'object' ? tag.name : tag;
  return currentTags.value.some((t) => (typeof t === 'object' ? t.name : t) === tagName);
};

// 添加标签
const addTag = () => {
  const tagName = newTagInput.value.trim();
  if (!tagName) return;

  // 检查是否已存在
  if (currentTags.value.some((t) => (typeof t === 'object' ? t.name : t) === tagName)) {
    newTagInput.value = '';
    return;
  }

  // 检查是否是预设标签
  const presetTag = presetTags.value.find((t) => t.name === tagName);
  if (presetTag) {
    currentTags.value.push({ ...presetTag });
  } else {
    // 创建新标签
    currentTags.value.push({
      id: Date.now(), // 临时 ID
      name: tagName,
      color: '#909399', // 默认灰色
    });
  }

  newTagInput.value = '';
};

// 移除标签
const handleTagClose = (tag: any) => {
  const tagName = typeof tag === 'object' ? tag.name : tag;
  currentTags.value = currentTags.value.filter(
    (t) => (typeof t === 'object' ? t.name : t) !== tagName
  );
};

// 切换预设标签
const togglePresetTag = (tag: any) => {
  const tagName = typeof tag === 'object' ? tag.name : tag;

  if (isTagSelected(tag)) {
    // 如果已选择，移除
    handleTagClose(tag);
  } else {
    // 如果未选择，添加
    currentTags.value.push({ ...tag });
  }
};

// 确认保存
const handleConfirm = () => {
  // 确保返回对象数组格式
  const tags = currentTags.value.map((tag) => {
    if (typeof tag === 'object') {
      return tag;
    }
    // 如果是字符串，转换为对象
    return {
      id: Date.now(), // 临时 ID
      name: tag,
      color: '#909399',
    };
  });

  emit('confirm', { tags });
  emit('update:modelValue', false);
};
</script>
