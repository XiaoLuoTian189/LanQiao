let files = [];
let selectedFiles = new Set();
let currentRenameFile = null;
let currentMoveFile = null;
let isAllSelected = false;
let accessPassword = null;
let isPasswordVerified = false;
let passwordSetupSkipped = false;

// 24小时免验证相关
const VERIFICATION_EXPIRE_TIME = 24 * 60 * 60 * 1000; // 24小时（毫秒）
const VERIFICATION_KEY = 'passwordVerificationTime';

// 24小时免验证相关函数
function isVerificationValid() {
    const verificationTime = localStorage.getItem(VERIFICATION_KEY);
    if (!verificationTime) {
        return false;
    }
    
    const currentTime = Date.now();
    const savedTime = parseInt(verificationTime);
    const timeDiff = currentTime - savedTime;
    
    return timeDiff < VERIFICATION_EXPIRE_TIME;
}

function saveVerificationTime() {
    localStorage.setItem(VERIFICATION_KEY, Date.now().toString());
}

function clearVerificationTime() {
    localStorage.removeItem(VERIFICATION_KEY);
    localStorage.removeItem('savedPassword');
}

// 从localStorage恢复密码状态
function restorePasswordState() {
    const savedPassword = localStorage.getItem('savedPassword');
    const verificationTime = localStorage.getItem(VERIFICATION_KEY);
    
    if (savedPassword && verificationTime && isVerificationValid()) {
        accessPassword = savedPassword;
        isPasswordVerified = true;
        console.log('从localStorage恢复密码状态，24小时内免验证');
        return true;
    } else if (verificationTime && !isVerificationValid()) {
        // 验证时间已过期，清理状态
        localStorage.removeItem('savedPassword');
        localStorage.removeItem(VERIFICATION_KEY);
        console.log('验证时间已过期，清理密码状态');
    }
    
    return false;
}

// 显示验证状态
function showVerificationStatus() {
    const verificationTime = localStorage.getItem(VERIFICATION_KEY);
    if (!verificationTime) {
        showMessage('未进行过密码验证', 'info');
        return;
    }
    
    const currentTime = Date.now();
    const savedTime = parseInt(verificationTime);
    const timeDiff = currentTime - savedTime;
    const remainingTime = VERIFICATION_EXPIRE_TIME - timeDiff;
    
    if (remainingTime <= 0) {
        showMessage('密码验证已过期，需要重新验证', 'warning');
        clearVerificationTime();
    } else {
        const hours = Math.floor(remainingTime / (60 * 60 * 1000));
        const minutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
        showMessage(`密码验证有效，剩余时间：${hours}小时${minutes}分钟`, 'success');
    }
}

// 密码验证相关函数
async function checkPasswordRequired() {
    // 首先尝试从localStorage恢复密码状态
    if (restorePasswordState()) {
        console.log('已从localStorage恢复密码状态，直接进入');
        initializeApp();
        return;
    }
    
    try {
        const response = await fetch('/api/check-password');
        const data = await response.json();
        
        if (data.requiresPassword) {
            // 需要密码验证
            if (!isPasswordVerified) {
                showPasswordModal();
            } else {
                initializeApp();
            }
        } else if (!data.hasBeenAsked) {
            // 首次访问且未询问过密码设置
            showPasswordSetupModal();
        } else {
            initializeApp();
        }
    } catch (error) {
        console.error('检查密码状态失败:', error);
        initializeApp();
    }
}

function showPasswordSetupModal() {
    document.getElementById('passwordSetupModal').style.display = 'flex';
    document.getElementById('setupPasswordInput').focus();
}

function closePasswordSetupModal() {
    document.getElementById('passwordSetupModal').style.display = 'none';
    document.getElementById('setupPasswordInput').value = '';
    document.getElementById('confirmPasswordInput').value = '';
}

async function setPassword() {
    const password = document.getElementById('setupPasswordInput').value.trim();
    const confirmPassword = document.getElementById('confirmPasswordInput').value.trim();
    
    if (!password) {
        showMessage('请输入密码', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('两次输入的密码不一致', 'error');
        return;
    }
    
    if (password.length < 4) {
        showMessage('密码长度至少4位', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/set-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password: password })
        });
        
        if (response.ok) {
            accessPassword = password;
            isPasswordVerified = true;
            localStorage.setItem('savedPassword', password); // 保存密码到localStorage
            saveVerificationTime(); // 保存验证时间
            closePasswordSetupModal();
            initializeApp();
            showMessage('密码设置成功！24小时内无需再次验证', 'success');
        } else {
            showMessage('密码设置失败', 'error');
        }
    } catch (error) {
        showMessage('密码设置失败: ' + error.message, 'error');
    }
}

async function skipPasswordSetup() {
    try {
        const response = await fetch('/api/skip-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            closePasswordSetupModal();
            initializeApp();
            showMessage('已跳过密码设置', 'info');
        } else {
            showMessage('跳过密码设置失败', 'error');
        }
    } catch (error) {
        showMessage('跳过密码设置失败: ' + error.message, 'error');
    }
}

function showPasswordModal() {
    document.getElementById('passwordModal').style.display = 'flex';
    document.getElementById('passwordInput').focus();
}

