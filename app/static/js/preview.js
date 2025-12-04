const slidesContainer = document.getElementById('slidesContainer');
const mainContainer = document.getElementById('mainContainer');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const fileInput = document.getElementById('fileInput');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const sidebar = document.getElementById('sidebar');
const slideList = document.getElementById('slideList');
const toggleSidebarHeader = document.getElementById('toggleSidebarHeader');
const closeSidebarBtn = document.getElementById('closeSidebarBtn');
const header = document.getElementById('header');
const controls = document.getElementById('controls');

let imagesData = {};
let slides = [];
let slideTitles = [];
let currentSlide = 0;
let isFullscreen = false;
let sidebarVisible = true;
let mouseTimer = null;
let cursorTimer = null;

// Toggle sidebar with button in header
toggleSidebarHeader.addEventListener('click', () => {
    if (sidebar.classList.contains('hidden')) {
        sidebar.classList.remove('hidden');
        sidebarVisible = true;
    } else {
        sidebar.classList.add('hidden');
        sidebarVisible = false;
    }
});

closeSidebarBtn.addEventListener('click', () => {
    sidebar.classList.add('hidden');
    sidebarVisible = false;
});

// Mouse movement management in fullscreen
document.addEventListener('mousemove', () => {
    if (isFullscreen) {
        // Show elements and cursor
        document.body.classList.remove('hide-cursor');
        header.classList.add('show');
        controls.classList.add('show');
        
        // Reset timers
        clearTimeout(mouseTimer);
        clearTimeout(cursorTimer);
        
        // Hide after 2 seconds of inactivity
        mouseTimer = setTimeout(() => {
            header.classList.remove('show');
            controls.classList.remove('show');
        }, 2000);

        // Hide cursor after 3 seconds
        cursorTimer = setTimeout(() => {
            document.body.classList.add('hide-cursor');
        }, 3000);
    }
});

// Drag and drop to load file
document.addEventListener('dragover', (e) => {
    e.preventDefault();
    const emptyState = document.querySelector('.empty-state');
    if (emptyState) {
        emptyState.classList.add('dragover');
    }
});

document.addEventListener('dragleave', (e) => {
    if (e.target === document.body || e.target === document.documentElement) {
        const emptyState = document.querySelector('.empty-state');
        if (emptyState) {
            emptyState.classList.remove('dragover');
        }
    }
});

document.addEventListener('drop', (e) => {
    e.preventDefault();
    const emptyState = document.querySelector('.empty-state');
    if (emptyState) {
        emptyState.classList.remove('dragover');
    }
    if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

fullscreenBtn.addEventListener('click', () => {
    if (!isFullscreen) {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
});

document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
document.addEventListener('mozfullscreenchange', handleFullscreenChange);
document.addEventListener('msfullscreenchange', handleFullscreenChange);

function handleFullscreenChange() {
    const isCurrentlyFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || 
        document.mozFullScreenElement || document.msFullscreenElement);
    
    if (isCurrentlyFullscreen) {
        isFullscreen = true;
        fullscreenBtn.innerHTML = '<span>\u26f6</span><span>Exit Fullscreen</span>';
        document.body.classList.add('fullscreen-mode');
    } else {
        isFullscreen = false;
        fullscreenBtn.innerHTML = '<span>\u26f6</span><span>Fullscreen</span>';
        document.body.classList.remove('fullscreen-mode');
        document.body.classList.remove('hide-cursor');
        header.classList.remove('show');
        controls.classList.remove('show');
        clearTimeout(mouseTimer);
        clearTimeout(cursorTimer);
    }
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (!slides.length) return;
    if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        if (currentSlide < slides.length - 1) {
            currentSlide++;
            displaySlide();
        }
    } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentSlide > 0) {
            currentSlide--;
            displaySlide();
        }
    }
});

function handleFile(file) {
    if (file.name.endsWith('.md')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            renderSlides(e.target.result);
            showNotification('File loaded successfully', 'success');
        };
        reader.readAsText(file);
    } else if (file.name.endsWith('.zip')) {
        handleZipFile(file);
    } else {
        showNotification('Unsupported format', 'error');
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
            imagesData = {};
            const imagePromises = [];
            
            for (const filename in zip.files) {
                if (filename.match(/\.(png|jpg|jpeg|gif|svg)$/i) && !zip.files[filename].dir) {
                    imagePromises.push(
                        zip.file(filename).async('arraybuffer').then((data) => {
                            const blob = new Blob([data]);
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
                renderSlides(content);
                showNotification('Presentation loaded', 'success');
            });
        });
    }).catch(() => {
        showNotification('Error reading ZIP file', 'error');
    });
}

