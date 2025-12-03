const markdownInput = document.getElementById('markdownInput');
const previewContent = document.getElementById('previewContent');
const uploadBtn = document.getElementById('uploadBtn');
const downloadBtn = document.getElementById('downloadBtn');
const fileInput = document.getElementById('fileInput');
const notification = document.getElementById('notification');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

let imagesData = {};
let slides = [];
let currentSlide = 0;

const defaultMarkdown = `# Presentation Title

Welcome to the Markdown editor

---

## Slide 2

- Point 1
- Point 2
- Point 3

---

## Slide 3

Content with **bold** and *italic*

---

## Slide 4

\`\`\`javascript
const hello = () => {
  console.log("Hello World");
};
\`\`\``;

markdownInput.value = defaultMarkdown;
renderPreview();

markdownInput.addEventListener('input', renderPreview);

uploadBtn.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

function handleFile(file) {
    if (file.name.endsWith('.md')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            markdownInput.value = e.target.result;
            renderPreview();
            showNotification('File loaded', 'success');
        };
        reader.readAsText(file);
    } else if (file.name.endsWith('.zip')) {
        handleZipFile(file);
    } else {
        showNotification('Format not supported', 'error');
    }
}

function handleZipFile(file) {
    JSZip.loadAsync(file).then((zip) => {
        let mdFile = null;
        for (const filename in zip.files) {
            if (filename.endsWith('.md')) {
                mdFile = filename;
                break;
            }
        }

        if (!mdFile) {
            showNotification('No .md file found in ZIP', 'error');
            return;
        }

        zip.file(mdFile).async('text').then((content) => {
            markdownInput.value = content;
            
            imagesData = {};
            const imagePromises = [];
            
            for (const filename in zip.files) {
                if (filename.match(/\.(png|jpg|jpeg|gif|svg)$/i) && !zip.files[filename].dir) {
                    imagePromises.push(
                        zip.file(filename).async('arraybuffer').then((data) => {
                            const blob = new Blob([data], { type: 'image/png' });
                            const reader = new FileReader();
                            reader.onload = (e) => {
                                const name = filename.split('/').pop();
                                imagesData[name] = e.target.result;
                            };
                            reader.readAsDataURL(blob);
                        })
                    );
                }
            }
            
            Promise.all(imagePromises).then(() => {
                renderPreview();
                showNotification('File loaded', 'success');
            });
        });
    }).catch(() => {
        showNotification('Error reading ZIP', 'error');
    });
}

function markdownToHtml(text) {
    let html = text;
    
    html = html.replace(/```[\s\S]*?\n([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
    
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');
    
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    
    // CORRECTION: Regex correcte pour les images Markdown
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, function(match, alt, src) {
        const filename = src.split('/').pop();
        const imageSrc = imagesData[filename] || src;
        return '<img src="' + imageSrc + '" alt="' + alt + '">';
    });
    
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    html = html.replace(/^\- (.*?)$/gm, '<li>$1</li>');
    
    const lines = html.split('\n');
    let result = [];
    let inList = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('<li>')) {
            if (!inList) {
                result.push('<ul>');
                inList = true;
            }
            result.push(line);
        } else {
            if (inList) {
                result.push('</ul>');
                inList = false;
            }
            if (line && !line.startsWith('<')) {
                result.push('<p>' + line + '</p>');
            } else if (line.startsWith('<')) {
                result.push(line);
            }
        }
    }
    if (inList) {
        result.push('</ul>');
    }
    
    return result.join('');
}

function renderPreview() {
    const markdown = markdownInput.value;
    const slidesArray = markdown.split('---');
    
    slides = slidesArray.map(slideContent => {
        return markdownToHtml(slideContent.trim());
    });

    currentSlide = 0;
    if (slides.length > 0) {
        displaySlide();
    }
}

function displaySlide() {
    previewContent.innerHTML = '<div class="slide">' + slides[currentSlide] + '</div>';
    
    document.getElementById('currentSlide').textContent = currentSlide + 1;
    document.getElementById('totalSlides').textContent = slides.length;
    
    prevBtn.disabled = currentSlide === 0;
    nextBtn.disabled = currentSlide === slides.length - 1;
}

prevBtn.addEventListener('click', () => {
    if (currentSlide > 0) {
        currentSlide--;
        displaySlide();
    }
});

nextBtn.addEventListener('click', () => {
    if (currentSlide < slides.length - 1) {
        currentSlide++;
        displaySlide();
    }
});

downloadBtn.addEventListener('click', () => {
    const markdown = markdownInput.value;
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/markdown;charset=utf-8,' + encodeURIComponent(markdown));
    element.setAttribute('download', 'presentation.md');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    showNotification('File downloaded', 'success');
});

function showNotification(message, type) {
    notification.textContent = message;
    notification.className = 'notification ' + type + ' show';
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}