<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch, type ComputedRef } from 'vue';
import { generateVersionEvents, type EventItem, INITIAL_START_VERSION, INITIAL_START_DATE, EVENT_OFFSETS } from './utils/events';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import { snapdom } from '@zumer/snapdom';
import EventList from './EventList.vue';

dayjs.extend(isSameOrAfter);

// --- 类型定义 ---
type TabName = 'future' | 'version' | 'date' | 'eventType';
type ExportElementRef = InstanceType<typeof EventList> | null;

// --- 响应式数据 ---
const allEvents = ref<EventItem[]>([]);
const isExporting = ref(false);

// 标签页控制
const activeTab = ref<TabName>('future');
const storedTab = localStorage.getItem('activeTab') as TabName;
if (storedTab && ['future', 'version', 'date', 'eventType'].includes(storedTab)) {
    activeTab.value = storedTab;
}

// 查询参数
const futureYears = ref(1);
const inputVersion = ref('');
const inputDate = ref(dayjs().format('YYYY-MM-DD'));
const dateRangeYears = ref(1);
const selectedEventType = ref('');
const timeFrameYears = ref(1);

// DOM引用
const futureTableRef = ref<ExportElementRef>(null);
const versionTableRef = ref<ExportElementRef>(null);
const dateTableRef = ref<ExportElementRef>(null);
const eventTypeTableRef = ref<ExportElementRef>(null);

// --- 计算属性 ---
const eventTypes = computed(() => Object.keys(EVENT_OFFSETS));

const futureEvents: ComputedRef<EventItem[]> = computed(() => {
    const today = dayjs().startOf('day');
    const endDate = today.add(futureYears.value, 'year').endOf('day');

    return filterAndSortEvents(
        event => isDateInRange(event.date, today, endDate)
    );
});

const versionEvents: ComputedRef<EventItem[]> = computed(() => {
    if (!isValidVersion(inputVersion.value)) return [];

    return filterAndSortEvents(
        event => event.version.startsWith(inputVersion.value)
    );
});

const dateRangeEvents: ComputedRef<EventItem[]> = computed(() => {
    if (!inputDate.value) return [];

    const targetDate = dayjs(inputDate.value).startOf('day');
    const startDate = targetDate.subtract(dateRangeYears.value, 'year').startOf('day');
    const endDate = targetDate.add(dateRangeYears.value, 'year').endOf('day');

    return filterAndSortEvents(
        event => isDateInRange(event.date, startDate, endDate)
    );
});

const eventTypeEvents: ComputedRef<EventItem[]> = computed(() => {
    if (!selectedEventType.value) return [];

    const today = dayjs().startOf('day');
    const endDate = today.add(timeFrameYears.value, 'year').endOf('day');

    return filterAndSortEvents(
        event => isDateInRange(event.date, today, endDate) &&
            event.event.includes(selectedEventType.value)
    );
});

// --- 工具函数 ---
const filterAndSortEvents = (filterFn: (event: EventItem) => boolean): EventItem[] => {
    return allEvents.value
        .filter(filterFn)
        .sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));
};

const isDateInRange = (date: string, start: dayjs.Dayjs, end: dayjs.Dayjs): boolean => {
    const eventDate = dayjs(date);
    return eventDate.isSameOrAfter(start) && eventDate.isBefore(end);
};

const isValidVersion = (version: string): boolean => {
    return version.includes('.') && version.length >= 3;
};

// --- 生命周期和监听器 ---
onMounted(() => {
    allEvents.value = generateVersionEvents(INITIAL_START_VERSION, INITIAL_START_DATE, 200); // 直到2600年12月24日 559.4版本 下半开启
    console.log(allEvents.value[allEvents.value.length - 1]); // 输出最后一个事件，便于调试
});

watch(activeTab, (newTab) => {
    localStorage.setItem('activeTab', newTab);
});

// --- 操作方法 ---
const setTab = (tabName: TabName): void => {
    activeTab.value = tabName;
};

const exportToImage = async (element: InstanceType<typeof EventList> | null, filenamePrefix: string): Promise<void> => {
    if (!element || isExporting.value) return;

    isExporting.value = true;

    try {
        element.download_img(filenamePrefix);
    } catch (error) {
        console.error('导出图片失败:', error);
        alert('导出图片失败，请查看控制台获取更多信息。');
    } finally {
        isExporting.value = false;
    }
};
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
                <event-list :future-events="futureEvents" ref="futureTableRef" />
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
                <event-list :future-events="versionEvents" ref="versionTableRef" />
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
                <event-list :future-events="dateRangeEvents" ref="dateTableRef" />
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
                <event-list :future-events="eventTypeEvents" ref="eventTypeTableRef" />
            </section>
        </div>
        <div align="center">
            <p class="footer">© {{ new Date().getFullYear() }} <a href="https://github.com/moyanj">MoYanj</a> | <a
                    href="https://github.com/moyanj/star-chrono">GitHub</a></p>
        </div>
    </div>
</template>

<style src="./style.css"></style>
