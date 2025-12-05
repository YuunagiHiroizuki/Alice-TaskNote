<template>
  <div class="h-full flex flex-col p-6 overflow-hidden relative">
    <div v-show="!drawerVisible" class="h-full flex flex-col overflow-y-auto">
      <header class="h-16 bg-white rounded-lg flex items-center justify-between px-6 mb-8 shrink-0">
        <h2 class="text-2xl font-semibold">Notes</h2>
        <div class="flex items-center space-x-2">
          <el-input placeholder="搜索..." :prefix-icon="Search" class="w-60" />
          <el-button :icon="Plus" type="primary" @click="handleCreateNote"> 新建 </el-button>
        </div>
      </header>

      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pb-4"
      >
        <ItemCard
          v-for="note in notes"
          :key="note.id"
          :item="note"
          @openDialog="
            (command, item) => {
              if (command === 'edit') {
                handleViewNote(item.id);
              } else if (command === 'setTags') {
                handleSetTags(item);
              }
            }
          "
          @delete="handleDeleteNote"
          @togglePin="handleTogglePin"
        />
      </div>
      <el-empty v-if="notes.length === 0" description="暂无笔记" />
    </div>

    <transition name="el-fade-in-linear">
      <div
        v-if="drawerVisible"
        class="absolute inset-0 z-50 bg-white flex flex-col shadow-lg overflow-hidden border border-gray-200"
      >
        <div class="h-14 flex items-center justify-between px-4 border-b border-gray-200 shrink-0">
          <div class="flex items-center flex-1 mr-4">
            <input
              v-model="editTitle"
              class="bg-transparent text-lg font-bold text-gray-800 placeholder-gray-400 focus:outline-none w-full"
              placeholder="请输入标题..."
            />
          </div>
          <div class="flex items-center space-x-3">
            <span class="text-xs text-gray-400" v-if="isUnsaved">未保存</span>
            <el-button @click="handleSave" type="primary" size="small">保存</el-button>
            <el-button circle :icon="Close" size="small" @click="handleCloseEditor" />
          </div>
        </div>

        <div class="flex-1 flex overflow-hidden">
          <div class="w-1/2 h-full border-r border-gray-200 flex flex-col">
            <textarea
              v-model="editContent"
              class="w-full h-full p-6 resize-none focus:outline-none text-gray-700 leading-relaxed font-mono text-sm"
              placeholder="在此输入 Markdown 内容..."
            ></textarea>
          </div>

          <div class="w-1/2 h-full bg-white overflow-y-auto px-8 pb-8 pt-0">
            <div class="prose prose-slate max-w-none" v-html="renderMarkdown(editContent)"></div>
          </div>
        </div>
      </div>
    </transition>
  </div>

  <ManageTagsDialog
    v-if="currentEditingNote"
    v-model="isTagsDialogOpen"
    :item="currentEditingNote"
    @confirm="handleUpdateNoteTags"
  />
</template>

<script setup lang="ts">
import ManageTagsDialog from '@/components/ManageTagsDialog.vue';
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
// 假设 mockData 导出了这些函数
import { getItems, createItem, updateItem, deleteItem, getItemById } from '@/store/mockData';
import ItemCard from '@/components/ItemCard.vue';
import { Search, Plus, Close } from '@element-plus/icons-vue';
import { marked } from 'marked';

const notesRef = getItems('note');

const notes = computed(() =>
  notesRef.value.slice().sort((a, b) => Number(b.isPinned) - Number(a.isPinned))
);

// 状态管理
const drawerVisible = ref(false);
const currentNoteId = ref<number | null>(null);
const editTitle = ref('');
const editContent = ref('');
const isUnsaved = ref(false);

// 获取当前笔记数据的引用
const currentNote = computed(() => {
  if (currentNoteId.value === null) return null;
  const itemRef = getItemById(currentNoteId.value);
  // 确保找到了笔记对象 (itemRef.value 才是实际对象)
  return itemRef.value ? itemRef.value : null;
});

