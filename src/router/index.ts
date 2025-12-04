import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import TodoView from '@/views/TodoView.vue';
import NoteView from '@/views/NoteView.vue';
import Stats from '@/views/Stats.vue';
import TagsView from '../views/TagsView.vue';
import PlaceholderView from '@/views/PlaceholderView.vue';
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Root',
    redirect: '/notes',
  },
  {
    path: '/notes',
    name: 'Notes',
    component: NoteView,
  },
  {
    path: '/todos',
    name: 'TODOs',
    component: TodoView,
  },
  {
    path: '/stats',
    name: 'Stats',
    component: Stats,
  },
  {
    path: '/tags',
    name: 'Tags',
    component: TagsView,
  },
  {
    path: '/settings',
    name: 'Settings',
    component: PlaceholderView,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