function closePasswordModal() {
    document.getElementById('passwordModal').style.display = 'none';
    document.getElementById('passwordInput').value = '';
}

async function verifyPassword() {
    const password = document.getElementById('passwordInput').value.trim();
    if (!password) {
        showMessage('请输入密码', 'error');
        return;
    }

    try {
        const response = await fetch('/api/verify-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password: password })
        });

        const data = await response.json();
        if (data.valid) {
            accessPassword = password;
            isPasswordVerified = true;
            localStorage.setItem('savedPassword', password); // 保存密码到localStorage
            saveVerificationTime(); // 保存验证时间
            closePasswordModal();
            initializeApp();
            showMessage('密码验证成功，24小时内无需再次验证', 'success');
        } else {
            showMessage('密码错误，请重新输入', 'error');
            document.getElementById('passwordInput').value = '';
        }
    } catch (error) {
        showMessage('密码验证失败: ' + error.message, 'error');
    }
}

// 添加密码到请求头
function addPasswordToHeaders(options = {}) {
    if (accessPassword) {
        options.headers = options.headers || {};
        options.headers['x-access-password'] = accessPassword;
        console.log('添加密码头部到请求:', options.url || '未知请求');
    } else {
        console.log('没有密码，跳过添加头部');
    }
    return options;
}

// UTF-8 Base64解码函数
function decodeUTF8Base64(encodedString) {
    try {
        const binaryString = atob(encodedString);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return new TextDecoder('utf-8').decode(bytes);
    } catch (e) {
        return encodedString; // 解码失败，返回原始字符串
    }
}

// 主题切换功能
function initializeTheme() {
    // 检查本地存储中的主题设置，默认为白色主题
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    
    if (theme === 'dark') {
        // 深色模式 - 显示月亮图标
        themeIcon.innerHTML = `
            <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/>
        `;
        themeText.textContent = '浅色模式';
    } else {
        // 浅色模式 - 显示太阳图标
        themeIcon.innerHTML = `
            <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"/>
        `;
        themeText.textContent = '深色模式';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    checkPasswordRequired();
});

function initializeApp() {
    setupFileUpload();
    loadFiles();
    setupEventListeners();
}

function setupFileUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');

    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', handleFileSelect);

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const droppedFiles = e.dataTransfer.files;
        uploadFiles(droppedFiles);
    });
}

function setupEventListeners() {
    document.getElementById('searchInput').addEventListener('input', filterFiles);
    
    document.getElementById('renameModal').addEventListener('click', (e) => {
        if (e.target.id === 'renameModal') {
            closeRenameModal();
        }
    });
}

function handleFileSelect(e) {
    const selectedFiles = e.target.files;
    uploadFiles(selectedFiles);
}

async function uploadFiles(fileList) {
    if (fileList.length === 0) return;

    // 如果当前在文件夹中，询问是否上传到当前文件夹
    let targetFolder = null;
    if (currentFolder) {
        // 解码文件夹名称用于显示
        let displayFolderName = currentFolder;
        try {
            const decoded = atob(currentFolder);
            if (/[\u4e00-\u9fa5]/.test(decoded)) {
                displayFolderName = decoded;
            }
        } catch (e) {
            // Base64解码失败，使用原始名称
        }
        
        if (confirm(`是否将文件上传到当前文件夹 "${displayFolderName}" 中？`)) {
            targetFolder = currentFolder;
        }
    }

    showLoading(true);

    try {
        const formData = new FormData();
        for (let file of fileList) {
            formData.append('file', file);
        }
        
        // 添加目标文件夹参数
        if (targetFolder) {
            formData.append('targetFolder', targetFolder);
        }

        const options = addPasswordToHeaders({
            method: 'POST',
            body: formData
        });
        const response = await fetch('/api/upload', options);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`服务器返回非JSON响应: ${text.substring(0, 100)}`);
        }

        const result = await response.json();

        showMessage('文件上传成功！', 'success');
        
        // 如果在文件夹中，重新加载文件夹内容；否则加载根目录
        if (currentFolder) {
            loadFolderContents(currentFolder);
        } else {
        loadFiles();
        }
    } catch (error) {
        showMessage('上传失败: ' + error.message, 'error');
    } finally {
        showLoading(false);
        document.getElementById('fileInput').value = '';
    }
}

async function loadFiles() {
    try {
        const options = addPasswordToHeaders();
        const response = await fetch('/api/files', options);
        
        if (response.status === 401) {
            const data = await response.json();
            if (data.requiresPassword) {
                isPasswordVerified = false;
                showPasswordModal();
                return;
            }
        }
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`服务器返回非JSON响应: ${text.substring(0, 100)}`);
        }

        const result = await response.json();
        files = result;
        selectedFiles.clear();
        isAllSelected = false;
        updateSelectAllButtonState();
        renderFiles();
        
        // 清除面包屑导航
        const breadcrumb = document.getElementById('breadcrumb');
        if (breadcrumb) {
            breadcrumb.innerHTML = '';
        }
    } catch (error) {
        showMessage('加载文件列表失败: ' + error.message, 'error');
    }
}

