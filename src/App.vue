<script setup lang="ts">
import { ref, computed, onMounted, type ComputedRef, type Ref, nextTick, watch } from 'vue';
import { generateVersionEvents, type EventItem, INITIAL_START_VERSION, INITIAL_START_DATE, EVENT_OFFSETS } from './utils/events';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import html2canvas from 'html2canvas';

dayjs.extend(isSameOrAfter);

// --- 响应式数据 ---
const allEvents = ref<EventItem[]>([]); // 存储所有生成的事件

// 标签页控制
const activeTab = ref('future'); // 默认激活 'future' 标签页
if (localStorage.getItem('activeTab')) {
    activeTab.value = localStorage.getItem('activeTab') as string;
}

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

watch(activeTab, () => {
    localStorage.setItem('activeTab', activeTab.value);
})

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
    // 等待DOM更新，确保 .is-exporting 类被应用，从而禁用动画
    await nextTick();

    try {
        const canvas = await html2canvas(element, {
            backgroundColor: '#ffffff', // 设置背景色以防透明
            scale: 2, // 提高清晰度
            useCORS: true, // 允许跨域
        });

        console.log('导出图片完成');
        const link = document.createElement('a');
        const timestamp = dayjs().format('YYYYMMDD-HHmmss');
        link.href = canvas.toDataURL('image/png');
        link.download = `${filenamePrefix}_${timestamp}.png`;
        link.click();
    } catch (error) {
        console.error('导出图片失败:', error);
        alert('导出图片失败，请查看控制台获取更多信息。');
    } finally {
        // 确保在所有操作（包括异步的canvas生成）完成后重置状态
        isExporting.value = false;
    }
}
</script>

<template>
    <div class="container" :class="{ 'is-exporting': isExporting }">
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
            <p class="footer">© 2025 <a href="https://github.com/moyanj">MoYanj</a> | <a
                    href="https://github.com/moyanj/star-chrono">GitHub</a></p>
        </div>
    </div>
</template>

<style src="./style.css"></style>