function extractTitle(markdown) {
    const h1Match = markdown.match(/^#\s+(.+)$/m);
    if (h1Match) return h1Match[1];
    
    const h2Match = markdown.match(/^##\s+(.+)$/m);
    if (h2Match) return h2Match[1];
    
    const h3Match = markdown.match(/^###\s+(.+)$/m);
    if (h3Match) return h3Match[1];
    
    const lines = markdown.split('\n');
    for (let line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('```') && !trimmed.startsWith('!')) {
            return trimmed.substring(0, 50) + (trimmed.length > 50 ? '...' : '');
        }
    }
    
    return 'Untitled';
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
    
    // Images first (before links, as they start with !)
    // Syntax: ![alt text](path/to/image.png) or ![alt text](path/to/image.png){width=300px;center}
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)(\{[^}]*\})?/g, function(match, alt, src, attrs) {
        const filename = src.split('/').pop();
        const imageSrc = imagesData[filename] || src;
        let style = '';
        let isCenter = false;
        
        // Clean alt text
        const cleanAlt = (alt || '').trim() || 'image';
        
        // Parse style attributes
        if (attrs) {
            const attrStr = attrs.slice(1, -1); // Remove curly braces
            const parts = attrStr.split(';').filter(p => p.trim());
            parts.forEach(part => {
                part = part.trim();
                if (part === 'center') {
                    isCenter = true;
                } else if (part.includes('=')) {
                    const [key, value] = part.split('=').map(s => s.trim());
                    if (key === 'width' || key === 'height') {
                        style += `${key}: ${value}; `;
                    }
                }
            });
        }
        
        const styleAttr = style ? ` style="${style}"` : '';
        const img = `<img src="${imageSrc}" alt="${cleanAlt}"${styleAttr}>`;
        
        // Wrapper with centered div if requested
        if (isCenter) {
            return `<div style="display: flex; justify-content: center; margin: 12px 0;"><div>${img}</div></div>`;
        }
        return img;
    });
    
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    
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

function renderSlides(markdown) {
    const slidesArray = markdown.split('---');
    
    slideTitles = [];
    slides = slidesArray.map(slideContent => {
        const trimmed = slideContent.trim();
        slideTitles.push(extractTitle(trimmed));
        return markdownToHtml(trimmed);
    });

    currentSlide = 0;
    if (slides.length > 0) {
        buildSlideList();
        displaySlide();
    }
}

function buildSlideList() {
    slideList.innerHTML = '';
    
    slides.forEach((slide, index) => {
        const li = document.createElement('li');
        li.className = 'slide-item';
        if (index === currentSlide) {
            li.classList.add('active');
        }
        
        li.innerHTML = `
            <span class="slide-number">${index + 1}</span>
            <span class="slide-title">${slideTitles[index]}</span>
        `;
        
        li.addEventListener('click', () => {
            currentSlide = index;
            displaySlide();
        });
        
        slideList.appendChild(li);
    });
}

function updateSlideListActive() {
    const items = slideList.querySelectorAll('.slide-item');
    items.forEach((item, index) => {
        if (index === currentSlide) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

function displaySlide() {
    slidesContainer.innerHTML = '<div class="slide">' + slides[currentSlide] + '</div>';
    
    document.getElementById('currentSlide').textContent = currentSlide + 1;
    document.getElementById('totalSlides').textContent = slides.length;
    
    prevBtn.disabled = currentSlide === 0;
    nextBtn.disabled = currentSlide === slides.length - 1;
    
    updateSlideListActive();
    
    slidesContainer.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
    });
}

function showEmptyState() {
    slidesContainer.innerHTML = `
        <div class="empty-state" id="emptyState">
            <h2>📁 Drop a file here</h2>
            <p>Supported formats: .md or .zip (with images)</p>
            <button class="btn-primary" id="loadFileBtn">
                <span>📂</span>
                <span>Choose a file</span>
            </button>
        </div>
    `;
    
    slideList.innerHTML = '';
    
    document.getElementById('currentSlide').textContent = '0';
    document.getElementById('totalSlides').textContent = '0';
    prevBtn.disabled = true;
    nextBtn.disabled = true;

    document.getElementById('loadFileBtn').addEventListener('click', () => {
        fileInput.click();
    });
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

showEmptyState();