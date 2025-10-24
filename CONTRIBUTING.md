# 贡献指南

感谢你对蓝桥本地网盘系统的关注！我们欢迎所有形式的贡献。

## 🤝 如何贡献

### 报告问题

如果你发现了bug或有功能建议：

1. 首先查看 [Issues](https://github.com/XiaoLuoTian189/lanqiao-cloud-storage/issues) 确认问题未被报告
2. 创建新的 Issue，请包含：
   - 详细的问题描述
   - 复现步骤
   - 预期行为 vs 实际行为
   - 环境信息（操作系统、Node.js版本等）
   - 截图或错误日志（如有）

### 提交代码

1. **Fork 项目**
   ```bash
   # 在GitHub上fork项目，然后克隆到本地
   git clone https://github.com/你的用户名/lanqiao-cloud-storage.git
   cd lanqiao-cloud-storage
   ```

2. **创建分支**
   ```bash
   # 创建新的功能分支
   git checkout -b feature/你的功能名称
   # 或者修复bug的分支
   git checkout -b fix/问题描述
   ```

3. **开发功能**
   - 遵循现有代码风格
   - 添加必要的注释
   - 确保代码可读性

4. **测试**
   ```bash
   # 安装依赖
   npm install
   
   # 启动开发服务器
   npm start
   
   # 测试功能是否正常工作
   ```

5. **提交更改**
   ```bash
   # 添加更改
   git add .
   
   # 提交（使用清晰的提交信息）
   git commit -m "feat: 添加新功能描述"
   # 或者
   git commit -m "fix: 修复某个问题"
   ```

6. **推送并创建PR**
   ```bash
   # 推送到你的fork
   git push origin feature/你的功能名称
   
   # 在GitHub上创建Pull Request
   ```

## 📝 提交信息规范

我们使用约定式提交（Conventional Commits）：

- `feat:` 新功能
- `fix:` 修复bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建过程或辅助工具的变动

示例：
```
feat: 添加文件预览功能
fix: 修复上传大文件时的内存泄漏问题
docs: 更新README中的安装说明
```

## 🎯 贡献类型

### 🐛 Bug修复
- 修复现有功能的问题
- 提高系统稳定性
- 优化错误处理

### ✨ 新功能
- 添加新的文件操作功能
- 改进用户界面
- 增强系统性能

### 📚 文档改进
- 完善README文档
- 添加API文档
- 改进代码注释

### 🎨 界面优化
- 改进UI/UX设计
- 添加新的主题
- 优化响应式布局

### ⚡ 性能优化
- 提高文件处理速度
- 优化内存使用
- 减少网络请求

## 🔍 代码规范

### JavaScript
- 使用ES6+语法
- 使用2个空格缩进
- 使用单引号
- 添加必要的注释

### CSS
- 使用有意义的类名
- 避免使用!important
- 保持样式的一致性

### HTML
- 使用语义化标签
- 保持结构清晰
- 添加必要的alt属性

## 🧪 测试

在提交代码前，请确保：

1. **功能测试**
   - 新功能按预期工作
   - 现有功能未被破坏
   - 边界情况处理正确

2. **兼容性测试**
   - 在不同浏览器中测试
   - 在不同设备上测试
   - 在不同网络环境下测试

3. **性能测试**
   - 大文件上传/下载
   - 多用户同时访问
   - 长时间运行稳定性

## 📋 Pull Request 检查清单

在创建PR前，请确认：

- [ ] 代码遵循项目规范
- [ ] 添加了必要的测试
- [ ] 更新了相关文档
- [ ] 提交信息清晰明确
- [ ] 没有破坏现有功能
- [ ] 代码经过充分测试

## 💬 讨论

如果你有任何问题或想法，欢迎：

- 在 [Issues](https://github.com/XiaoLuoTian189/lanqiao-cloud-storage/issues) 中讨论
- 加入我们的社区讨论
- 联系维护者

## 🙏 感谢

感谢所有贡献者的努力，让这个项目变得更好！

---

**记住：每一个贡献，无论大小，都是宝贵的！** 🌟
