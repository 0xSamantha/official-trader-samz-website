document.addEventListener('DOMContentLoaded', () => {
    // core UI elements
    const startButton = document.querySelector('.start-button');
    const startMenu = document.querySelector('.start-menu');
    const desktop = document.querySelector('.desktop');
    const windows = document.querySelectorAll('.window');
    let currentEra = 'windows95';
    let isDragging = false;
    let currentWindow = null;
    let initialX, initialY, initialLeft, initialTop;

    // start menu handling
    function handleStartMenu(e) {
        if (e.target.closest('.start-button')) {
            startMenu.style.display = startMenu.style.display === 'flex' ? 'none' : 'flex';
        } else if (!e.target.closest('.start-menu')) {
            startMenu.style.display = 'none';
        }
    }

    // window management
    function handleWindowClick(e) {
        const window = e.target.closest('.window');
        if (window) {
            window.style.zIndex = getHighestZIndex() + 1;
        }
    }

    function handleCloseButton(e) {
        // Look for both the window close button and subwindow close button
        const closeButton = e.target.closest('.close-btn, .close-subwindow');
        if (closeButton) {
            // If it's a window close button
            const window = closeButton.closest('.window');
            if (window) {
                window.style.display = 'none';
                return;
            }
            // If it's a subwindow close button
            const subwindow = closeButton.closest('.subwindow');
            if (subwindow) {
                subwindow.style.display = 'none';
            }
        }
    }

    // dragging functionality
    function startDragging(e) {
        // Change this line
        if (!e.target.closest('.title-bar')) return;
        
        isDragging = true;
        currentWindow = e.target.closest('.window');
        initialX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        initialY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
        
        const viewportWidth = document.documentElement.clientWidth;
        
        // if the window is centered (transform applied)
        if (currentWindow.style.transform.includes('translate')) {
            currentWindow.style.transform = 'none';
            currentWindow.style.left = `${viewportWidth / 2 - currentWindow.offsetWidth / 2}px`;
            currentWindow.style.top = `${window.innerHeight / 2 - currentWindow.offsetHeight / 2}px`;
        }
        
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
        
        const viewportWidth = document.documentElement.clientWidth;
        const viewportHeight = document.documentElement.clientHeight;
        
        const maxX = viewportWidth - currentWindow.offsetWidth;
        const maxY = viewportHeight - currentWindow.offsetHeight;
    
        // mobile
        if (viewportWidth <= 768) {
            // center if dragged too far on mobile
            if (newLeft < 0 || newLeft > maxX || newTop < 0 || newTop > maxY) {
                currentWindow.style.left = '50%';
                currentWindow.style.top = '50%';
                currentWindow.style.transform = 'translate(-50%, -50%)';
            } else {
                currentWindow.style.transform = 'none';
                currentWindow.style.left = `${newLeft}px`;
                currentWindow.style.top = `${newTop}px`;
            }
        } else {
            // normal dragging behavior for desktop
            currentWindow.style.left = `${Math.max(0, Math.min(newLeft, maxX))}px`;
            currentWindow.style.top = `${Math.max(0, Math.min(newTop, maxY))}px`;
        }
    }
    
    function stopDragging() {
        isDragging = false;
        currentWindow = null;
        document.body.style.cursor = 'default';
    }

    // Window Opening
    function openWindow(windowId) {
        if (windowId === 'social') {
            openSocialWindow();
        } else {
            openRegularWindow(windowId);
        }
    }

    function openSocialWindow() {
        let ieWindow = document.getElementById('ieWindow');
        if (!ieWindow) {
            ieWindow = createIEWindow();
            const viewportWidth = document.documentElement.clientWidth;
            
            if (viewportWidth <= 768) {
                // Center on mobile
                ieWindow.style.left = '50%';
                ieWindow.style.top = '50%';
                ieWindow.style.transform = 'translate(-50%, -50%)';
            } else {
                // Position on desktop
                ieWindow.style.left = `${50 + Math.random() * 100}px`;
                ieWindow.style.top = `${50 + Math.random() * 100}px`;
            }
            
            document.body.appendChild(ieWindow);
            loadFriendsterContent(ieWindow);
        }
        ieWindow.style.display = 'block';
        ieWindow.style.zIndex = getHighestZIndex() + 1;
    }

    function createIEWindow() {
        // copying template
        const template = document.getElementById('ieWindowTemplate');
        const ieWindow = template.firstElementChild.cloneNode(true);
        ieWindow.id = 'ieWindow';
        return ieWindow;
    }

    function openRegularWindow(windowId) {
        const window = document.getElementById(windowId + 'Window');
        if (window) {
            // Check if window position needs to be set
            if (!window.style.left && !window.style.top) {
                const viewportWidth = document.documentElement.clientWidth;
                
                if (viewportWidth <= 768) {
                    // Center on mobile
                    window.style.left = '50%';
                    window.style.top = '50%';
                    window.style.transform = 'translate(-50%, -50%)';
                } else {
                    // Cascade windows on desktop
                    const offset = Array.from(document.querySelectorAll('.window'))
                        .filter(w => w.style.display === 'block')
                        .length * 20;
                    window.style.left = `${50 + offset}px`;
                    window.style.top = `${50 + offset}px`;
                }
            }
            
            window.style.display = 'block';
            window.style.zIndex = getHighestZIndex() + 1;
        }
    }

    // Content Loading
    function loadFriendsterContent(ieWindow) {
        ieWindow.querySelector('.ie-content').innerHTML = 
            '<div class="loading-animation">Loading Friendster...</div>';
        setTimeout(() => {
            const friendsterContent = document.getElementById('friendsterContent');
            if (!friendsterContent) {
                console.error('Friendster content not found');
                return;
            }
            ieWindow.querySelector('.ie-content').innerHTML = friendsterContent.innerHTML;
        }, 1500);
    }

    function setupSystemTabs() {
        const tabs = document.querySelectorAll('#aboutWindow [role="tab"]');
        const panels = document.querySelectorAll('#aboutWindow [role="tabpanel"]');
      
        function switchTab(oldTab, newTab) {
          newTab.focus();
          newTab.setAttribute('aria-selected', 'true');
          oldTab.setAttribute('aria-selected', 'false');
          oldTab.blur();
          
          let newPanelId = newTab.querySelector('a').getAttribute('href').substring(1);
          panels.forEach(panel => {
            if (panel.id === newPanelId) {
              panel.style.display = 'block';
            } else {
              panel.style.display = 'none';
            }
          });
        }
      
        tabs.forEach(tab => {
          tab.addEventListener('click', e => {
            e.preventDefault();
            let currentTab = document.querySelector('[role="tab"][aria-selected="true"]');
            if (e.currentTarget !== currentTab) {
              switchTab(currentTab, e.currentTarget);
            }
          });
        });
      
        // Add keyboard navigation
        tabs.forEach(tab => {
          tab.addEventListener('keydown', e => {
            let targetTab = e.currentTarget;
            let currentTab = document.querySelector('[role="tab"][aria-selected="true"]');
            
            let tabArray = Array.from(tabs);
            let index = tabArray.indexOf(targetTab);
            
            let newTab;
            if (e.key === 'ArrowRight') {
              newTab = tabArray[index + 1] || tabArray[0];
            } else if (e.key === 'ArrowLeft') {
              newTab = tabArray[index - 1] || tabArray[tabArray.length - 1];
            } else {
              return;
            }
            
            switchTab(currentTab, newTab);
            e.preventDefault();
          });
        });
      }
    
    // Clock Update
    function updateClock() {
        const now = new Date();
        let hours = now.getHours() % 12 || 12;
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
        document.getElementById('clock').textContent = `${hours}:${minutes} ${ampm}`;
    }

    // Utility Functions
    function getHighestZIndex() {
        return Math.max(
            ...Array.from(document.querySelectorAll('.window'))
                .map(el => parseFloat(window.getComputedStyle(el).zIndex))
                .filter(zIndex => !isNaN(zIndex)),
            0
        );
    }

    function setupSubWindowListeners() {
        // Handle opening subwindows
        document.querySelectorAll('.icon[data-subwindow]').forEach(icon => {
            icon.addEventListener('click', () => {
                const subwindowId = icon.getAttribute('data-subwindow');
                const subwindow = document.getElementById(`${subwindowId}-subwindow`);
                if (subwindow) {
                    subwindow.style.display = 'block';
                    subwindow.style.zIndex = getHighestZIndex() + 1;
                }
            });
        });
    
        // Handle closing subwindows
        document.querySelectorAll('.close-subwindow').forEach(button => {
            button.addEventListener('click', () => {
                const subwindow = button.closest('.subwindow');
                if (subwindow) {
                    subwindow.style.display = 'none';
                }
            });
        });
    }

    // Shut Down Dialog Setup
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
            alert('shutting down... (not really, but i love you!)');
            shutDownDialog.style.display = 'none';
        });

        document.getElementById('cancel-btn').addEventListener('click', () => {
            shutDownDialog.style.display = 'none';
        });
    }

    // Contact Form Subject Buttons
    const subjectButtons = document.querySelectorAll('.subject-btn');
    const reasonInput = document.getElementById('reason');

    subjectButtons.forEach(button => {
        button.addEventListener('click', () => {
            subjectButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            reasonInput.value = button.getAttribute('data-reason');
        });
    });

    // Event Listeners
    document.addEventListener('click', handleStartMenu);
    document.addEventListener('click', handleWindowClick);
    document.addEventListener('click', handleCloseButton);
    
    document.addEventListener('mousedown', startDragging);
    document.addEventListener('touchstart', startDragging);
    
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag);
    
    document.addEventListener('mouseup', stopDragging);
    document.addEventListener('touchend', stopDragging);
    
    document.addEventListener('selectstart', e => isDragging && e.preventDefault());
    document.addEventListener('dragstart', e => isDragging && e.preventDefault());

    // Initialize clock
    updateClock();
    const clockInterval = setInterval(updateClock, 1000);

    // Setup window opening from icons and start menu
    document.querySelectorAll('.icon[data-window], .start-menu a[data-window]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const windowId = item.getAttribute('data-window');
            openWindow(windowId);
            startMenu.style.display = 'none';
        });
    });

    // Setup subwindow listeners
    setupSubWindowListeners();

    // Clean up on page unload
    window.addEventListener('unload', () => {
        clearInterval(clockInterval);
        document.removeEventListener('click', handleStartMenu);
        document.removeEventListener('click', handleWindowClick);
        document.removeEventListener('click', handleCloseButton);
        document.removeEventListener('mousedown', startDragging);
        document.removeEventListener('touchstart', startDragging);
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('touchmove', drag);
        document.removeEventListener('mouseup', stopDragging);
        document.removeEventListener('touchend', stopDragging);
    });

    // Initialize layout
    updateLayoutForEra();
    setupSystemTabs();
});

// Global functions needed for HTML onclick handlers
window.refreshFriendster = function() {
    const ieWindow = document.getElementById('ieWindow');
    if (ieWindow) {
        ieWindow.querySelector('.ie-content').innerHTML = 
            '<div class="loading-animation">Loading Friendster...</div>';
        setTimeout(() => {
            const friendsterContent = document.getElementById('friendsterContent').innerHTML;
            ieWindow.querySelector('.ie-content').innerHTML = friendsterContent;
        }, 1500);
    }
};