function renderFiles() {
    const fileList = document.getElementById('fileList');
    
    if (files.length === 0) {
        fileList.innerHTML = `
            <div class="empty-state">
                <div class="icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z"/>
                    </svg>
                </div>
                <p>暂无文件，请上传文件</p>
            </div>
        `;
        return;
    }

    fileList.innerHTML = files.map(file => {
        const isDirectory = file.isDirectory;
        const displayName = file.displayName || file.name;
        
        if (isDirectory) {
            return `
                <div class="file-item folder-item" data-filename="${file.name}">
                    <input type="checkbox" class="file-checkbox" onchange="toggleFileSelection('${file.name}')">
                    <div class="file-icon folder-icon">${getFileIcon(displayName)}</div>
                    <div class="file-name" title="${displayName}">${truncateFileName(displayName)}</div>
                    <div class="file-size">文件夹</div>
                    <div class="file-date">${formatDate(file.uploadTime)}</div>
                    <div class="file-actions">
                        <button class="open-btn" onclick="openFolder('${file.name}')">打开</button>
                        <button class="rename-btn" onclick="openRenameModal('${file.name}')">重命名</button>
                        <button class="delete-btn" onclick="deleteFile('${file.name}')">删除</button>
                    </div>
                </div>
            `;
        } else {
            return `
        <div class="file-item" data-filename="${file.name}">
            <input type="checkbox" class="file-checkbox" onchange="toggleFileSelection('${file.name}')">
                    <div class="file-icon">${getFileIcon(displayName)}</div>
                    <div class="file-name" title="${displayName}">${truncateFileName(displayName)}</div>
            <div class="file-size">${formatFileSize(file.size)}</div>
            <div class="file-date">${formatDate(file.uploadTime)}</div>
            <div class="file-actions">
                <button class="download-btn" onclick="downloadFile('${file.name}')">下载</button>
                        <button class="move-btn" onclick="openMoveModal('${file.name}')">移动</button>
                <button class="rename-btn" onclick="openRenameModal('${file.name}')">重命名</button>
                <button class="delete-btn" onclick="deleteFile('${file.name}')">删除</button>
            </div>
        </div>
            `;
        }
    }).join('');
}

