<script setup lang="ts">
import { ref, computed, onMounted, type ComputedRef } from 'vue';
import { generateVersionEvents, type EventItem, INITIAL_START_VERSION, INITIAL_START_DATE, EVENT_OFFSETS } from './utils/events';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(isSameOrAfter);

// --- 响应式数据 ---
const allEvents = ref<EventItem[]>([]); // 存储所有生成的事件

// 标签页控制
const activeTab = ref('future'); // 默认激活 'future' 标签页

// 1. 查看未来事件
const futureYears = ref(1); // 默认未来一年
const futureEvents: ComputedRef<EventItem[]> = computed(() => {
  const today = dayjs().startOf('day');
  const endDate = today.add(futureYears.value, 'year').endOf('day');
  return allEvents.value.filter((event: EventItem) => {
    const eventDate = dayjs(event.date);
    return eventDate.isSameOrAfter(today) && eventDate.isBefore(endDate);
  }).sort((a: EventItem, b: EventItem) => dayjs(a.date).diff(dayjs(b.date)));
});

// 2. 按版本号查询
const inputVersion = ref('');
const versionEvents: ComputedRef<EventItem[]> = computed(() => {
  console.log(inputVersion.value);
  if (!inputVersion.value || !inputVersion.value.includes(".") || inputVersion.value.length < 3) return [];

  return allEvents.value.filter((event: EventItem) => {
    return event.version.startsWith(inputVersion.value)
  }
  ).sort((a: EventItem, b: EventItem) => dayjs(a.date).diff(dayjs(b.date)));
});

// 3. 按日期范围查询
const inputDate = ref(dayjs().format('YYYY-MM-DD')); // 默认为今天
const dateRangeYears = ref(1); // 默认前后一年
const dateRangeEvents: ComputedRef<EventItem[]> = computed(() => {
  if (!inputDate.value) return [];
  const targetDate = dayjs(inputDate.value).startOf('day');
  const startDate = targetDate.subtract(dateRangeYears.value, 'year').startOf('day');
  const endDate = targetDate.add(dateRangeYears.value, 'year').endOf('day');

  return allEvents.value.filter((event: EventItem) => {
    const eventDate = dayjs(event.date);
    return eventDate.isSameOrAfter(startDate) && eventDate.isBefore(endDate);
  }).sort((a: EventItem, b: EventItem) => dayjs(a.date).diff(dayjs(b.date)));
});

// 4. 按事件类型筛选
const eventTypes = computed(() => {
  // 从EVENT_OFFSETS中获取所有事件类型
  return Object.keys(EVENT_OFFSETS);
});
const selectedEventType = ref(''); // 默认不选择任何事件类型
const timeFrameYears = ref(1); // 默认查看未来一年内所选事件类型的事件

const eventTypeEvents: ComputedRef<EventItem[]> = computed(() => {
  if (!selectedEventType.value) return [];

  const today = dayjs().startOf('day');
  const endDate = today.add(timeFrameYears.value, 'year').endOf('day');

  return allEvents.value.filter((event: EventItem) => {
    const eventDate = dayjs(event.date);
    return eventDate.isSameOrAfter(today) &&
      eventDate.isBefore(endDate) &&
      event.event.includes(selectedEventType.value);
  }).sort((a: EventItem, b: EventItem) => dayjs(a.date).diff(dayjs(b.date)));
});

// --- 生命周期钩子 ---
onMounted(() => {
  // 页面加载时，生成足够多的事件数据
  allEvents.value = generateVersionEvents(INITIAL_START_VERSION, INITIAL_START_DATE, 5000); // 生成5000个版本，确保覆盖足够长时间
});

// --- 辅助函数 ---
function setTab(tabName: string) {
  activeTab.value = tabName;
}
</script>

