# 🌐 蓝桥本地网盘系统

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Platform](https://img.shields.io/badge/Platform-Windows-blue.svg)](https://www.microsoft.com/windows)

一个基于 Node.js 和 Express 的本地局域网网盘系统，支持文件上传、下载、删除、重命名等功能，专为局域网环境设计,有了它您可以轻松的将电脑作为网盘和同一局域网下的所有设备/终端共享你的文件！

## ✨ 特性

- 🚀 **开箱即用** - 打包为单个可执行文件，无需安装环境，或者直接使用我们的发行版本！
- 🌐 **文件共享** - 支持同一WiFi网络下的多设备访问
- 📁 **文件管理** - 完整的文件上传、下载、删除、重命名功能
- 🔒 **本地安全** - 仅在局域网内运行，数据不离开本地网络

## 🖼️ 界面预览

![网盘系统界面](https://via.placeholder.com/800x500/2d3142/e8eaed?text=蓝桥本地网盘系统)

## 🚀 快速开始

### 下载使用

1. 下载 `cloud-storage.exe` 文件
2. 双击运行程序
3. 浏览器访问 `http://127.0.0.1:2333`
4. 开始使用网盘功能

### 源码运行

```bash
# 克隆项目
git clone https://github.com/XiaoLuoTian189/lanqiao-cloud-storage.git
cd lanqiao-cloud-storage

# 安装依赖
npm install

# 启动服务
npm start

# 访问 http://127.0.0.1:2333
```

### 打包为可执行文件

```bash
# 安装打包工具
npm install -g pkg

# 打包为exe文件
npm run build
```

## 📖 使用说明

### 基本功能

- **文件上传**: 拖拽文件到上传区域或点击选择文件
- **文件下载**: 点击文件名即可下载
- **文件删除**: 点击删除按钮确认删除
- **文件重命名**: 点击重命名按钮修改文件名
- **文件搜索**: 使用搜索框快速查找文件

### 局域网访问

1. 确保设备连接同一WiFi网络
2. 在其他设备浏览器中输入显示的局域网地址
3. 如无法访问，请检查防火墙设置

### 网络配置

程序会自动显示：
- 本地访问地址：`http://127.0.0.1:2333`
- 局域网访问地址：`http://[你的IP]:2333`

## 🛠️ 技术栈

- **后端**: Node.js + Express
- **前端**: HTML5 + CSS3 + JavaScript (ES6+)
- **文件处理**: Multer
- **打包工具**: PKG
- **样式**: 自定义CSS，深蓝灰色主题

## 📁 项目结构

```
lanqiao-cloud-storage/
├── cloud-storage.exe          # 可执行文件
├── server.js                  # 服务器主文件
├── package.json               # 项目配置
├── public/                    # 前端文件
│   ├── index.html             # 主页面
│   ├── style.css              # 样式文件
│   └── script.js              # 前端脚本
├── uploads/                   # 文件存储目录
└── README.md                  # 项目说明
```

## 🔧 配置说明

### 端口配置

默认端口：`2333`

如需修改端口，请编辑 `server.js` 文件中的 `PORT` 变量。

### 文件大小限制

默认最大文件大小：`100MB`

可在 `server.js` 中修改 `multer` 配置的 `fileSize` 限制。

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 如何贡献

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

### 贡献类型

- 🐛 Bug修复
- ✨ 新功能开发
- 📚 文档改进
- 🎨 界面优化
- ⚡ 性能优化

## 📝 更新日志

### v1.0.0 (2024-10-24)

- ✨ 初始版本发布
- 🚀 支持文件上传、下载、删除、重命名
- 🌐 支持局域网多设备访问
- 🎨 深蓝灰色主题界面
- 📦 打包为单个可执行文件

## 🐛 问题反馈

如果你发现了bug或有功能建议，请：

1. 查看 [Issues](https://github.com/XiaoLuoTian189/lanqiao-cloud-storage/issues) 确认问题未被报告
2. 创建新的 Issue 并详细描述问题
3. 提供复现步骤和环境信息

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 开源协议。

### MIT License 说明

MIT License 是一个宽松的开源协议，允许：

- ✅ 商业使用
- ✅ 修改和分发
- ✅ 私人使用
- ✅ 专利使用

**要求**：
- 📋 保留版权声明和许可证文本

## 👨‍💻 作者信息

**作者**: 小洛天  
**GitHub**: [@XiaoLuoTian189](https://github.com/XiaoLuoTian189)  
**邮箱**: [联系作者](mailto:your-email@example.com)

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和用户！

## ⭐ 支持项目

如果这个项目对你有帮助，请给它一个 ⭐ Star！

---

<div align="center">

**🌟 让文件共享变得简单 🌟**

Made with ❤️ by [小洛天](https://github.com/XiaoLuoTian189)

</div>

