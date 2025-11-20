class LoveTracker {
    constructor() {
        this.startDate = null;
        this.timerInterval = null;
        this.coupleInfo = {
            partner1: '',
            partner2: '',
            photo: null
        };
        this.memories = [];
        this.currentTheme = 'light';
        this.editingMemoryId = null;
        this.memoryToDelete = null;
        this.relationshipLevels = [
            { level: 1, name: 'Знакомство', days: 0, icon: '💕' },
            { level: 2, name: 'Привязанность', days: 30, icon: '💖' },
            { level: 3, name: 'Любовь', days: 90, icon: '💝' },
            { level: 4, name: 'Глубокая связь', days: 365, icon: '🥰' },
            { level: 5, name: 'Вечная любовь', days: 1825, icon: '💑' }
        ];
        this.initializeApp();
    }

    initializeApp() {
        this.loadSavedData();
        this.setupEventListeners();
        this.createFloatingHearts();
        this.setupPWA();
        this.applyTheme(this.currentTheme);
        this.showCurrentStep();
    }

    setupEventListeners() {
        // Навигация по шагам
        document.getElementById('saveDate').addEventListener('click', () => {
            this.saveStartDate();
        });

        document.getElementById('backToStep1').addEventListener('click', () => {
            this.showStep(1);
        });

        document.getElementById('saveCoupleInfo').addEventListener('click', () => {
            this.saveCoupleInfo();
        });

        document.getElementById('resetDate').addEventListener('click', () => {
            if (confirm('Вы уверены, что хотите начать заново? Все данные будут сброшены.')) {
                this.resetApp();
            }
        });

        // Загрузка фото
        document.getElementById('photoUpload').addEventListener('change', (e) => {
            this.handlePhotoUpload(e, 'photoPreview');
        });

        document.getElementById('editPhotoUpload').addEventListener('change', (e) => {
            this.handlePhotoUpload(e, 'editPhotoPreview');
        });

        // Смена темы
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Редактирование пары
        document.getElementById('editCoupleBtn').addEventListener('click', () => {
            this.openEditCoupleModal();
        });

        document.getElementById('saveEditCouple').addEventListener('click', () => {
            this.saveEditedCoupleInfo();
        });

        // Галерея моментов
        document.getElementById('addMemoryBtn').addEventListener('click', () => {
            this.openMemoryModal();
        });

        // Модальные окна
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                this.closeAllModals();
            });
        });

        document.getElementById('memoryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveMemory();
        });

        document.getElementById('deleteMemoryBtn').addEventListener('click', () => {
            this.confirmDeleteMemory();
        });

        // Обработчики для модальных окон подтверждения
        document.getElementById('confirmCancel').addEventListener('click', () => {
            this.closeConfirmModal();
        });

        document.getElementById('confirmDelete').addEventListener('click', () => {
            this.deleteConfirmedMemory();
        });

        // Просмотр фото при загрузке в модальном окне
        document.getElementById('memoryPhoto').addEventListener('change', (e) => {
            this.previewMemoryPhoto(e);
        });

        // Закрытие модальных окон по клику вне области
        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('editCoupleModal')) {
                this.closeEditCoupleModal();
            }
            if (e.target === document.getElementById('memoryModal')) {
                this.closeMemoryModal();
            }
            if (e.target === document.getElementById('confirmModal')) {
                this.closeConfirmModal();
            }
        });
    }

    showCurrentStep() {
        const hasDate = localStorage.getItem('relationshipStartDate');
        const hasCoupleInfo = localStorage.getItem('loveTrackerCoupleInfo');

        if (!hasDate) {
            this.showStep(1);
        } else if (!hasCoupleInfo) {
            this.showStep(2);
        } else {
            this.showStep(3);
            this.startTimer();
        }
    }

    showStep(stepNumber) {
        document.querySelectorAll('.step-section').forEach(section => {
            section.classList.remove('active');
        });

        document.getElementById(`step${stepNumber}`).classList.add('active');

        document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
            if (index + 1 === stepNumber) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });

        if (stepNumber === 3) {
            this.startTimer();
        }
    }

    saveStartDate() {
        const dateInput = document.getElementById('startDate').value;
        
        if (!dateInput) {
            alert('Пожалуйста, выберите дату начала отношений');
            return;
        }

        this.startDate = new Date(dateInput);
        
        if (this.startDate > new Date()) {
            alert('Дата не может быть в будущем!');
            return;
        }

        localStorage.setItem('relationshipStartDate', this.startDate.toISOString());
        this.showStep(2);
    }

    saveCoupleInfo() {
        const partner1 = document.getElementById('partner1').value.trim();
        const partner2 = document.getElementById('partner2').value.trim();

        if (!partner1 || !partner2) {
            alert('Пожалуйста, введите имена обоих партнеров');
            return;
        }

        this.coupleInfo.partner1 = partner1;
        this.coupleInfo.partner2 = partner2;

        localStorage.setItem('loveTrackerCoupleInfo', JSON.stringify(this.coupleInfo));
        this.displayCoupleInfo();
        this.showStep(3);
    }

    openEditCoupleModal() {
        document.getElementById('editPartner1').value = this.coupleInfo.partner1;
        document.getElementById('editPartner2').value = this.coupleInfo.partner2;
        
        const photoPreview = document.getElementById('editPhotoPreview');
        if (this.coupleInfo.photo) {
            photoPreview.innerHTML = `<img src="${this.coupleInfo.photo}" alt="Фото пары">`;
        } else {
            photoPreview.innerHTML = `
                <div class="photo-placeholder">
                    <i class="fas fa-camera"></i>
                    <span>Добавьте ваше фото</span>
                </div>
            `;
        }

        document.getElementById('editCoupleModal').style.display = 'block';
    }

    closeEditCoupleModal() {
        document.getElementById('editCoupleModal').style.display = 'none';
    }

    saveEditedCoupleInfo() {
        const partner1 = document.getElementById('editPartner1').value.trim();
        const partner2 = document.getElementById('editPartner2').value.trim();

        if (!partner1 || !partner2) {
            alert('Пожалуйста, введите имена обоих партнеров');
            return;
        }

        this.coupleInfo.partner1 = partner1;
        this.coupleInfo.partner2 = partner2;

        localStorage.setItem('loveTrackerCoupleInfo', JSON.stringify(this.coupleInfo));
        this.displayCoupleInfo();
        this.closeEditCoupleModal();
        alert('Данные пары обновлены!');
    }

    handlePhotoUpload(event, previewId) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.coupleInfo.photo = e.target.result;
                const photoPreview = document.getElementById(previewId);
                photoPreview.innerHTML = `<img src="${e.target.result}" alt="Фото пары">`;
                
                localStorage.setItem('loveTrackerCoupleInfo', JSON.stringify(this.coupleInfo));
                
                // Обновляем фото в таймере
                if (previewId === 'editPhotoPreview' || previewId === 'photoPreview') {
                    this.displayCoupleInfo();
                }
            };
            reader.readAsDataURL(file);
        }
    }

    displayCoupleInfo() {
        document.getElementById('displayPartner1').textContent = this.coupleInfo.partner1;
        document.getElementById('displayPartner2').textContent = this.coupleInfo.partner2;

        // Обновляем фото в таймере
        const couplePhoto = document.getElementById('couplePhoto');
        if (this.coupleInfo.photo) {
            couplePhoto.innerHTML = `<img src="${this.coupleInfo.photo}" alt="Фото пары">`;
        } else {
            couplePhoto.innerHTML = `
                <div class="photo-placeholder-small">
                    <i class="fas fa-heart"></i>
                </div>
            `;
        }
    }

    resetApp() {
        localStorage.removeItem('relationshipStartDate');
        localStorage.removeItem('loveTrackerCoupleInfo');
        localStorage.removeItem('loveTrackerMemories');
        
        this.startDate = null;
        this.coupleInfo = { partner1: '', partner2: '', photo: null };
        this.memories = [];
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        document.getElementById('startDate').value = '';
        document.getElementById('partner1').value = '';
        document.getElementById('partner2').value = '';
        document.getElementById('photoPreview').innerHTML = `
            <div class="photo-placeholder">
                <i class="fas fa-camera"></i>
                <span>Добавьте ваше фото</span>
            </div>
        `;
        
        this.showStep(1);
    }

    loadSavedData() {
        const savedTheme = localStorage.getItem('loveTrackerTheme');
        if (savedTheme) {
            this.currentTheme = savedTheme;
        }

        const savedCoupleInfo = localStorage.getItem('loveTrackerCoupleInfo');
        if (savedCoupleInfo) {
            this.coupleInfo = JSON.parse(savedCoupleInfo);
            this.displayCoupleInfo();
        }

        const savedDate = localStorage.getItem('relationshipStartDate');
        if (savedDate) {
            this.startDate = new Date(savedDate);
            document.getElementById('startDate').value = this.formatDateForInput(this.startDate);
        }

        const savedMemories = localStorage.getItem('loveTrackerMemories');
        if (savedMemories) {
            this.memories = JSON.parse(savedMemories);
            this.renderGallery();
        }
    }

    toggleTheme() {
        const themes = ['light', 'dark', 'romantic'];
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        this.currentTheme = themes[nextIndex];
        
        this.applyTheme(this.currentTheme);
        localStorage.setItem('loveTrackerTheme', this.currentTheme);
    }

    applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        
        const themeIcon = document.querySelector('#themeToggle i');
        const icons = {
            'light': 'fa-sun',
            'dark': 'fa-moon',
            'romantic': 'fa-heart'
        };
        
        themeIcon.className = `fas ${icons[theme]}`;
    }

    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.timerInterval = setInterval(() => {
            if (this.startDate) {
                this.updateTimer();
            }
        }, 1000);
        
        this.updateTimer();
    }

    updateTimer() {
        if (!this.startDate) return;

        const now = new Date();
        const diff = now - this.startDate;
        const currentDays = Math.floor(diff / (1000 * 60 * 60 * 24));

        this.updateTimeUnits(diff);
        this.updateTotalDays(diff);
        this.updateMilestones();
        this.updateRelationshipLevel(currentDays);
    }

    updateTimeUnits(diff) {
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        const years = Math.floor(days / 365);
        const remainingDays = days % 365;
        const months = Math.floor(remainingDays / 30);
        const finalDays = remainingDays % 30;

        document.getElementById('years').textContent = years;
        document.getElementById('months').textContent = months;
        document.getElementById('days').textContent = finalDays;
        document.getElementById('hours').textContent = hours % 24;
        document.getElementById('minutes').textContent = minutes % 60;
        document.getElementById('seconds').textContent = seconds % 60;
    }

    updateTotalDays(diff) {
        const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
        document.getElementById('totalDays').textContent = `${totalDays.toLocaleString()} дней`;
    }

    updateRelationshipLevel(currentDays) {
        let currentLevel = this.relationshipLevels[0];
        let nextLevel = this.relationshipLevels[1];

        for (let i = this.relationshipLevels.length - 1; i >= 0; i--) {
            if (currentDays >= this.relationshipLevels[i].days) {
                currentLevel = this.relationshipLevels[i];
                nextLevel = this.relationshipLevels[i + 1] || currentLevel;
                break;
            }
        }

        document.getElementById('levelName').textContent = currentLevel.name;
        document.getElementById('levelIcon').textContent = currentLevel.icon;

        if (nextLevel !== currentLevel) {
            const progress = ((currentDays - currentLevel.days) / (nextLevel.days - currentLevel.days)) * 100;
            document.getElementById('levelProgress').style.width = `${Math.min(progress, 100)}%`;
            document.getElementById('progressText').textContent = `${Math.round(progress)}%`;
        } else {
            document.getElementById('levelProgress').style.width = '100%';
            document.getElementById('progressText').textContent = '100%';
        }
    }

    updateMilestones() {
        const milestones = [
            { days: 100, name: '100 дней вместе' },
            { days: 365, name: '1 год отношений' },
            { days: 500, name: '500 дней любви' },
            { days: 730, name: '2 года вместе' },
            { days: 1000, name: '1000 счастливых дней' },
            { days: 1825, name: '5 лет отношений' }
        ];

        const currentDays = Math.floor((new Date() - this.startDate) / (1000 * 60 * 60 * 24));
        const milestoneList = document.getElementById('milestoneList');
        milestoneList.innerHTML = '';

        for (const milestone of milestones) {
            if (milestone.days > currentDays) {
                const daysLeft = milestone.days - currentDays;
                const milestoneDate = new Date(this.startDate.getTime() + milestone.days * 24 * 60 * 60 * 1000);
                
                const milestoneElement = document.createElement('div');
                milestoneElement.className = 'milestone-item';
                milestoneElement.innerHTML = `
                    <div class="milestone-date">${milestone.name}</div>
                    <div class="milestone-days">
                        Через ${daysLeft} дней • ${this.formatDate(milestoneDate)}
                    </div>
                `;
                milestoneList.appendChild(milestoneElement);
            }
        }

        if (milestoneList.children.length === 0) {
            milestoneList.innerHTML = '<div class="milestone-item">Все вехи пройдены! Поздравляем! 🎉</div>';
        }
    }

    // Методы для галереи моментов
    openMemoryModal(memoryId = null) {
        this.editingMemoryId = memoryId;
        const modal = document.getElementById('memoryModal');
        const modalTitle = document.getElementById('modalTitle');
        const deleteBtn = document.getElementById('deleteMemoryBtn');
        
        if (memoryId) {
            modalTitle.textContent = 'Редактировать момент';
            deleteBtn.style.display = 'flex';
            this.fillMemoryForm(memoryId);
        } else {
            modalTitle.textContent = 'Добавить особенный момент';
            deleteBtn.style.display = 'none';
            this.clearMemoryForm();
        }
        
        modal.style.display = 'block';
    }

    fillMemoryForm(memoryId) {
        const memory = this.memories.find(m => m.id === memoryId);
        if (!memory) return;

        document.getElementById('memoryId').value = memory.id;
        document.getElementById('memoryTitle').value = memory.title;
        document.getElementById('memoryDate').value = memory.date;
        document.getElementById('memoryDescription').value = memory.description || '';
        
        const photoPreview = document.getElementById('memoryPhotoPreview');
        if (memory.photo) {
            photoPreview.innerHTML = `<img src="${memory.photo}" alt="${memory.title}">`;
        } else {
            photoPreview.innerHTML = `
                <div class="photo-placeholder">
                    <i class="fas fa-camera"></i>
                </div>
            `;
        }
    }

    clearMemoryForm() {
        document.getElementById('memoryForm').reset();
        document.getElementById('memoryId').value = '';
        document.getElementById('memoryPhotoPreview').innerHTML = `
            <div class="photo-placeholder">
                <i class="fas fa-camera"></i>
            </div>
        `;
        document.getElementById('memoryPhoto').value = '';
    }

    previewMemoryPhoto(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const photoPreview = document.getElementById('memoryPhotoPreview');
                photoPreview.innerHTML = `<img src="${e.target.result}" alt="Превью фото">`;
            };
            reader.readAsDataURL(file);
        }
    }

    saveMemory() {
        const id = document.getElementById('memoryId').value;
        const title = document.getElementById('memoryTitle').value.trim();
        const date = document.getElementById('memoryDate').value;
        const description = document.getElementById('memoryDescription').value.trim();
        const photoInput = document.getElementById('memoryPhoto');

        if (!title || !date) {
            alert('Пожалуйста, заполните название и дату');
            return;
        }

        const memoryData = {
            id: id ? parseInt(id) : Date.now(),
            title,
            date,
            description,
            photo: null
        };

        if (id && (!photoInput.files[0])) {
            const existingMemory = this.memories.find(m => m.id === parseInt(id));
            if (existingMemory) {
                memoryData.photo = existingMemory.photo;
            }
        }

        if (photoInput.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                memoryData.photo = e.target.result;
                this.finalizeMemorySave(memoryData);
            };
            reader.readAsDataURL(photoInput.files[0]);
        } else {
            this.finalizeMemorySave(memoryData);
        }
    }

    finalizeMemorySave(memoryData) {
        if (this.editingMemoryId) {
            const index = this.memories.findIndex(m => m.id === this.editingMemoryId);
            if (index !== -1) {
                this.memories[index] = memoryData;
            }
        } else {
            this.memories.push(memoryData);
        }

        this.memories.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        localStorage.setItem('loveTrackerMemories', JSON.stringify(this.memories));
        this.renderGallery();
        this.closeMemoryModal();
        
        alert(this.editingMemoryId ? 'Момент обновлен!' : 'Момент сохранен!');
    }

    confirmDeleteMemory() {
        this.memoryToDelete = this.editingMemoryId;
        document.getElementById('confirmModal').style.display = 'block';
    }

    deleteConfirmedMemory() {
        if (this.memoryToDelete) {
            this.memories = this.memories.filter(m => m.id !== this.memoryToDelete);
            localStorage.setItem('loveTrackerMemories', JSON.stringify(this.memories));
            this.renderGallery();
            this.closeConfirmModal();
            this.closeMemoryModal();
            alert('Момент удален!');
        }
    }

    closeAllModals() {
        document.getElementById('editCoupleModal').style.display = 'none';
        document.getElementById('memoryModal').style.display = 'none';
        document.getElementById('confirmModal').style.display = 'none';
        this.editingMemoryId = null;
        this.memoryToDelete = null;
    }

    closeMemoryModal() {
        document.getElementById('memoryModal').style.display = 'none';
        this.editingMemoryId = null;
        this.clearMemoryForm();
    }

    closeConfirmModal() {
        document.getElementById('confirmModal').style.display = 'none';
        this.memoryToDelete = null;
    }

    renderGallery() {
        const galleryGrid = document.getElementById('galleryGrid');
        
        if (this.memories.length === 0) {
            galleryGrid.innerHTML = `
                <div class="empty-gallery">
                    <i class="fas fa-images"></i>
                    <p>Пока нет сохраненных моментов</p>
                    <p style="font-size: 0.9rem; margin-top: 10px; opacity: 0.6;">Нажмите "Добавить момент", чтобы создать первое воспоминание</p>
                </div>
            `;
            return;
        }

        galleryGrid.innerHTML = this.memories.map(memory => `
            <div class="memory-card" data-memory-id="${memory.id}">
                <div class="memory-actions">
                    <button class="btn-action btn-edit" onclick="loveTracker.openMemoryModal(${memory.id})" title="Редактировать">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action btn-delete" onclick="loveTracker.confirmDeleteMemoryFromCard(${memory.id})" title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="memory-photo">
                    ${memory.photo ? 
                        `<img src="${memory.photo}" alt="${memory.title}">` : 
                        `<i class="fas fa-heart"></i>`
                    }
                </div>
                <div class="memory-info">
                    <div class="memory-title">${memory.title}</div>
                    <div class="memory-date">${this.formatDate(new Date(memory.date))}</div>
                    ${memory.description ? `<div class="memory-description">${memory.description}</div>` : ''}
                </div>
            </div>
        `).join('');
    }

    confirmDeleteMemoryFromCard(memoryId) {
        this.memoryToDelete = memoryId;
        document.getElementById('confirmModal').style.display = 'block';
    }

    setupPWA() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            document.getElementById('installBtn').style.display = 'flex';
        });

        document.getElementById('installBtn').addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    document.getElementById('installBtn').style.display = 'none';
                }
                deferredPrompt = null;
            }
        });
    }

    formatDate(date) {
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    formatDateForInput(date) {
        return date.toISOString().split('T')[0];
    }

    createFloatingHearts() {
        const heartsContainer = document.querySelector('.floating-hearts');
        const heartCount = 15;

        for (let i = 0; i < heartCount; i++) {
            setTimeout(() => {
                this.createHeart(heartsContainer);
            }, i * 500);
        }

        setInterval(() => {
            this.createHeart(heartsContainer);
        }, 2000);
    }

    createHeart(container) {
        const heart = document.createElement('div');
        heart.innerHTML = '❤';
        heart.className = 'heart';
        
        const size = Math.random() * 20 + 10;
        const left = Math.random() * 100;
        const duration = Math.random() * 10 + 10;
        const delay = Math.random() * 5;
        
        heart.style.left = `${left}vw`;
        heart.style.fontSize = `${size}px`;
        heart.style.animationDuration = `${duration}s`;
        heart.style.animationDelay = `${delay}s`;
        
        container.appendChild(heart);
        
        setTimeout(() => {
            heart.remove();
        }, (duration + delay) * 1000);
    }
}

// Цитаты о любви
const loveQuotes = [
    "Любовь измеряется не временем, а моментами, которые делают время стоящим",
    "Самое главное в отношениях - это не количество времени, а его качество",
    "Истинная любовь не знает срока годности",
    "Каждая секунда с тобой - это подарок судьбы",
    "Любовь - это когда обычные дни становятся особенными",
    "Вместе мы пишем историю нашей любви с каждой прожитой секундой",
    "Настоящая любовь только крепнет с течением времени"
];

let loveTracker;

document.addEventListener('DOMContentLoaded', () => {
    loveTracker = new LoveTracker();
    
    const quoteElement = document.getElementById('quoteText');
    let quoteIndex = 0;
    
    setInterval(() => {
        quoteIndex = (quoteIndex + 1) % loveQuotes.length;
        quoteElement.style.opacity = '0';
        
        setTimeout(() => {
            quoteElement.textContent = loveQuotes[quoteIndex];
            quoteElement.style.opacity = '1';
        }, 500);
    }, 5000);
});