<script setup lang="ts">
import { ref, computed, onMounted, type ComputedRef, type Ref } from 'vue';
import { generateVersionEvents, type EventItem, INITIAL_START_VERSION, INITIAL_START_DATE, EVENT_OFFSETS } from './utils/events';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import html2canvas from 'html2canvas';

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
    allEvents.value = generateVersionEvents(INITIAL_START_VERSION, INITIAL_START_DATE, 5026);
});

// --- 辅助函数 ---
function setTab(tabName: string) {
    activeTab.value = tabName;
}

// --- 图片导出功能 ---
const isExporting = ref(false);
const futureTableRef = ref<HTMLElement | null>(null);
const versionTableRef = ref<HTMLElement | null>(null);
const dateTableRef = ref<HTMLElement | null>(null);
const eventTypeTableRef = ref<HTMLElement | null>(null);

async function exportToImage(element: HTMLElement | null, filenamePrefix: string) {
    console.log('导出图片');
    if (!element || isExporting.value) return;
    isExporting.value = true;
    try {
        html2canvas(element, {
            backgroundColor: '#ffffff', // 设置背景色以防透明
            scale: 2, // 提高清晰度
            useCORS: true, // 允许跨域
        }).then(canvas => {
            console.log('导出图片完成');
            const link = document.createElement('a');
            const timestamp = dayjs().format('YYYYMMDD-HHmmss');
            link.href = canvas.toDataURL('image/png');
            link.download = `${filenamePrefix}_${timestamp}.png`;
            link.click();
        });

    } catch (error) {
        console.error('导出图片失败:', error);
        alert('导出图片失败，请查看控制台获取更多信息。');
    } finally {
        isExporting.value = false;
    }
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
                按日期
            </button>
            <button :class="{ 'active': activeTab === 'eventType' }" @click="setTab('eventType')" class="tab-button">
                按事件
            </button>
        </div>

        <div class="tab-content">
            <!-- 未来事件概览 -->
            <section v-show="activeTab === 'future'" class="section">
                <div class="section-header">
                    <h2>🎉 未来事件概览</h2>
                    <button @click="exportToImage(futureTableRef, '未来事件')" v-if="futureEvents.length"
                        :disabled="isExporting" class="export-button">
                        {{ isExporting ? '正在导出...' : '导出为图片' }}
                    </button>
                </div>
                <div class="controls">
                    <label for="futureYears">查看未来: </label>
                    <input type="number" id="futureYears" v-model.number="futureYears" min="0" step="1">
                    年内的事件
                </div>
                <div v-if="futureEvents.length" class="table-container" ref="futureTableRef">
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
            <section v-show="activeTab === 'version'" class="section">
                <div class="section-header">
                    <h2>🔍 按版本号查询</h2>
                    <button @click="exportToImage(versionTableRef, `版本_${inputVersion}`)" v-if="versionEvents.length"
                        :disabled="isExporting" class="export-button">
                        {{ isExporting ? '正在导出...' : '导出为图片' }}
                    </button>
                </div>
                <div class="controls">
                    <label for="inputVersion">输入版本号 (如: 2.0): </label>
                    <input type="text" id="inputVersion" v-model="inputVersion" placeholder="例: 2.0">
                </div>
                <div v-if="versionEvents.length" class="table-container" ref="versionTableRef">
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
            <section v-show="activeTab === 'date'" class="section">
                <div class="section-header">
                    <h2>🗓️ 按日期范围查询</h2>
                    <button @click="exportToImage(dateTableRef, `日期范围_${inputDate}`)" v-if="dateRangeEvents.length"
                        :disabled="isExporting" class="export-button">
                        {{ isExporting ? '正在导出...' : '导出为图片' }}
                    </button>
                </div>
                <div class="controls">
                    <label for="inputDate">输入中心日期: </label>
                    <input type="date" id="inputDate" v-model="inputDate">
                    <label for="dateRangeYears">显示前后: </label>
                    <input type="number" id="dateRangeYears" v-model.number="dateRangeYears" min="0" step="1">
                    年内的事件
                </div>
                <div v-if="dateRangeEvents.length" class="table-container" ref="dateTableRef">
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
            <section v-show="activeTab === 'eventType'" class="section">
                <div class="section-header">
                    <h2>🔖 按事件类型筛选</h2>
                    <button @click="exportToImage(eventTypeTableRef, `事件类型_${selectedEventType}`)"
                        v-if="eventTypeEvents.length" :disabled="isExporting" class="export-button">
                        {{ isExporting ? '正在导出...' : '导出为图片' }}
                    </button>
                </div>
                <div class="controls">
                    <label for="selectedEventType">选择事件类型: </label>
                    <select id="selectedEventType" v-model="selectedEventType">
                        <option value="">请选择</option>
                        <option v-for="type in eventTypes" :key="type" :value="type">{{ type }}</option>
                    </select>
                    <label for="timeFrameYears">查看未来: </label>
                    <input type="number" id="timeFrameYears" v-model.number="timeFrameYears" min="1" step="1">
                    年内的事件
                </div>
                <div v-if="eventTypeEvents.length" class="table-container" ref="eventTypeTableRef">
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
/* 优化滚动条样式 - 不占用空间 */
::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

::-webkit-scrollbar-track {
    background: transparent;
}

::-webkit-scrollbar-thumb {
    z-index: 10;
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background-color: rgba(0, 0, 0, 0.3);
}

html {
    overflow-y: overlay;
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
    margin-left: calc(-1 * (100vw - 100%));
    scrollbar-gutter: stable;
}

body {
    overflow-x: hidden;
}

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
    padding-bottom: 10px;
    margin-bottom: 0;
    /* 调整h2的margin */
    font-size: 1.5rem;
}

/* 新增: Section 头部样式 */
.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    border-bottom: 2px solid #42b983;
}

/* 新增: 导出按钮样式 */
.export-button {
    background-color: #42b983;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: bold;
    transition: background-color 0.3s, opacity 0.3s;
}

.export-button:hover {
    background-color: #36a476;
}

.export-button:disabled {
    background-color: #a5d6c4;
    cursor: not-allowed;
    opacity: 0.7;
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
    width: 100%;
    max-width: 180px;
    box-sizing: border-box;
}

input[type="number"] {
    width: 50px;
}

/* 表格响应式设计 */
.table-container {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 15px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    overflow: hidden;
    min-width: 200px;
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
    gap: 2px;
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
    transition: background-color 0.3s, color 0.3s;
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
        font-size: 1.2rem;
        /* 调整标题大小以适应按钮 */
    }

    .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
    }

    .export-button {
        padding: 6px 12px;
        font-size: 0.8rem;
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

/* 表格行的淡入动画 */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(5px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

tbody tr {
    animation: fadeIn 0.5s ease-in-out;
    animation-fill-mode: both;
}

/* 为表格行设置级联延迟 */
tbody tr:nth-child(1) {
    animation-delay: 0.05s;
}

tbody tr:nth-child(2) {
    animation-delay: 0.1s;
}

tbody tr:nth-child(3) {
    animation-delay: 0.15s;
}

tbody tr:nth-child(4) {
    animation-delay: 0.2s;
}

tbody tr:nth-child(5) {
    animation-delay: 0.25s;
}

tbody tr:nth-child(n+6) {
    animation-delay: 0.3s;
}

/* 标签页切换的平滑过渡动画 */
.section {
    animation: fadeSection 0.4s ease-out;
}

@keyframes fadeSection {
    from {
        opacity: 0;
        transform: translateX(10px);
    }

    to {
        opacity: 1;
        transform: translateX(0);
    }
}
</style>