<template>
  <div class="container">
    <h1>StarChrono - 星穹事件簿</h1>

    <div class="tabs">
      <button :class="{ 'active': activeTab === 'future' }" @click="setTab('future')" class="tab-button">
        未来事件
      </button>
      <button :class="{ 'active': activeTab === 'version' }" @click="setTab('version')" class="tab-button">
        按版本
      </button>
      <button :class="{ 'active': activeTab === 'date' }" @click="setTab('date')" class="tab-button">
        按日期范围
      </button>
      <button :class="{ 'active': activeTab === 'eventType' }" @click="setTab('eventType')" class="tab-button">
        按事件类型
      </button>
    </div>

    <div class="tab-content">
      <!-- 未来事件概览 -->
      <section v-if="activeTab === 'future'" class="section">
        <h2>🎉 未来事件概览</h2>
        <div class="controls">
          <label for="futureYears">查看未来: </label>
          <input type="number" id="futureYears" v-model.number="futureYears" min="0" step="1">
          年内的事件
        </div>
        <div v-if="futureEvents.length" class="table-container">
          <table>
            <thead>
              <tr>
                <th>日期</th>
                <th>版本事件</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="event in futureEvents" :key="event.date + event.event">
                <td>{{ event.date }}</td>
                <td>{{ event.event }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else>暂无未来事件数据。</p>
      </section>

      <!-- 按版本号查询 -->
      <section v-if="activeTab === 'version'" class="section">
        <h2>🔍 按版本号查询</h2>
        <div class="controls">
          <label for="inputVersion">输入版本号 (如: 2.0): </label>
          <input type="text" id="inputVersion" v-model="inputVersion" placeholder="例: 2.0">
        </div>
        <div v-if="versionEvents.length" class="table-container">
          <table>
            <thead>
              <tr>
                <th>日期</th>
                <th>版本事件</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="event in versionEvents" :key="event.date + event.event">
                <td>{{ event.date }}</td>
                <td>{{ event.event }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else>请输入版本号或该版本暂无事件。</p>
      </section>

      <!-- 按日期范围查询 -->
      <section v-if="activeTab === 'date'" class="section">
        <h2>🗓️ 按日期范围查询</h2>
        <div class="controls">
          <label for="inputDate">输入中心日期: </label>
          <input type="date" id="inputDate" v-model="inputDate">
          <label for="dateRangeYears">显示前后: </label>
          <input type="number" id="dateRangeYears" v-model.number="dateRangeYears" min="0" step="1">
          年内的事件
        </div>
        <div v-if="dateRangeEvents.length" class="table-container">
          <table>
            <thead>
              <tr>
                <th>日期</th>
                <th>版本事件</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="event in dateRangeEvents" :key="event.date + event.event">
                <td>{{ event.date }}</td>
                <td>{{ event.event }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else>请输入日期和范围，或该日期范围内暂无事件。</p>
      </section>

      <!-- 按事件类型筛选 -->
      <section v-if="activeTab === 'eventType'" class="section">
        <h2>🔖 按事件类型筛选</h2>
        <div class="controls">
          <label for="selectedEventType">选择事件类型: </label>
          <select id="selectedEventType" v-model="selectedEventType">
            <option value="">-- 请选择事件类型 --</option>
            <option v-for="type in eventTypes" :key="type" :value="type">{{ type }}</option>
          </select>
          <label for="timeFrameYears">查看未来: </label>
          <input type="number" id="timeFrameYears" v-model.number="timeFrameYears" min="1" step="1">
          年内的事件
        </div>
        <div v-if="eventTypeEvents.length" class="table-container">
          <table>
            <thead>
              <tr>
                <th>日期</th>
                <th>版本事件</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="event in eventTypeEvents" :key="event.date + event.event">
                <td>{{ event.date }}</td>
                <td>{{ event.event }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else>请选择事件类型或该事件类型暂无未来事件。</p>
      </section>
    </div>
    <div align="center">
      <p>© 2025 <a href="https://github.com/moyanj">MoYanj</a> | <a
          href="https://github.com/moyanj/star-chrono">GitHub</a></p>
    </div>
  </div>
</template>

<style>
/* 基础样式 */
body {
  font-family: "MiSans",
    "Helvetica Neue",
    Helvetica,
    Arial,
    "PingFang SC",
    "Hiragino Sans GB",
    "Heiti SC",
    "Microsoft YaHei",
    "WenQuanYi Micro Hei",
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  margin: 0;
  padding: 10px;
  max-width: 100%;
  overflow-x: hidden;
}

/* 响应式容器 */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
  box-sizing: border-box;
}

h1 {
  text-align: center;
  color: #34495e;
  margin-bottom: 20px;
  font-size: 1.8rem;
}

h2 {
  color: #42b983;
  margin-top: 0;
  border-bottom: 2px solid #42b983;
  padding-bottom: 10px;
  margin-bottom: 20px;
  font-size: 1.5rem;
}

/* 控制面板响应式设计 */
.controls {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

label {
  font-weight: bold;
  color: #555;
  margin-right: 5px;
}

input[type="text"],
input[type="number"],
input[type="date"],
select {
  padding: 10px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
  /* 移动端更友好的字体大小 */
  width: 100%;
  max-width: 180px;
  box-sizing: border-box;
  -webkit-appearance: none;
  /* 移除iOS默认样式 */
}

input[type="number"] {
  width: 80px;
}

/* 表格响应式设计 */
.table-container {
  width: 100%;
  overflow-x: auto;
  /* 允许在小屏幕上水平滚动 */
  -webkit-overflow-scrolling: touch;
  /* 提升iOS滚动体验 */
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;
  min-width: 300px;
  /* 确保表格不会太窄 */
}

th,
td {
  border: 1px solid #ddd;
  padding: 12px 10px;
  text-align: left;
}

th {
  background-color: #f2f2f2;
  font-weight: bold;
  color: #333;
}

tr:nth-child(even) {
  background-color: #f9f9f9;
}

tr:hover {
  background-color: #eef;
}

p {
  color: #666;
  font-style: italic;
}

a {
  color: #42b983;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

/* 标签页响应式设计 */
.tabs {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 10px;
  border-bottom: 2px solid #e0e0e0;
}

.tab-button {
  background-color: #f0f0f0;
  border: 1px solid #e0e0e0;
  border-bottom: none;
  padding: 10px 15px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: bold;
  color: #555;
  border-radius: 8px 8px 0 0;
  transition: background-color 0.3s, color 0.3s, border-color 0.3s;
  margin: 0 2px;
  flex: 1 1 auto;
  text-align: center;
  min-width: 80px;
}

.tab-button:hover {
  background-color: #e0e0e0;
  color: #333;
}

.tab-button.active {
  background-color: #ffffff;
  border-color: #42b983;
  color: #42b983;
  border-bottom: 2px solid #ffffff;
  position: relative;
  z-index: 1;
}

.tab-content {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-top: -2px;
}

/* 移动端优化 */
@media (max-width: 768px) {
  body {
    padding: 5px;
  }

  h1 {
    font-size: 1.5rem;
    margin-bottom: 15px;
  }

  h2 {
    font-size: 1.3rem;
  }


  label {
    font-size: 0.9rem;
  }

  input[type="text"],
  input[type="number"],
  input[type="date"],
  select {
    padding: 8px;
    font-size: 0.9rem;
    max-width: 120px;
  }

  input[type="number"] {
    width: 60px;
  }

  .tab-button {
    padding: 8px 10px;
    font-size: 0.8rem;
    min-width: 60px;
  }

  .tab-content {
    padding: 10px;
  }

  th,
  td {
    padding: 8px 6px;
    font-size: 0.9rem;
  }
}
</style>
