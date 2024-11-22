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
        const closeButton = e.target.closest('.close-btn, .close-subwindow');
        if (!closeButton) return;
    
        e.preventDefault();
        e.stopPropagation();
        
        const window = closeButton.closest('.window');
        if (window) {
            window.style.display = 'none';
        }
    }

    // dragging functionality
    function startDragging(e) {
        if (!e.target.closest('.title-bar')) return;
        
        isDragging = true;
        currentWindow = e.target.closest('.window');
        initialX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        initialY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
        
        const viewportWidth = document.documentElement.clientWidth;
        
        // if the window is centered (transform applied)
        if (currentWindow.style.transform && currentWindow.style.transform.includes('translate')) {
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
        } else if (windowId === 'game') {
            openGameWindow();
        } else if (windowId === 'crypto') {
            openCryptoWindow();
        } else {
            openRegularWindow(windowId);
        }
    }
    
    function openGameWindow() {
        const gameWindow = document.getElementById('gameWindow');
        if (gameWindow) {
            gameWindow.style.display = 'block';
            gameWindow.style.zIndex = getHighestZIndex() + 1;
            
            if (document.documentElement.clientWidth <= 768) {
                gameWindow.style.position = 'fixed';
                gameWindow.style.top = '50%';
                gameWindow.style.left = '50%';
                gameWindow.style.transform = 'translate(-50%, -50%)';
            }
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
        const template = document.getElementById('ieWindowTemplate');
        if (!template) return null;
        const ieWindow = template.firstElementChild.cloneNode(true);
        ieWindow.id = 'ieWindow';
        return ieWindow;
    }

    function openRegularWindow(windowId) {
        const window = document.getElementById(windowId + 'Window');
        if (window) {
            window.style.cssText = '';
            window.style.display = 'block';
            window.style.zIndex = getHighestZIndex() + 1;
            
            if (document.documentElement.clientWidth <= 768) {
                window.style.position = 'fixed';
                window.style.top = '50%';
                window.style.left = '50%';
                window.style.transform = 'translate(-50%, -50%)';
            }
            
            if (windowId === 'about') {
                setupSystemTabs();
            }
        }
    }

    // crypto loading 
    document.body.addEventListener('click', function(e) {
        if (e.target.matches('.refresh-btn')) {
            refreshPrices();
        }
    });

    // content loading
    function loadFriendsterContent(ieWindow) {
        if (!ieWindow) return;
        const contentDiv = ieWindow.querySelector('.ie-content');
        if (!contentDiv) return;
        
        contentDiv.innerHTML = '<div class="loading-animation">Loading Friendster...</div>';
        setTimeout(() => {
            const friendsterContent = document.getElementById('friendsterContent');
            if (!friendsterContent) {
                console.error('Friendster content not found');
                return;
            }
            contentDiv.innerHTML = friendsterContent.innerHTML;
        }, 1500);
    }

    function setupSystemTabs() {
        const aboutWindow = document.getElementById('aboutWindow');
        if (!aboutWindow) return;

        const tabList = aboutWindow.querySelector('.window-body');
        if (!tabList) return;
    
        const tabs = Array.from(tabList.querySelectorAll('a[href^="#"]'));
        const panels = Array.from(aboutWindow.querySelectorAll('[role="tabpanel"]'));
    
        // Exit if no tabs or panels found
        if (tabs.length === 0 || panels.length === 0) return;
    
        // Hide all panels initially except the first one
        panels.forEach((panel, index) => {
            panel.style.display = index === 0 ? 'block' : 'none';
        });
    
        // set first tab as selected initially
        tabs[0].classList.add('active');
    
        // handle tab clicks
        tabs.forEach((tab, index) => {
            tab.addEventListener('click', e => {
                e.preventDefault();
                
                // get the target panel id from href
                const targetId = tab.getAttribute('href').substring(1);
                const targetPanel = document.getElementById(targetId);
                
                if (!targetPanel) return;
                
                // deactivated all tabs and hide all panels
                tabs.forEach(t => t.classList.remove('active'));
                panels.forEach(p => p.style.display = 'none');
                
                // activated clicked tab and its panel
                tab.classList.add('active');
                targetPanel.style.display = 'block';
            });

            // keyboard navigation
            tab.addEventListener('keydown', e => {
                let newTab;
                const currentIndex = tabs.indexOf(tab);
                
                switch(e.key) {
                    case 'ArrowRight':
                    case 'ArrowDown':
                        newTab = tabs[currentIndex + 1] || tabs[0];
                        break;
                    case 'ArrowLeft':
                    case 'ArrowUp':
                        newTab = tabs[currentIndex - 1] || tabs[tabs.length - 1];
                        break;
                    default:
                        return;
                }
                
                e.preventDefault();
                newTab.click();
                newTab.focus();
            });
        });
    }
    
    // clock update
    function updateClock() {
        const clockElement = document.getElementById('clock');
        if (!clockElement) return;
        
        const now = new Date();
        let hours = now.getHours() % 12 || 12;
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
        clockElement.textContent = `${hours}:${minutes} ${ampm}`;
    }

    // utility functions
    function getHighestZIndex() {
        return Math.max(
            ...Array.from(document.querySelectorAll('.window'))
                .map(el => parseFloat(window.getComputedStyle(el).zIndex))
                .filter(zIndex => !isNaN(zIndex)),
            0
        );
    }

    function setupSubWindowListeners() {
        // opening subwindows
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
    
        // closing subwindows
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

        const closeBtn = shutDownDialog.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                shutDownDialog.style.display = 'none';
            });
        }

        const shutDownBtn = document.getElementById('shut-down-btn');
        if (shutDownBtn) {
            shutDownBtn.addEventListener('click', () => {
                alert('shutting down... (not really, but i love you!)');
                shutDownDialog.style.display = 'none';
            });
        }

        const cancelBtn = document.getElementById('cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                shutDownDialog.style.display = 'none';
            });
        }
    }

    // Add this to your scripts.js


    // Event Listeners
    document.addEventListener('click', handleStartMenu);
    document.addEventListener('click', handleWindowClick);
    document.addEventListener('click', handleCloseButton);
    
    document.addEventListener('mousedown', startDragging);
    document.addEventListener('touchstart', startDragging);
    
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag, { passive: false });
    
    document.addEventListener('mouseup', stopDragging);
    document.addEventListener('touchend', stopDragging);
    
    document.addEventListener('selectstart', e => isDragging && e.preventDefault());
    document.addEventListener('dragstart', e => isDragging && e.preventDefault());

    updateClock();
    const clockInterval = setInterval(updateClock, 1000);

    // window opening from icons and start menu
    document.querySelectorAll('.icon[data-window], .start-menu a[data-window]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const windowId = item.getAttribute('data-window');
            if (windowId) {
                openWindow(windowId);
                startMenu.style.display = 'none';
            }
        });
    });

    // setup subwindow listeners
    setupSubWindowListeners();

    // clean up on page unload
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

    // initialize layout
    if (typeof updateLayoutForEra === 'function') {
        updateLayoutForEra();
    }
    setupSystemTabs();
});

