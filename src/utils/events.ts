import dayjs from 'dayjs';

// 精确偏移量配置（基于上半开启日）
export const EVENT_OFFSETS: { [key: string]: number } = {
    "天外卫星通信": -57,
    "测试服": -43,
    "前瞻特别节目": -12,
    "角色PV": -6,
    "角色介绍": -5,
    "活动速递": -4,
    "预下载": -2,
    "走进星穹": -1,
    "版本开启": 0,
    "下半开启": 21,
};

export interface EventItem {
    date: string;
    event: string;
    version: string;
}

function perVersion(version: string, start: dayjs.Dayjs, events: EventItem[]) {
    for (const eventName in EVENT_OFFSETS) {
        if (version === "3.7" && eventName === "预下载") {
            // 3.7 版本预下载事件特殊处理
            events.push({
                date: dayjs("2025-11-4").format("YYYY-MM-DD"),
                event: `${version} ${eventName}`,
                version: version
            });
            continue;
        }
        const offset = EVENT_OFFSETS[eventName];
        const eventDate = start.add(offset, 'day');
        events.push({
            date: eventDate.format("YYYY-MM-DD"),
            event: `${version} ${eventName}`,
            version: version
        });
    }
    return events;
}

/**
 * 生成精确的版本事件预测
 * @param startVersion 起始版本号 (e.g. "3.3")
 * @param startDate 起始版本上半开启日期 (e.g. "2025-05-21")
 * @param numVersions 需要预测的版本数量
 * @returns 排序后的事件列表
 */
export function generateVersionEvents(startVersion: string, startDate: string, numVersions: number): EventItem[] {
    const events: EventItem[] = perVersion(startVersion, dayjs(startDate), []);
    let currentDate = dayjs(startDate);
    let [major, minor] = startVersion.split(".").map(Number);

    // 生成后续版本
    for (let i = 0; i < numVersions; i++) {
        // 更新到下一个版本
        if (minor === 8) { // 版本号跳转规则 (X.8 -> (X+1).0)
            major += 1;
            minor = 0;
        } else {
            minor += 1;
        }

        const nextVersion = `${major}.${minor}`;
        const nextStart = currentDate.add(42, 'day'); // 完整版本周期

        // 如果版本号是 "1.7", "1.8", "2.8" 则跳过
        if (["1.7", "1.8", "2.8"].includes(nextVersion)) {
            continue;
        }
        perVersion(nextVersion, nextStart, events);

        currentDate = nextStart; // 更新当前版本开启日期，用于下一个版本的计算
    }

    // 按照日期排序
    return events.sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));
}

// 开服时间
export const INITIAL_START_VERSION = "1.0";
export const INITIAL_START_DATE = "2023-04-26";
