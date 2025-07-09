# 🌌 StarChrono — 星穹事件簿

> *《崩坏：星穹铁道》版本与活动事件预测工具*

![GitHub license](https://img.shields.io/github/license/moyanj/star-chrono)
![GitHub stars](https://img.shields.io/github/stars/moyanj/star-chrono)
![GitHub issues](https://img.shields.io/github/issues/moyanj/star-chrono)
![GitHub last commit](https://img.shields.io/github/last-commit/moyanj/star-chrono)

---

## 📖 项目简介

**StarChrono（星穹事件簿）** 是一个为[《崩坏：星穹铁道》](https://sr.mihoyo.com/)玩家设计的**版本事件预测工具**。它基于版本更新周期和历史数据，**自动生成未来版本事件时间表**，支持以下功能：

- 🎉 查看未来版本事件（如版本开启、角色PV、前瞻节目等）
- 🔍 按版本号快速查询相关事件
- 🗓️ 按日期范围查询事件

---

## 🚀 功能亮点

- ✅ **精准预测**：基于版本发布时间规律及事件偏移表，预测未来所有版本事件。
- 📅 **多维查询**：支持未来年份、版本号、中心日期等多种查询方式。
- 🌐 **网页化 UI**：基于 Vue 3 + TypeScript 构建，界面友好，交互直观。
- 💡 **开源可定制**：代码结构清晰，方便开发者扩展功能或集成到其他项目中。

---

## 🖥️ 技术栈

- **Vue 3** + **TypeScript**
- **Day.js**：轻量日期处理库
- **Vue Composition API**
- **CSS3 + 响应式布局**

---

## 🧩 核心功能说明

### 1. 查看未来事件
输入查看未来多少年内的事件，系统将自动列出相关版本事件。

### 2. 按版本号查询
输入版本号（如：`2.3`），即可查找该版本内所有事件。

### 3. 按日期范围查询
输入中心日期和年份范围，系统将展示该时间段内的事件。

---

## 🧪 使用方法

### 本地运行

1. 克隆项目：
   ```bash
   git clone https://github.com/moyanj/star-chrono.git
   ```

2. 安装依赖：
   ```bash
   cd star-chrono
   npm install
   ```

3. 启动开发服务器：
   ```bash
   npm run dev
   ```

4. 打开浏览器访问：
   ```
   http://localhost:5173
   ```

---

## 📁 项目结构

```
src/
├── App.vue             # 主页面组件
├── main.ts             # Vue 入口文件
├── utils/
│   └── events.ts       # 事件生成逻辑与偏移表
```

---

## 📢 想要贡献？

欢迎提交 Issues、Pull Requests，或为事件偏移表提供更多精确事件数据！

GitHub 地址：[https://github.com/moyanj/star-chrono](https://github.com/moyanj/star-chrono)

---

## 📜 协议

本项目采用 MIT 许可证，详情请查看 [LICENSE](LICENSE) 文件。

---

## 👥 联系作者

- 🌐 GitHub：[@moyanj](https://github.com/moyanj)
- 📧 邮箱：moyanjdc@qq.com

---

## ❤️ 鸣谢

感谢你使用 **StarChrono - 星穹事件簿**，希望它能为你提供帮助！
