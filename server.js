const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = 2333;

const uploadsDir = path.join(process.cwd(), 'uploads');
const publicDir = path.join(__dirname, 'public');

console.log('当前工作目录:', process.cwd());
console.log('uploads目录路径:', uploadsDir);
console.log('public目录路径:', publicDir);

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
} catch (error) {
  console.log('使用当前目录作为存储目录');
}

app.use(cors());
app.use(express.json());
app.use(express.static(publicDir));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      cb(null, uploadsDir);
    } catch (error) {
      console.error('创建uploads目录失败:', error);
      cb(error, null);
    }
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}_${timestamp}${ext}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024
  }
});

app.get('/api/files', async (req, res) => {
  try {
    const files = await fs.readdir(uploadsDir);
    const fileList = [];
    
    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      const stats = await fs.stat(filePath);
      
      fileList.push({
        name: file,
        size: stats.size,
        uploadTime: stats.birthtime,
        isDirectory: stats.isDirectory()
      });
    }
    
    res.json(fileList);
  } catch (error) {
    res.status(500).json({ error: '获取文件列表失败' });
  }
});

app.post('/api/upload', upload.array('file', 10), (req, res) => {
  console.log('上传请求收到:', req.files);
  
  if (!req.files || req.files.length === 0) {
    console.log('没有文件被上传');
    return res.status(400).json({ error: '没有文件被上传' });
  }
  
  const uploadedFiles = req.files.map(file => ({
    filename: file.filename,
    originalName: file.originalname
  }));
  
  console.log('文件上传成功:', uploadedFiles);
  res.json({ 
    message: '文件上传成功',
    files: uploadedFiles
  });
}, (error, req, res, next) => {
  console.error('上传错误:', error);
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: '文件大小超过限制(100MB)' });
  }
  if (error.code === 'ENOENT') {
    return res.status(500).json({ error: '存储目录创建失败，请检查权限' });
  }
  res.status(500).json({ error: '文件上传失败: ' + error.message });
});

app.get('/api/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '文件不存在' });
  }
  
  res.download(filePath);
});

app.delete('/api/files/:filename', async (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);
  
  try {
    await fs.remove(filePath);
    res.json({ message: '文件删除成功' });
  } catch (error) {
    res.status(500).json({ error: '文件删除失败' });
  }
});

app.put('/api/files/:filename', async (req, res) => {
  const oldFilename = req.params.filename;
  const { newName } = req.body;
  
  if (!newName) {
    return res.status(400).json({ error: '新文件名不能为空' });
  }
  
  const oldPath = path.join(uploadsDir, oldFilename);
  const newPath = path.join(uploadsDir, newName);
  
  try {
    await fs.move(oldPath, newPath);
    res.json({ message: '文件重命名成功' });
  } catch (error) {
    res.status(500).json({ error: '文件重命名失败' });
  }
});

const os = require('os');
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const server = app.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIP();
  console.log('========================================');
  console.log('        蓝桥本地云网盘已启动');
  console.log('========================================');
  console.log(`本地访问: http://127.0.0.1:${PORT}`);
  console.log(`局域网访问: http://${localIP}:${PORT}`);
  console.log('========================================');
  console.log('提示: 如果其他设备无法访问，请检查:');
  console.log('1. 防火墙是否允许端口2333');
  console.log('2. 设备是否在同一WiFi网络');
  console.log('3. 路由器是否开启了AP隔离');
  console.log('========================================');
  console.log('');
  console.log('💡 关闭程序: 直接关闭此窗口或按 Ctrl+C');
  console.log('========================================');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log('========================================');
    console.log('        端口2333已被占用');
    console.log('========================================');
    console.log('请检查是否有其他蓝桥本地云网盘程序正在运行');
    console.log('或等待几秒后重新启动');
    console.log('========================================');
    console.log('按任意键退出...');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', process.exit.bind(process, 0));
  } else {
    console.error('服务器启动失败:', err);
  }
});

function gracefulShutdown() {
  console.log('\n正在关闭蓝桥本地云网盘服务器...');
  server.close((err) => {
    if (err) {
      console.error('关闭服务器时出错:', err);
      process.exit(1);
    }
    console.log('蓝桥本地云网盘服务器已关闭');
    process.exit(0);
  });
  
  setTimeout(() => {
    console.error('强制关闭服务器');
    process.exit(1);
  }, 10000);
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('SIGHUP', gracefulShutdown);

if (process.platform === 'win32') {
  const rl = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on('SIGINT', () => {
    gracefulShutdown();
  });
}

process.on('uncaughtException', (err) => {
  console.error('未捕获的异常:', err);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  gracefulShutdown();
});

module.exports = app;
