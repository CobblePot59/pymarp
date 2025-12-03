const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');

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
    if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
    }
});

uploadArea.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

function handleFile(file) {
    if (!file.name.endsWith('.pptx')) {
        showNotification('Only PPTX files are accepted', 'error');
        return;
    }
    convertFile(file);
}

function convertFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    uploadArea.style.opacity = '0.5';
    uploadArea.style.pointerEvents = 'none';
    showNotification('Converting...', 'loading');

    fetch('/api/convert', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.error || 'Error during conversion');
            });
        }
        return response.blob();
    })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name.replace('.pptx', '.zip');
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showNotification('File downloaded successfully', 'success');
        uploadArea.style.opacity = '1';
        uploadArea.style.pointerEvents = 'auto';
        fileInput.value = '';
    })
    .catch(error => {
        showNotification(error.message, 'error');
        uploadArea.style.opacity = '1';
        uploadArea.style.pointerEvents = 'auto';
    });
}