function getFileIcon(filename) {
    // 检查是否是文件夹
    if (filename.endsWith('/') || !filename.includes('.')) {
        return '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z"/></svg>';
    }
    
    const ext = filename.split('.').pop().toLowerCase();
    const iconMap = {
        // 图片文件
        'jpg': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M4,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M4,6V18H20V6H4M6,8H18V10H6V8M6,12H16V14H6V12Z"/></svg>',
        'jpeg': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M4,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M4,6V18H20V6H4M6,8H18V10H6V8M6,12H16V14H6V12Z"/></svg>',
        'png': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M4,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M4,6V18H20V6H4M6,8H18V10H6V8M6,12H16V14H6V12Z"/></svg>',
        'gif': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M4,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M4,6V18H20V6H4M6,8H18V10H6V8M6,12H16V14H6V12Z"/></svg>',
        'bmp': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M4,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M4,6V18H20V6H4M6,8H18V10H6V8M6,12H16V14H6V12Z"/></svg>',
        'svg': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M4,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M4,6V18H20V6H4M6,8H18V10H6V8M6,12H16V14H6V12Z"/></svg>',
        'webp': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M4,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M4,6V18H20V6H4M6,8H18V10H6V8M6,12H16V14H6V12Z"/></svg>',
        'ico': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M4,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M4,6V18H20V6H4M6,8H18V10H6V8M6,12H16V14H6V12Z"/></svg>',
        'tiff': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M4,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M4,6V18H20V6H4M6,8H18V10H6V8M6,12H16V14H6V12Z"/></svg>',
        
        // 视频文件
        'mp4': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z"/></svg>',
        'avi': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z"/></svg>',
        'mov': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z"/></svg>',
        'wmv': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z"/></svg>',
        'flv': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z"/></svg>',
        'mkv': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z"/></svg>',
        'webm': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z"/></svg>',
        '3gp': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z"/></svg>',
        
        // 音频文件
        'mp3': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12,3V13.55C11.41,13.21 10.73,13 10,13A4,4 0 0,0 6,17A4,4 0 0,0 10,21A4,4 0 0,0 14,17V7H18V3H12Z"/></svg>',
        'wav': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12,3V13.55C11.41,13.21 10.73,13 10,13A4,4 0 0,0 6,17A4,4 0 0,0 10,21A4,4 0 0,0 14,17V7H18V3H12Z"/></svg>',
        'flac': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12,3V13.55C11.41,13.21 10.73,13 10,13A4,4 0 0,0 6,17A4,4 0 0,0 10,21A4,4 0 0,0 14,17V7H18V3H12Z"/></svg>',
        'aac': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12,3V13.55C11.41,13.21 10.73,13 10,13A4,4 0 0,0 6,17A4,4 0 0,0 10,21A4,4 0 0,0 14,17V7H18V3H12Z"/></svg>',
        'ogg': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12,3V13.55C11.41,13.21 10.73,13 10,13A4,4 0 0,0 6,17A4,4 0 0,0 10,21A4,4 0 0,0 14,17V7H18V3H12Z"/></svg>',
        'm4a': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12,3V13.55C11.41,13.21 10.73,13 10,13A4,4 0 0,0 6,17A4,4 0 0,0 10,21A4,4 0 0,0 14,17V7H18V3H12Z"/></svg>',
        'wma': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12,3V13.55C11.41,13.21 10.73,13 10,13A4,4 0 0,0 6,17A4,4 0 0,0 10,21A4,4 0 0,0 14,17V7H18V3H12Z"/></svg>',
        
        // 文档文件
        'pdf': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'doc': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'docx': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'txt': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'rtf': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'odt': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'pages': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        
        // 表格文件
        'xls': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'xlsx': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'csv': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'ods': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'numbers': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        
        // 演示文稿文件
        'ppt': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'pptx': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'odp': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'key': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        
        // 压缩文件
        'zip': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'rar': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        '7z': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'tar': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'gz': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'bz2': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'xz': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        
        // 可执行文件
        'exe': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/></svg>',
        'msi': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/></svg>',
        'dmg': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/></svg>',
        'deb': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/></svg>',
        'rpm': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/></svg>',
        'apk': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/></svg>',
        'ipa': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/></svg>',
        
        // 编程文件
        'js': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M3,3H21V21H3V3M5,5V19H19V5H5M7,7H17V9H7V7M7,11H17V13H7V11M7,15H15V17H7V15Z"/></svg>',
        'html': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M3,3H21V21H3V3M5,5V19H19V5H5M7,7H17V9H7V7M7,11H17V13H7V11M7,15H15V17H7V15Z"/></svg>',
        'css': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M3,3H21V21H3V3M5,5V19H19V5H5M7,7H17V9H7V7M7,11H17V13H7V11M7,15H15V17H7V15Z"/></svg>',
        'php': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M3,3H21V21H3V3M5,5V19H19V5H5M7,7H17V9H7V7M7,11H17V13H7V11M7,15H15V17H7V15Z"/></svg>',
        'py': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M3,3H21V21H3V3M5,5V19H19V5H5M7,7H17V9H7V7M7,11H17V13H7V11M7,15H15V17H7V15Z"/></svg>',
        'java': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M3,3H21V21H3V3M5,5V19H19V5H5M7,7H17V9H7V7M7,11H17V13H7V11M7,15H15V17H7V15Z"/></svg>',
        'cpp': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M3,3H21V21H3V3M5,5V19H19V5H5M7,7H17V9H7V7M7,11H17V13H7V11M7,15H15V17H7V15Z"/></svg>',
        'c': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M3,3H21V21H3V3M5,5V19H19V5H5M7,7H17V9H7V7M7,11H17V13H7V11M7,15H15V17H7V15Z"/></svg>',
        'h': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M3,3H21V21H3V3M5,5V19H19V5H5M7,7H17V9H7V7M7,11H17V13H7V11M7,15H15V17H7V15Z"/></svg>',
        'hpp': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M3,3H21V21H3V3M5,5V19H19V5H5M7,7H17V9H7V7M7,11H17V13H7V11M7,15H15V17H7V15Z"/></svg>',
        'go': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M3,3H21V21H3V3M5,5V19H19V5H5M7,7H17V9H7V7M7,11H17V13H7V11M7,15H15V17H7V15Z"/></svg>',
        'rs': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M3,3H21V21H3V3M5,5V19H19V5H5M7,7H17V9H7V7M7,11H17V13H7V11M7,15H15V17H7V15Z"/></svg>',
        'swift': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M3,3H21V21H3V3M5,5V19H19V5H5M7,7H17V9H7V7M7,11H17V13H7V11M7,15H15V17H7V15Z"/></svg>',
        'kt': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M3,3H21V21H3V3M5,5V19H19V5H5M7,7H17V9H7V7M7,11H17V13H7V11M7,15H15V17H7V15Z"/></svg>',
        'ts': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M3,3H21V21H3V3M5,5V19H19V5H5M7,7H17V9H7V7M7,11H17V13H7V11M7,15H15V17H7V15Z"/></svg>',
        'jsx': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M3,3H21V21H3V3M5,5V19H19V5H5M7,7H17V9H7V7M7,11H17V13H7V11M7,15H15V17H7V15Z"/></svg>',
        'tsx': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M3,3H21V21H3V3M5,5V19H19V5H5M7,7H17V9H7V7M7,11H17V13H7V11M7,15H15V17H7V15Z"/></svg>',
        'vue': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M3,3H21V21H3V3M5,5V19H19V5H5M7,7H17V9H7V7M7,11H17V13H7V11M7,15H15V17H7V15Z"/></svg>',
        'json': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M3,3H21V21H3V3M5,5V19H19V5H5M7,7H17V9H7V7M7,11H17V13H7V11M7,15H15V17H7V15Z"/></svg>',
        'xml': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M3,3H21V21H3V3M5,5V19H19V5H5M7,7H17V9H7V7M7,11H17V13H7V11M7,15H15V17H7V15Z"/></svg>',
        'yaml': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M3,3H21V21H3V3M5,5V19H19V5H5M7,7H17V9H7V7M7,11H17V13H7V11M7,15H15V17H7V15Z"/></svg>',
        'yml': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M3,3H21V21H3V3M5,5V19H19V5H5M7,7H17V9H7V7M7,11H17V13H7V11M7,15H15V17H7V15Z"/></svg>',
        'sql': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M3,3H21V21H3V3M5,5V19H19V5H5M7,7H17V9H7V7M7,11H17V13H7V11M7,15H15V17H7V15Z"/></svg>',
        'sh': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M3,3H21V21H3V3M5,5V19H19V5H5M7,7H17V9H7V7M7,11H17V13H7V11M7,15H15V17H7V15Z"/></svg>',
        'bat': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M3,3H21V21H3V3M5,5V19H19V5H5M7,7H17V9H7V7M7,11H17V13H7V11M7,15H15V17H7V15Z"/></svg>',
        'ps1': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M3,3H21V21H3V3M5,5V19H19V5H5M7,7H17V9H7V7M7,11H17V13H7V11M7,15H15V17H7V15Z"/></svg>',
        
        // 设计文件
        'psd': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M4,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M4,6V18H20V6H4M6,8H18V10H6V8M6,12H16V14H6V12Z"/></svg>',
        'ai': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M4,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M4,6V18H20V6H4M6,8H18V10H6V8M6,12H16V14H6V12Z"/></svg>',
        'sketch': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M4,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M4,6V18H20V6H4M6,8H18V10H6V8M6,12H16V14H6V12Z"/></svg>',
        'fig': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M4,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M4,6V18H20V6H4M6,8H18V10H6V8M6,12H16V14H6V12Z"/></svg>',
        'xd': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M4,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M4,6V18H20V6H4M6,8H18V10H6V8M6,12H16V14H6V12Z"/></svg>',
        'indd': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M4,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M4,6V18H20V6H4M6,8H18V10H6V8M6,12H16V14H6V12Z"/></svg>',
        'dwg': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M4,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M4,6V18H20V6H4M6,8H18V10H6V8M6,12H16V14H6V12Z"/></svg>',
        'dxf': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M4,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M4,6V18H20V6H4M6,8H18V10H6V8M6,12H16V14H6V12Z"/></svg>',
        
        // 数据库文件
        'db': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12,3C7.58,3 4,4.79 4,7C4,9.21 7.58,11 12,11C16.42,11 20,9.21 20,7C20,4.79 16.42,3 12,3M4,9V12C4,14.21 7.58,16 12,16C16.42,16 20,14.21 20,12V9C20,11.21 16.42,13 12,13C7.58,13 4,11.21 4,9M4,14V17C4,19.21 7.58,21 12,21C16.42,21 20,19.21 20,17V14C20,16.21 16.42,18 12,18C7.58,18 4,16.21 4,14Z"/></svg>',
        'sqlite': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12,3C7.58,3 4,4.79 4,7C4,9.21 7.58,11 12,11C16.42,11 20,9.21 20,7C20,4.79 16.42,3 12,3M4,9V12C4,14.21 7.58,16 12,16C16.42,16 20,14.21 20,12V9C20,11.21 16.42,13 12,13C7.58,13 4,11.21 4,9M4,14V17C4,19.21 7.58,21 12,21C16.42,21 20,19.21 20,17V14C20,16.21 16.42,18 12,18C7.58,18 4,16.21 4,14Z"/></svg>',
        'mdb': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12,3C7.58,3 4,4.79 4,7C4,9.21 7.58,11 12,11C16.42,11 20,9.21 20,7C20,4.79 16.42,3 12,3M4,9V12C4,14.21 7.58,16 12,16C16.42,16 20,14.21 20,12V9C20,11.21 16.42,13 12,13C7.58,13 4,11.21 4,9M4,14V17C4,19.21 7.58,21 12,21C16.42,21 20,19.21 20,17V14C20,16.21 16.42,18 12,18C7.58,18 4,16.21 4,14Z"/></svg>',
        'accdb': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12,3C7.58,3 4,4.79 4,7C4,9.21 7.58,11 12,11C16.42,11 20,9.21 20,7C20,4.79 16.42,3 12,3M4,9V12C4,14.21 7.58,16 12,16C16.42,16 20,14.21 20,12V9C20,11.21 16.42,13 12,13C7.58,13 4,11.21 4,9M4,14V17C4,19.21 7.58,21 12,21C16.42,21 20,19.21 20,17V14C20,16.21 16.42,18 12,18C7.58,18 4,16.21 4,14Z"/></svg>',
        
        // 字体文件
        'ttf': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'otf': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'woff': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'woff2': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'eot': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        
        // 其他文件
        'iso': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/></svg>',
        'bin': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/></svg>',
        'log': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'ini': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'cfg': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'conf': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'env': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'gitignore': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'dockerfile': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'makefile': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'cmake': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'gradle': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'maven': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'pom': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'lock': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z"/></svg>',
        'package': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M5.12,5L12,12L18.88,5H5.12M5.12,19H18.88L12,12L5.12,19Z"/></svg>',
        'requirements': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'readme': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'md': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'markdown': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>'
    };
    return iconMap[ext] || '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>';
}

