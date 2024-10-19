document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.querySelector('.start-button');
    const startMenu = document.querySelector('.start-menu');
    const desktop = document.querySelector('.desktop');
    let currentEra = 'windows95';

    startButton.addEventListener('click', () => {
        startMenu.style.display = startMenu.style.display === 'flex' ? 'none' : 'flex';
    });

    document.addEventListener('click', (e) => {
        if (!startButton.contains(e.target) && !startMenu.contains(e.target)) {
            startMenu.style.display = 'none';
        }
    });

    document.querySelectorAll('.icon[data-window], .start-menu a[data-window]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const windowId = item.getAttribute('data-window');
            openWindow(windowId);
            startMenu.style.display = 'none';
        });
    });

    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.window').style.display = 'none';
        });
    });

    // Contact form reason buttons
    const subjectButtons = document.querySelectorAll('.subject-btn');
    const subjectInput = document.getElementById('subject');

    subjectButtons.forEach(button => {
        button.addEventListener('click', () => {
            subjectButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            subjectInput.value = button.getAttribute('data-subject');
        });
    });

    // Contact form submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(event) {
            event.preventDefault();
            console.log('Form submitted:', {
                name: this.name.value,
                email: this.email.value,
                subject: this.subject.value,
                message: this.message.value
            });
            this.reset();
            subjectButtons.forEach(btn => btn.classList.remove('active'));
            alert('Thank you for your message! I will get back to you soon.');
        });
    }

    // Shutdown dialog
    const shutDownOption = document.querySelector('.shut-down-option');
    const shutDownDialog = document.getElementById('shut-down-dialog');

    if (shutDownOption && shutDownDialog) {
        shutDownOption.addEventListener('click', (e) => {
            e.preventDefault();
            shutDownDialog.style.display = 'block';
            startMenu.style.display = 'none';
        });

        shutDownDialog.querySelector('.close-btn').addEventListener('click', () => {
            shutDownDialog.style.display = 'none';
        });

        document.getElementById('shut-down-btn').addEventListener('click', () => {
            alert('Shutting down... (Not really, this is just a simulation!)');
            shutDownDialog.style.display = 'none';
        });

        document.getElementById('cancel-btn').addEventListener('click', () => {
            shutDownDialog.style.display = 'none';
        });
    }

    // Improved draggable windows functionality
    const windows = document.querySelectorAll('.window');
    let isDragging = false;
    let currentWindow = null;
    let initialX, initialY, initialLeft, initialTop;

    windows.forEach(window => {
        const header = window.querySelector('.window-header');
        
        header.addEventListener('mousedown', startDragging);
        header.addEventListener('touchstart', startDragging);

        window.addEventListener('click', () => {
            window.style.zIndex = getHighestZIndex() + 1;
        });
    });

    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag);

    document.addEventListener('mouseup', stopDragging);
    document.addEventListener('touchend', stopDragging);

    document.addEventListener('selectstart', preventSelection);
    document.addEventListener('dragstart', preventDragStart);

    function startDragging(e) {
        isDragging = true;
        currentWindow = this.closest('.window');
        initialX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        initialY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
        initialLeft = currentWindow.offsetLeft;
        initialTop = currentWindow.offsetTop;
        currentWindow.style.zIndex = getHighestZIndex() + 1;
        document.body.style.cursor = 'move';
    }

    function drag(e) {
        if (!isDragging) return;
        
        e.preventDefault();
        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
        
        const dx = clientX - initialX;
        const dy = clientY - initialY;
        
        const newLeft = initialLeft + dx;
        const newTop = initialTop + dy;
        
        const maxX = window.innerWidth - currentWindow.offsetWidth;
        const maxY = window.innerHeight - currentWindow.offsetHeight;
        
        currentWindow.style.left = `${Math.max(0, Math.min(newLeft, maxX))}px`;
        currentWindow.style.top = `${Math.max(0, Math.min(newTop, maxY))}px`;
    }

    function stopDragging() {
        isDragging = false;
        currentWindow = null;
        document.body.style.cursor = 'default';
    }

    function preventSelection(e) {
        if (isDragging) e.preventDefault();
    }

    function preventDragStart(e) {
        if (isDragging) e.preventDefault();
    }

    function updateClock() {
        const now = new Date();
        let hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        const timeString = `${hours}:${minutes} ${ampm}`;
        document.getElementById('clock').textContent = timeString;
    }
    
    updateClock();
    setInterval(updateClock, 1000);

    // initialize layout
    updateLayoutForEra();
});

function openWindow(windowId) {
    if (windowId === 'social') {
        let ieWindow = document.getElementById('ieWindow');
        if (!ieWindow) {
            ieWindow = document.createElement('div');
            ieWindow.id = 'ieWindow';
            ieWindow.className = 'window ie-window';
            const socialPlatform = 'Friendster';
            const socialUrl = 'http://www.friendster.com/samanthac';
            
            ieWindow.innerHTML = `
                <div class="window-header">
                    <div class="window-title">
                        <img src="icons/internetexplorer.png" alt="IE" class="ie-icon">
                        Internet Explorer - ${socialPlatform}
                    </div>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="ie-toolbar">
                    <button class="ie-btn" disabled>Back</button>
                    <button class="ie-btn" disabled>Forward</button>
                    <button class="ie-btn" onclick="refreshFriendster()">Refresh</button>
                    <button class="ie-btn" onclick="refreshFriendster()">Home</button>
                    <input type="text" class="ie-address-bar" value="${socialUrl}" readonly>
                    <button class="ie-btn" onclick="refreshFriendster()">Go</button>
                </div>
                <div class="window-content ie-content">
                    <div class="loading-animation">Loading ${socialPlatform}...</div>
                </div>
            `;
            document.body.appendChild(ieWindow);

            const closeBtn = ieWindow.querySelector('.close-btn');
            closeBtn.onclick = () => ieWindow.style.display = 'none';

            loadFriendsterContent(ieWindow);
        }
        ieWindow.style.display = 'block';
    } else {
        let window = document.getElementById(windowId + 'Window');
        if (window) {
            window.style.display = 'block';
        }
    }
    
    // set the z-index to bring the window to the front
    const openedWindow = document.getElementById(windowId + 'Window') || document.getElementById('ieWindow');
    if (openedWindow) {
        openedWindow.style.zIndex = getHighestZIndex() + 1;
    }
}

function loadFriendsterContent(ieWindow) {
    setTimeout(() => {
        fetch('friendster.html')
            .then(response => response.text())
            .then(html => {
                ieWindow.querySelector('.ie-content').innerHTML = html;
            })
            .catch(error => console.error('Error loading Friendster profile:', error));
    }, 1500);
}

function refreshFriendster() {
    const ieWindow = document.getElementById('ieWindow');
    if (ieWindow) {
        ieWindow.querySelector('.ie-content').innerHTML = '<div class="loading-animation">Loading Friendster...</div>';
        loadFriendsterContent(ieWindow);
    }
}

function getHighestZIndex() {
    return Math.max(
        ...Array.from(document.querySelectorAll('.window'))
            .map(el => parseFloat(window.getComputedStyle(el).zIndex))
            .filter(zIndex => !isNaN(zIndex)),
        0
    );
}

// This function is referenced but not defined in the original code
// You may want to implement it based on your needs
function updateLayoutForEra() {
    // Implementation depends on how you want to handle different eras
    console.log('Updating layout for era:', currentEra);
}