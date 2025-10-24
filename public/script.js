let files = [];
let selectedFiles = new Set();
let currentRenameFile = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
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

    showLoading(true);

    try {
        const formData = new FormData();
        for (let file of fileList) {
            formData.append('file', file);
        }

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

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
        loadFiles();
    } catch (error) {
        showMessage('上传失败: ' + error.message, 'error');
    } finally {
        showLoading(false);
        document.getElementById('fileInput').value = '';
    }
}

async function loadFiles() {
    try {
        const response = await fetch('/api/files');
        
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
        renderFiles();
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

    fileList.innerHTML = files.map(file => `
        <div class="file-item" data-filename="${file.name}">
            <input type="checkbox" class="file-checkbox" onchange="toggleFileSelection('${file.name}')">
            <div class="file-icon">${getFileIcon(file.name)}</div>
            <div class="file-name" title="${file.name}">${truncateFileName(file.name)}</div>
            <div class="file-size">${formatFileSize(file.size)}</div>
            <div class="file-date">${formatDate(file.uploadTime)}</div>
            <div class="file-actions">
                <button class="download-btn" onclick="downloadFile('${file.name}')">下载</button>
                <button class="rename-btn" onclick="openRenameModal('${file.name}')">重命名</button>
                <button class="delete-btn" onclick="deleteFile('${file.name}')">删除</button>
            </div>
        </div>
    `).join('');
}

function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const iconMap = {
        'jpg': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M4,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M4,6V18H20V6H4M6,8H18V10H6V8M6,12H16V14H6V12Z"/></svg>',
        'jpeg': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M4,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M4,6V18H20V6H4M6,8H18V10H6V8M6,12H16V14H6V12Z"/></svg>',
        'png': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M4,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M4,6V18H20V6H4M6,8H18V10H6V8M6,12H16V14H6V12Z"/></svg>',
        'gif': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M4,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M4,6V18H20V6H4M6,8H18V10H6V8M6,12H16V14H6V12Z"/></svg>',
        'bmp': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M4,4H20A2,2 0 0,1 22,6V18A2,2 0 0,1 20,20H4A2,2 0 0,1 2,18V6A2,2 0 0,1 4,4M4,6V18H20V6H4M6,8H18V10H6V8M6,12H16V14H6V12Z"/></svg>',
        'mp4': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z"/></svg>',
        'avi': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z"/></svg>',
        'mov': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z"/></svg>',
        'wmv': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z"/></svg>',
        'flv': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M17,10.5V7A1,1 0 0,0 16,6H4A1,1 0 0,0 3,7V17A1,1 0 0,0 4,18H16A1,1 0 0,0 17,17V13.5L21,17.5V6.5L17,10.5Z"/></svg>',
        'mp3': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12,3V13.55C11.41,13.21 10.73,13 10,13A4,4 0 0,0 6,17A4,4 0 0,0 10,21A4,4 0 0,0 14,17V7H18V3H12Z"/></svg>',
        'wav': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12,3V13.55C11.41,13.21 10.73,13 10,13A4,4 0 0,0 6,17A4,4 0 0,0 10,21A4,4 0 0,0 14,17V7H18V3H12Z"/></svg>',
        'flac': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12,3V13.55C11.41,13.21 10.73,13 10,13A4,4 0 0,0 6,17A4,4 0 0,0 10,21A4,4 0 0,0 14,17V7H18V3H12Z"/></svg>',
        'aac': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12,3V13.55C11.41,13.21 10.73,13 10,13A4,4 0 0,0 6,17A4,4 0 0,0 10,21A4,4 0 0,0 14,17V7H18V3H12Z"/></svg>',
        'pdf': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'doc': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'docx': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'txt': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'zip': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'rar': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        '7z': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'tar': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'exe': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/></svg>',
        'msi': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"/></svg>',
        'xls': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'xlsx': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'csv': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'ppt': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
        'pptx': '<svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>'
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
    
    updateFileSelectionUI();
    updateDeleteButton();
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

function deleteSelected() {
    if (selectedFiles.size === 0) return;
    
    if (confirm(`确定要删除选中的 ${selectedFiles.size} 个文件吗？`)) {
        showLoading(true);
        
        const deletePromises = Array.from(selectedFiles).map(filename => 
            fetch(`/api/files/${filename}`, { method: 'DELETE' })
        );
        
        Promise.all(deletePromises).then(() => {
            showMessage('选中文件删除成功！', 'success');
            selectedFiles.clear();
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
            const response = await fetch(`/api/files/${filename}`, {
                method: 'DELETE'
            });
            
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

function downloadFile(filename) {
    window.open(`/api/download/${filename}`, '_blank');
}

function openRenameModal(filename) {
    currentRenameFile = filename;
    document.getElementById('newFileName').value = filename;
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
    
    if (newName === currentRenameFile) {
        closeRenameModal();
        return;
    }
    
    try {
        const response = await fetch(`/api/files/${currentRenameFile}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ newName: newName })
        });
        
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

function filterFiles() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const fileItems = document.querySelectorAll('.file-item');
    
    fileItems.forEach(item => {
        const filename = item.dataset.filename.toLowerCase();
        if (filename.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
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
    if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
        e.preventDefault();
        refreshFiles();
    }
});