function truncateFileName(filename) {
    if (filename.length > 20) {
        return filename.substring(0, 17) + '...';
    }
    return filename;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', {hour12: false});
}

function toggleFileSelection(filename) {
    if (selectedFiles.has(filename)) {
        selectedFiles.delete(filename);
    } else {
        selectedFiles.add(filename);
    }
    
    // 更新全选按钮状态
    updateSelectAllButtonState();
    updateFileSelectionUI();
    updateDeleteButton();
}

function updateSelectAllButtonState() {
    const selectAllBtn = document.getElementById('selectAllBtn');
    const selectAllText = document.getElementById('selectAllText');
    
    if (selectedFiles.size === files.length && files.length > 0) {
        // 所有文件都被选中
        isAllSelected = true;
        selectAllText.textContent = '取消全选';
        selectAllBtn.classList.remove('btn-secondary');
        selectAllBtn.classList.add('btn-primary');
    } else {
        // 不是所有文件都被选中
        isAllSelected = false;
        selectAllText.textContent = '全选';
        selectAllBtn.classList.remove('btn-primary');
        selectAllBtn.classList.add('btn-secondary');
    }
}

function updateFileSelectionUI() {
    document.querySelectorAll('.file-item').forEach(item => {
        const filename = item.dataset.filename;
        if (selectedFiles.has(filename)) {
            item.classList.add('selected');
            item.querySelector('.file-checkbox').checked = true;
        } else {
            item.classList.remove('selected');
            item.querySelector('.file-checkbox').checked = false;
        }
    });
}

