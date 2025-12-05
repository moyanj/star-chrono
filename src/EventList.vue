<script setup lang="ts">
import { nextTick, ref } from 'vue';
import { type EventItem } from './utils/events';
import { snapdom } from '@zumer/snapdom';
import dayjs from 'dayjs';
defineProps<{
    futureEvents: EventItem[];
}>();
const refa = ref();
async function download_img(filenamePrefix: string) {
    await nextTick();
    const result = await snapdom(refa.value, {
        backgroundColor: '#ffffff',
        type: 'jpg' as const,
        scale: 2,
    });

    const timestamp = dayjs().format('YYYYMMDD-HHmmss');
    const blob = await result.toBlob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filenamePrefix}_${timestamp}.jpg`;
    link.click();

    URL.revokeObjectURL(link.href);
}
defineExpose({
    download_img
});

</script>

<template>
    <div class="table-container" ref="refa">
        <table v-if="futureEvents.length">
            <thead>
                <tr>
                    <th>日期</th>
                    <th>版本事件</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="event in futureEvents" :key="event.date + event.event">
                    <td>{{ event.date }}</td>
                    <td>{{ event.version }} {{ event.event }}</td>
                </tr>
            </tbody>
        </table>
        <p v-else>请输入版本号或该版本暂无事件。</p>
    </div>

</template>