async function fetchCryptoPrices() {
    try {
        // Add rate limiting
        const lastFetch = localStorage.getItem('lastFetchTime');
        const now = Date.now();
        if (lastFetch && now - parseInt(lastFetch) < 10000) { // 10 second cooldown
            throw new Error('Please wait a few seconds before refreshing again');
        }
        
        // Sanitize the DOM element first
        const pricesDiv = document.getElementById('cryptoPrices');
        if (!pricesDiv) return;
        pricesDiv.textContent = ''; // Safer than innerHTML when clearing
        
        // Add API call timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,master-of-glasses&vs_currencies=usd&include_24hr_change=true', 
            { signal: controller.signal }
        );
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error('API request failed');
        }
        
        const data = await response.json();
        localStorage.setItem('lastFetchTime', now.toString());
        
        // Validate data structure before using
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data received');
        }
        
        const coinNames = {
            'bitcoin': 'Bitcoin (BTC)',
            'ethereum': 'Ethereum (ETH)',
            'solana': 'Solana (SOL)',
            'master-of-glasses': 'MOG'
        };
        
        // Create elements safely
        Object.entries(data).forEach(([coinId, info]) => {
            if (!info || typeof info.usd !== 'number' || typeof info.usd_24h_change !== 'number') {
                return; // Skip invalid data
            }
            
            const coinDiv = document.createElement('div');
            coinDiv.className = 'crypto-item';
            
            const nameStrong = document.createElement('strong');
            nameStrong.textContent = coinNames[coinId] || coinId;
            
            const priceText = document.createTextNode(
                `\n$${info.usd.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })}\n`
            );
            
            const changeSpan = document.createElement('span');
            changeSpan.className = info.usd_24h_change >= 0 ? 'price-up' : 'price-down';
            changeSpan.textContent = `${info.usd_24h_change.toFixed(2)}% (24h)`;
            
            coinDiv.appendChild(nameStrong);
            coinDiv.appendChild(priceText);
            coinDiv.appendChild(changeSpan);
            pricesDiv.appendChild(coinDiv);
        });
        
    } catch (error) {
        const pricesDiv = document.getElementById('cryptoPrices');
        if (pricesDiv) {
            pricesDiv.textContent = error.message || 'Error loading prices. Please try again.';
        }
        console.error('Crypto price fetch error:', error);
    }
}