function updateDeleteButton() {
    const deleteBtn = document.getElementById('deleteBtn');
    deleteBtn.disabled = selectedFiles.size === 0;
}

function toggleSelectAll() {
    const selectAllBtn = document.getElementById('selectAllBtn');
    const selectAllText = document.getElementById('selectAllText');
    
    if (isAllSelected) {
        // 取消全选
        selectedFiles.clear();
        isAllSelected = false;
        selectAllText.textContent = '全选';
        selectAllBtn.classList.remove('btn-primary');
        selectAllBtn.classList.add('btn-secondary');
    } else {
        // 全选
        files.forEach(file => {
            selectedFiles.add(file.name);
        });
        isAllSelected = true;
        selectAllText.textContent = '取消全选';
        selectAllBtn.classList.remove('btn-secondary');
        selectAllBtn.classList.add('btn-primary');
    }
    
    updateFileSelectionUI();
    updateDeleteButton();
}

function deleteSelected() {
    if (selectedFiles.size === 0) return;
    
    if (confirm(`确定要删除选中的 ${selectedFiles.size} 个文件吗？`)) {
        showLoading(true);
        
        const deletePromises = Array.from(selectedFiles).map(filename =>
            fetch(getFileApiPath(filename), addPasswordToHeaders({ method: 'DELETE' }))
        );
        
        Promise.all(deletePromises).then(() => {
            showMessage('选中文件删除成功！', 'success');
            selectedFiles.clear();
            isAllSelected = false;
            updateSelectAllButtonState();
            loadFiles();
        }).catch(error => {
            showMessage('删除失败: ' + error.message, 'error');
        }).finally(() => {
            showLoading(false);
        });
    }
}

async function deleteFile(filename) {
    if (confirm(`确定要删除文件 "${filename}" 吗？`)) {
        try {
            const options = addPasswordToHeaders({
                method: 'DELETE'
            });
            const apiPath = getFileApiPath(filename);
            const response = await fetch(apiPath, options);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error(`服务器返回非JSON响应: ${text.substring(0, 100)}`);
            }

            const result = await response.json();
            showMessage('文件删除成功！', 'success');
            loadFiles();
        } catch (error) {
            showMessage('删除失败: ' + error.message, 'error');
        }
    }
}

async function downloadFile(filename) {
    try {
        const apiPath = getFileApiPath(filename, 'download');
        const options = addPasswordToHeaders();
        
        const response = await fetch(apiPath, options);
        
        if (!response.ok) {
            if (response.status === 401) {
                const data = await response.json();
                if (data.requiresPassword) {
                    isPasswordVerified = false;
                    showPasswordModal();
                    return;
                }
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // 获取文件名用于下载
        const contentDisposition = response.headers.get('Content-Disposition');
        let downloadFilename = filename;
        
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename\*=UTF-8''(.+)/);
            if (filenameMatch) {
                downloadFilename = decodeURIComponent(filenameMatch[1]);
            } else {
                const filenameMatch2 = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch2) {
                    downloadFilename = filenameMatch2[1];
                }
            }
        }
        
        // 创建blob并下载
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = downloadFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
    } catch (error) {
        showMessage('下载失败: ' + error.message, 'error');
    }
}