// 监听输入，判断是否需要保存
watch([editTitle, editContent], ([newTitle, newContent]) => {
  if (currentNote.value) {
    const originalTitle = currentNote.value.title;
    const originalContent = currentNote.value.content;
    if (newTitle !== originalTitle || newContent !== originalContent) {
      isUnsaved.value = true;
    } else {
      isUnsaved.value = false;
    }
  }
});

// 渲染 Markdown
const renderMarkdown = (md: string) => {
  return md ? marked.parse(md) : '<p class="text-gray-400 italic">空内容...</p>';
};

// 打开笔记（查看/编辑）
const handleViewNote = (id: number) => {
  const targetNote = getItemById(id).value;
  if (targetNote) {
    // 关键：如果找到了笔记，就打开
    currentNoteId.value = id;
    editTitle.value = targetNote.title;
    editContent.value = targetNote.content;
    isUnsaved.value = false;
    drawerVisible.value = true;
  } else {
    // 如果点卡片打不开，这里会提示错误
    ElMessage.error('无法找到该笔记，可能数据已损坏或丢失。');
  }
};

// 关闭编辑器
const handleCloseEditor = () => {
  const close = () => {
    drawerVisible.value = false;
    currentNoteId.value = null;
  };

  if (isUnsaved.value) {
    ElMessageBox.confirm('有未保存的更改，确定要关闭吗？更改将丢失。', '提示', {
      confirmButtonText: '强制关闭',
      cancelButtonText: '取消',
      type: 'warning',
    })
      .then(() => {
        close();
      })
      .catch(() => {});
  } else {
    close();
  }
};

// 新建笔记
const handleCreateNote = async () => {
  const newNoteData = {
    type: 'note' as const,
    title: '未命名笔记',
    content: '',
    tags: [] as string[],
    priority: 'medium' as const,
    status: 'done' as const,
    // created_at 可以不传，mockData 会自动加
    isPinned: false,
  };

  const created = createItem(newNoteData as Partial<typeof newNoteData>);

  currentNoteId.value = created.id;
  editTitle.value = created.title;
  editContent.value = created.content;

  drawerVisible.value = true;
  isUnsaved.value = false;

  await nextTick();
};

// 保存逻辑
const handleSave = () => {
  if (currentNoteId.value) {
    const titleToSave = editTitle.value.trim() || '未命名笔记';
    const updatedData = {
      title: titleToSave,
      content: editContent.value,
    };

    updateItem(currentNoteId.value, updatedData);

    if (editTitle.value !== titleToSave) {
      editTitle.value = titleToSave;
    }

    ElMessage.success('保存成功');
    isUnsaved.value = false;
  }
};

// 删除逻辑
const handleDeleteNote = (id: number) => {
  ElMessageBox.confirm('确定删除该笔记吗？', '警告', { type: 'warning' })
    .then(() => {
      if (currentNoteId.value === id) {
        drawerVisible.value = false;
        currentNoteId.value = null;
      }
      deleteItem(id);
      ElMessage.success('删除成功');
    })
    .catch(() => {});
};

// 置顶逻辑
const handleTogglePin = (id: number) => {
  const item = getItemById(id).value;
  if (!item) return;
  updateItem(id, { isPinned: !item.isPinned });
};

const isTagsDialogOpen = ref(false);
const currentEditingNote = ref<(typeof notesRef.value)[0] | null>(null);
// 打开管理标签对话框
const handleSetTags = (note: (typeof notesRef.value)[0]) => {
  currentEditingNote.value = note;
  isTagsDialogOpen.value = true;
};

const handleUpdateNoteTags = (updatedData: Partial<(typeof notesRef.value)[0]>) => {
  if (currentEditingNote.value) {
    // 只更新 tags
    updateItem(currentEditingNote.value.id, { tags: updatedData.tags });
    currentEditingNote.value = null;
    isTagsDialogOpen.value = false;
    ElMessage.success('标签更新成功');
  }
};
</script>

<style scoped>
/* 定义滚动条样式，让编辑器和预览区看起来更精致 */
textarea::-webkit-scrollbar,
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}
textarea::-webkit-scrollbar-track,
.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}
textarea::-webkit-scrollbar-thumb,
.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: #e5e7eb;
  border-radius: 3px;
}
textarea::-webkit-scrollbar-thumb:hover,
.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background-color: #d1d5db;
}
</style>
