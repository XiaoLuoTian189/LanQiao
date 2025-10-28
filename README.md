<div align="center">

<img src="https://youke1.picui.cn/s1/2025/10/24/68faf25b9cf6f.png" style="width: 40%; height: auto;" alt="Example Image">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Platform](https://img.shields.io/badge/Platform-Windows-blue.svg)](https://www.microsoft.com/windows)


</div>
一个基于 Node.js 和 Express 的本地局域网网盘系统，支持文件上传、下载、删除、重命名等功能，专为局域网环境设计,有了它您可以轻松的将电脑作为网盘和同一局域网下的所有设备/终端共享你的文件！


## ✨ 特性

- 🚀 **开箱即用** - 打包为单个可执行文件，无需安装环境，或者直接使用我们的发行版本！
- 🌐 **文件共享** - 支持同一WiFi网络下的多设备访问
- 📁 **文件管理** - 完整的文件上传、下载、删除、重命名功能
- 🔒 **本地安全** - 仅在局域网内运行，数据不离开本地网络
- 🔒 **密码验证** - 支持设置访问密码让你的文件更加安全


## 🖼️ 界面预览

<div align="center">
  <table>
 <tr>
   <td><img src="https://youke1.picui.cn/s1/2025/10/28/690015a21bade.png" style="width: 50%; height: auto; alt="图片1"></td>
   <td><img src="https://youke1.picui.cn/s1/2025/10/28/690015a1dd8da.png" style="width: 50%; height: auto; alt="图片2"></td>
 </tr>
</table>
  <em>蓝桥本地网盘系统 - 让文件共享变得简单</em>
</div>



## 🚀 快速开始
### 下载使用（开箱即用）

1. 下载 [LanQiaoCloud.exe](https://github.com/XiaoLuoTian189/LanQiao/releases/download/%E6%AD%A3%E5%BC%8F%E7%89%88V1.0.2/LanQiaoCloud.exe) 文件（建议为程序主体创建一个文件夹）
2. 双击运行程序
3. 浏览器访问 `提示地址`
4. 开始使用网盘功能

### 源码运行（自行打包）

```bash
# 克隆项目
git clone https://github.com/XiaoLuoTian189/LanQiao.git
cd LanQiao.git

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




## 🛠️ 技术语言（技术栈）
- **后端**: Node.js + Express
- **前端**: HTML5 + CSS3 + JavaScript
- **文件处理**: Multer
- **打包工具**: PKG




## 📁 项目结构

```
lanqiao-cloud/
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

### 文件限制

默认最大文件大小：`100MB`

可在 `server.js` 中修改 `multer` 配置的 `fileSize` 限制。



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
**邮箱**: [联系作者](mailto:wanghaotianscimir@gmail.com)




## ⭐ 支持项目

如果这个项目对你有帮助，请给它一个 Star！

---

<div align="center">

**🌟 LanQiao让文件共享变得简单 🌟**

Made with ❤️ by [小洛天](https://github.com/XiaoLuoTian189)

</div>





