function openRenameModal(filename) {
    currentRenameFile = filename;
    // 尝试解码Base64编码的文件名用于显示
    let displayName = filename;
    try {
        // 检查是否有扩展名
        const lastDotIndex = filename.lastIndexOf('.');
        let nameWithoutExt, ext;
        
        if (lastDotIndex > 0) {
            // 有扩展名的文件
            nameWithoutExt = filename.substring(0, lastDotIndex);
            ext = filename.substring(lastDotIndex);
        } else {
            // 没有扩展名的文件夹
            nameWithoutExt = filename;
            ext = '';
        }
        
        // 首先检查是否是带时间戳的旧格式
        const parts = nameWithoutExt.split('_');
        if (parts.length >= 2) {
            const encodedName = parts.slice(0, -1).join('_'); // 除了最后的时间戳部分
            // 尝试Base64解码 - 使用正确的UTF-8解码方法
            try {
                const decoded = decodeUTF8Base64(encodedName);
                // 检查解码后是否包含中文字符
                if (/[\u4e00-\u9fa5]/.test(decoded)) {
                    displayName = decoded + ext;
                }
            } catch (e) {
                // Base64解码失败，使用原始文件名
            }
        } else {
            // 没有时间戳的情况，可能是纯Base64编码的文件名（新格式）
            try {
                const decoded = decodeUTF8Base64(nameWithoutExt);
                if (/[\u4e00-\u9fa5]/.test(decoded)) {
                    displayName = decoded + ext;
                }
            } catch (e) {
                // Base64解码失败，使用原始文件名
            }
        }
    } catch (e) {
        displayName = filename;
    }
    document.getElementById('newFileName').value = displayName;
    document.getElementById('renameModal').style.display = 'flex';
    document.getElementById('newFileName').focus();
}

function closeRenameModal() {
    document.getElementById('renameModal').style.display = 'none';
    currentRenameFile = null;
}

async function confirmRename() {
    const newName = document.getElementById('newFileName').value.trim();
    
    if (!newName) {
        showMessage('文件名不能为空', 'error');
        return;
    }
    
    // 解码当前文件名用于比较
    let currentDisplayName = currentRenameFile;
    try {
        // 检查是否有扩展名
        const lastDotIndex = currentRenameFile.lastIndexOf('.');
        let nameWithoutExt, ext;
        
        if (lastDotIndex > 0) {
            // 有扩展名的文件
            nameWithoutExt = currentRenameFile.substring(0, lastDotIndex);
            ext = currentRenameFile.substring(lastDotIndex);
        } else {
            // 没有扩展名的文件夹
            nameWithoutExt = currentRenameFile;
            ext = '';
        }
        
        // 首先检查是否是带时间戳的旧格式
        const parts = nameWithoutExt.split('_');
        if (parts.length >= 2) {
            const encodedName = parts.slice(0, -1).join('_'); // 除了最后的时间戳部分
            // 尝试Base64解码 - 使用正确的UTF-8解码方法
            try {
                const decoded = decodeUTF8Base64(encodedName);
                // 检查解码后是否包含中文字符
                if (/[\u4e00-\u9fa5]/.test(decoded)) {
                    currentDisplayName = decoded + ext;
                }
            } catch (e) {
                // Base64解码失败，使用原始文件名
            }
        } else {
            // 没有时间戳的情况，可能是纯Base64编码的文件名（新格式）
            try {
                const decoded = decodeUTF8Base64(nameWithoutExt);
                if (/[\u4e00-\u9fa5]/.test(decoded)) {
                    currentDisplayName = decoded + ext;
                }
            } catch (e) {
                // Base64解码失败，使用原始文件名
            }
        }
    } catch (e) {
        currentDisplayName = currentRenameFile;
    }
    
    if (newName === currentDisplayName) {
        closeRenameModal();
        return;
    }
    
    try {
        // 直接发送原始文件名，让服务器端处理编码
        const options = addPasswordToHeaders({
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ newName: newName })
        });
        const apiPath = getFileApiPath(currentRenameFile);
        const response = await fetch(apiPath, options);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`服务器返回非JSON响应: ${text.substring(0, 100)}`);
        }

        const result = await response.json();
        showMessage('文件重命名成功！', 'success');
        closeRenameModal();
        loadFiles();
    } catch (error) {
        showMessage('重命名失败: ' + error.message, 'error');
    }
}

function refreshFiles() {
    loadFiles();
}

// 文件夹相关函数
let currentFolder = null;

function openFolder(folderName) {
    currentFolder = folderName;
    loadFolderContents(folderName);
}

function loadFolderContents(folderName) {
    showLoading(true);
    
    const options = addPasswordToHeaders();
    fetch(`/api/folders/${folderName}`, options)
        .then(response => response.json())
        .then(folderFiles => {
            files = folderFiles;
            selectedFiles.clear();
            isAllSelected = false;
            updateSelectAllButtonState();
            renderFiles();
            updateBreadcrumb(folderName);
        })
        .catch(error => {
            showMessage('加载文件夹内容失败: ' + error.message, 'error');
        })
        .finally(() => {
            showLoading(false);
        });
}

// 获取当前文件操作的API路径前缀
function getApiPrefix() {
    return currentFolder ? `/api/folders/${currentFolder}` : '/api';
}

// 获取当前文件操作的API路径
function getFileApiPath(filename, operation = 'files') {
    if (currentFolder) {
        if (operation === 'move') {
            return `/api/folders/${currentFolder}/files/${filename}/move`;
        } else if (operation === 'download') {
            return `/api/folders/${currentFolder}/files/${filename}`;
        } else {
            return `/api/folders/${currentFolder}/${operation}/${filename}`;
        }
    } else {
        if (operation === 'move') {
            return `/api/files/${filename}/move`;
        } else if (operation === 'download') {
            return `/api/download/${filename}`;
        } else {
            return `/api/${operation}/${filename}`;
        }
    }
}