// Add error boundary to refresh function
function refreshPrices() {
    try {
        const pricesDiv = document.getElementById('cryptoPrices');
        if (!pricesDiv) return;
        
        const button = document.querySelector('.refresh-btn');
        if (button) {
            button.disabled = true;
            setTimeout(() => button.disabled = false, 10000); // Enable after 10s
        }
        
        pricesDiv.textContent = 'Loading prices...';
        fetchCryptoPrices().catch(error => {
            console.error('Refresh error:', error);
            pricesDiv.textContent = 'Error refreshing prices. Please try again.';
        });
    } catch (error) {
        console.error('Unexpected error:', error);
    }
}


function openCryptoWindow() {
    const cryptoWindow = document.getElementById('cryptoWindow');
    if (cryptoWindow) {
        cryptoWindow.style.display = 'block';
        cryptoWindow.style.zIndex = getHighestZIndex() + 1;
        fetchCryptoPrices(); 
    }
}

    // Contact Form Subject Buttons
    const subjectButtons = document.querySelectorAll('.subject-btn');
    const reasonInput = document.getElementById('reason');
    
    subjectButtons.forEach(button => {
        button.addEventListener('click', function() {
            subjectButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            reasonInput.value = this.dataset.reason;
        });
    });

    const form = document.getElementById('contactForm');
    form.addEventListener('submit', function(e) {
        const button = form.querySelector('button[type="submit"]');
        button.disabled = true;
        button.textContent = 'Sending...';
    });

    if (reasonInput) {
        subjectButtons.forEach(button => {
            button.addEventListener('click', () => {
                subjectButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                reasonInput.value = button.getAttribute('data-reason') || '';
            });
        });
    }

// global functions needed for HTML onclick handlers
window.refreshFriendster = function() {
    const ieWindow = document.getElementById('ieWindow');
    if (ieWindow) {
        ieWindow.querySelector('.ie-content').innerHTML = 
            '<div class="loading-animation">Loading Friendster...</div>';
        setTimeout(() => {
            const friendsterContent = document.getElementById('friendsterContent');
            if (friendsterContent) {
                ieWindow.querySelector('.ie-content').innerHTML = friendsterContent.innerHTML;
            }
        }, 1500);
    }
};