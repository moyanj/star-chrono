<script setup lang="ts">
import { type EventItem } from './utils/events';
defineProps<{
    futureEvents: EventItem[];
}>();
</script>

<template>
    <div class="table-container">
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