function goBackToRoot() {
    currentFolder = null;
    loadFiles();
}

function goBackToParent() {
    if (currentFolder) {
        goBackToRoot();
    }
}

function updateBreadcrumb(folderName) {
    const breadcrumb = document.getElementById('breadcrumb');
    if (breadcrumb) {
        // 解码文件夹名称用于显示 - 使用正确的UTF-8解码方法
        let displayFolderName = folderName;
        try {
            const decoded = decodeUTF8Base64(folderName);
            if (/[\u4e00-\u9fa5]/.test(decoded)) {
                displayFolderName = decoded;
            }
        } catch (e) {
            // Base64解码失败，使用原始名称
        }
        
        breadcrumb.innerHTML = `
            <span class="breadcrumb-item" onclick="goBackToRoot()">根目录</span>
            <span class="breadcrumb-separator">></span>
            <span class="breadcrumb-item current">${displayFolderName}</span>
        `;
    }
}

function goToRoot() {
    currentFolder = null;
    loadFiles();
    const breadcrumb = document.getElementById('breadcrumb');
    if (breadcrumb) {
        breadcrumb.innerHTML = '<span class="breadcrumb-item current">根目录</span>';
    }
}

function createFolder() {
    const folderName = prompt('请输入文件夹名称:');
    if (!folderName) return;
    
    showLoading(true);
    
    const options = addPasswordToHeaders({
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ folderName: folderName })
    });
    fetch('/api/folders', options)
    .then(response => response.json())
    .then(result => {
        showMessage('文件夹创建成功！', 'success');
        loadFiles();
    })
    .catch(error => {
        showMessage('文件夹创建失败: ' + error.message, 'error');
    })
    .finally(() => {
        showLoading(false);
    });
}

function openMoveModal(filename) {
    currentMoveFile = filename;
    loadFoldersForMove();
    document.getElementById('moveModal').style.display = 'flex';
}

function loadFoldersForMove() {
    const options = addPasswordToHeaders();
    fetch('/api/files', options)
        .then(response => response.json())
        .then(files => {
            const folders = files.filter(file => file.isDirectory);
            const select = document.getElementById('targetFolder');
            select.innerHTML = '<option value="">选择目标文件夹</option>';
            
            // 添加移动到根目录的选项
            const rootOption = document.createElement('option');
            rootOption.value = 'ROOT';
            rootOption.textContent = '根目录';
            select.appendChild(rootOption);
            
            folders.forEach(folder => {
                // 如果当前在文件夹中，不显示当前文件夹
                if (currentFolder && folder.name === currentFolder) {
                    return;
                }
                const option = document.createElement('option');
                option.value = folder.name;
                option.textContent = folder.displayName || folder.name;
                select.appendChild(option);
            });
        })
        .catch(error => {
            showMessage('加载文件夹列表失败: ' + error.message, 'error');
        });
}

function confirmMove() {
    const targetFolder = document.getElementById('targetFolder').value;
    if (!targetFolder) {
        showMessage('请选择目标文件夹', 'error');
        return;
    }
    
    showLoading(true);
    
    const options = addPasswordToHeaders({
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            targetFolder: targetFolder === 'ROOT' ? '' : targetFolder 
        })
    });
    
    const apiPath = getFileApiPath(currentMoveFile, 'move');
    fetch(apiPath, options)
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            return response.text().then(text => {
                throw new Error(`服务器返回非JSON响应: ${text.substring(0, 100)}`);
            });
        }
        
        return response.json();
    })
    .then(result => {
        showMessage('文件移动成功！', 'success');
        closeMoveModal();
        if (currentFolder) {
            loadFolderContents(currentFolder);
        } else {
            loadFiles();
        }
    })
    .catch(error => {
        showMessage('文件移动失败: ' + error.message, 'error');
    })
    .finally(() => {
        showLoading(false);
    });
}

function closeMoveModal() {
    document.getElementById('moveModal').style.display = 'none';
    currentMoveFile = null;
}

function filterFiles() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const fileItems = document.querySelectorAll('.file-item');
    
    fileItems.forEach(item => {
        // 获取显示的文件名而不是原始文件名
        const fileNameElement = item.querySelector('.file-name');
        const displayName = fileNameElement ? fileNameElement.textContent.toLowerCase() : '';
        
        if (displayName.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
}

// 切换服务器日志状态
async function toggleServerLogging() {
    try {
        const response = await fetch('/api/toggle-logging', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            showMessage(data.message, 'success');
        } else {
            showMessage('切换日志状态失败', 'error');
        }
    } catch (error) {
        showMessage('切换日志状态失败: ' + error.message, 'error');
    }
}

function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1002;
        animation: slideIn 0.3s ease;
        ${type === 'success' ? 'background: #27ae60;' : 'background: #e74c3c;'}
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(messageDiv);
        }, 300);
    }, 3000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeRenameModal();
    }
    if (e.key === 'F5') {
        e.preventDefault();
        refreshFiles();
    }
    // Ctrl+R 用于切换日志状态
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        toggleServerLogging();
    }
});
