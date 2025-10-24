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
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(express.static(publicDir));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    try {
      let targetDir = uploadsDir;
      
      // 检查是否有目标文件夹参数
      if (req.body.targetFolder) {
        targetDir = path.join(uploadsDir, req.body.targetFolder);
      }
      
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      cb(null, targetDir);
    } catch (error) {
      console.error('创建目标目录失败:', error);
      cb(error, null);
    }
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    let name = path.basename(file.originalname, ext);
    
    // 尝试修复UTF-8乱码问题
    try {
      // 将乱码字符串转换为Buffer，然后重新解码
      const buffer = Buffer.from(name, 'latin1');
      const utf8Name = buffer.toString('utf8');
      
      // 检查解码后是否包含中文字符
      if (/[\u4e00-\u9fa5]/.test(utf8Name)) {
        name = utf8Name;
        console.log('UTF-8解码后的文件名:', name);
      } else {
        console.log('原始文件名:', name);
      }
    } catch (error) {
      console.log('文件名解码失败:', error);
    }
    
    // 处理中文文件名编码问题
    let safeName;
    try {
      // 检查是否包含中文字符
      if (/[\u4e00-\u9fa5]/.test(name)) {
        // 包含中文字符，使用Base64编码
        safeName = Buffer.from(name, 'utf8').toString('base64');
        console.log('Base64编码后的文件名:', safeName);
      } else {
        // 不包含中文字符，直接使用
        safeName = name;
      }
    } catch (error) {
      // 如果编码失败，使用时间戳作为文件名
      safeName = `file_${timestamp}`;
    }
    
    cb(null, `${safeName}_${timestamp}${ext}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024
  },
  fileFilter: function (req, file, cb) {
    // 尝试修复文件名的编码问题
    try {
      // 如果文件名包含乱码，尝试修复
      if (file.originalname.includes('å') || file.originalname.includes('ç') || file.originalname.includes('­')) {
        // 尝试将乱码转换为正确的中文
        let fixedName = file.originalname;
        
        // 常见的UTF-8乱码修复映射
        const fixMap = {
          'å¤': '夜',
          'ç': '猫',
          '«': '子',
          '­': ''
        };
        
        // 应用修复映射
        for (const [wrong, correct] of Object.entries(fixMap)) {
          fixedName = fixedName.replace(new RegExp(wrong, 'g'), correct);
        }
        
        // 更新原始文件名
        file.originalname = fixedName;
      }
    } catch (error) {
      console.log('文件名修复失败:', error);
    }
    
    cb(null, true);
  }
});

app.get('/api/files', async (req, res) => {
  try {
    const files = await fs.readdir(uploadsDir);
    const fileList = [];
    
    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      const stats = await fs.stat(filePath);
      
      // 处理中文文件名显示
      let displayName = file;
      try {
        if (stats.isDirectory()) {
          // 文件夹名称处理：直接尝试Base64解码
          try {
            const decoded = Buffer.from(file, 'base64').toString('utf8');
            // 检查解码后是否包含中文字符
            if (/[\u4e00-\u9fa5]/.test(decoded)) {
              displayName = decoded;
            }
          } catch (e) {
            // Base64解码失败，使用原始文件夹名
            displayName = file;
          }
        } else {
          // 文件名称处理：检查文件名是否包含Base64编码的中文
          const nameWithoutExt = path.basename(file, path.extname(file));
          const parts = nameWithoutExt.split('_');
          if (parts.length >= 2) {
            const encodedName = parts.slice(0, -1).join('_'); // 除了最后的时间戳部分
            // 尝试Base64解码
            try {
              const decoded = Buffer.from(encodedName, 'base64').toString('utf8');
              // 检查解码后是否包含中文字符
              if (/[\u4e00-\u9fa5]/.test(decoded)) {
                displayName = decoded + path.extname(file);
              }
            } catch (e) {
              // Base64解码失败，使用原始文件名
            }
          }
        }
      } catch (e) {
        // 如果解码失败，使用原始文件名
        displayName = file;
      }
      
      fileList.push({
        name: file, // 存储原始文件名用于API操作
        displayName: displayName, // 显示用的文件名
        size: stats.size,
        uploadTime: stats.birthtime,
        isDirectory: stats.isDirectory()
      });
    }
    
    // 按类型排序：文件夹在前，文件在后
    fileList.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.displayName.localeCompare(b.displayName);
    });
    
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
  
  // 处理中文文件名下载
  try {
    // 尝试解码Base64编码的文件名
    let displayName = filename;
    try {
      const nameWithoutExt = path.basename(filename, path.extname(filename));
      const parts = nameWithoutExt.split('_');
      if (parts.length >= 2) {
        const encodedName = parts.slice(0, -1).join('_'); // 除了最后的时间戳部分
        // 尝试Base64解码
        try {
          const decoded = Buffer.from(encodedName, 'base64').toString('utf8');
          // 检查解码后是否包含中文字符
          if (/[\u4e00-\u9fa5]/.test(decoded)) {
            displayName = decoded + path.extname(filename);
          }
        } catch (e) {
          // Base64解码失败，使用原始文件名
        }
      }
    } catch (e) {
      // 如果解码失败，使用原始文件名
      displayName = filename;
    }
    
    res.download(filePath, displayName);
  } catch (error) {
    console.error('下载文件时出错:', error);
    res.status(500).json({ error: '文件下载失败' });
  }
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

// 创建文件夹
app.post('/api/folders', async (req, res) => {
  const { folderName } = req.body;
  
  console.log('创建文件夹请求收到:', { folderName });
  
  if (!folderName) {
    return res.status(400).json({ error: '文件夹名称不能为空' });
  }
  
  // 处理中文文件夹名
  let safeFolderName = folderName;
  try {
    if (/[\u4e00-\u9fa5]/.test(folderName)) {
      safeFolderName = Buffer.from(folderName, 'utf8').toString('base64');
      console.log('中文文件夹名Base64编码:', safeFolderName);
    } else {
      console.log('非中文文件夹名:', folderName);
    }
  } catch (error) {
    console.error('文件夹名称编码失败:', error);
    return res.status(400).json({ error: '文件夹名称包含非法字符' });
  }
  
  const folderPath = path.join(uploadsDir, safeFolderName);
  console.log('文件夹路径:', folderPath);
  
  try {
    if (await fs.pathExists(folderPath)) {
      return res.status(400).json({ error: '文件夹已存在' });
    }
    
    await fs.mkdir(folderPath, { recursive: true });
    console.log('文件夹创建成功:', folderPath);
    res.json({ message: '文件夹创建成功', folderName: safeFolderName });
  } catch (error) {
    console.error('文件夹创建失败:', error);
    res.status(500).json({ error: '文件夹创建失败' });
  }
});

// 移动文件到文件夹
app.put('/api/files/:filename/move', async (req, res) => {
  const filename = req.params.filename;
  const { targetFolder } = req.body;
  
  if (!targetFolder) {
    return res.status(400).json({ error: '目标文件夹不能为空' });
  }
  
  const sourcePath = path.join(uploadsDir, filename);
  const targetPath = path.join(uploadsDir, targetFolder, filename);
  
  try {
    if (!await fs.pathExists(sourcePath)) {
      return res.status(404).json({ error: '源文件不存在' });
    }
    
    if (!await fs.pathExists(path.join(uploadsDir, targetFolder))) {
      return res.status(404).json({ error: '目标文件夹不存在' });
    }
    
    await fs.move(sourcePath, targetPath);
    res.json({ message: '文件移动成功' });
  } catch (error) {
    res.status(500).json({ error: '文件移动失败' });
  }
});

// 获取文件夹内容
app.get('/api/folders/:folderName', async (req, res) => {
  const folderName = req.params.folderName;
  const folderPath = path.join(uploadsDir, folderName);
  
  try {
    if (!await fs.pathExists(folderPath)) {
      return res.status(404).json({ error: '文件夹不存在' });
    }
    
    const stats = await fs.stat(folderPath);
    if (!stats.isDirectory()) {
      return res.status(400).json({ error: '指定路径不是文件夹' });
    }
    
    const files = await fs.readdir(folderPath);
    const fileList = [];
    
    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const fileStats = await fs.stat(filePath);
      
      // 处理中文文件名显示
      let displayName = file;
      try {
        if (fileStats.isDirectory()) {
          // 文件夹名称处理：直接尝试Base64解码
          try {
            const decoded = Buffer.from(file, 'base64').toString('utf8');
            // 检查解码后是否包含中文字符
            if (/[\u4e00-\u9fa5]/.test(decoded)) {
              displayName = decoded;
            }
          } catch (e) {
            // Base64解码失败，使用原始文件夹名
            displayName = file;
          }
        } else {
          // 文件名称处理：检查文件名是否包含Base64编码的中文
          const nameWithoutExt = path.basename(file, path.extname(file));
          const parts = nameWithoutExt.split('_');
          if (parts.length >= 2) {
            const encodedName = parts.slice(0, -1).join('_');
            try {
              const decoded = Buffer.from(encodedName, 'base64').toString('utf8');
              if (/[\u4e00-\u9fa5]/.test(decoded)) {
                displayName = decoded + path.extname(file);
              }
            } catch (e) {
              // Base64解码失败，使用原始文件名
            }
          }
        }
      } catch (e) {
        displayName = file;
      }
      
      fileList.push({
        name: file,
        displayName: displayName,
        size: fileStats.size,
        uploadTime: fileStats.birthtime,
        isDirectory: fileStats.isDirectory()
      });
    }
    
    // 按类型排序：文件夹在前，文件在后
    fileList.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.displayName.localeCompare(b.displayName);
    });
    
    res.json(fileList);
  } catch (error) {
    res.status(500).json({ error: '获取文件夹内容失败' });
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
    
    // Windows兼容的输入处理
    if (process.platform === 'win32') {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      rl.question('', () => {
        rl.close();
        process.exit(0);
      });
    } else {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on('data', process.exit.bind(process, 0));
    }
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
