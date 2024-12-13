document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    if (path.endsWith('index.html') || path.endsWith('/')) {
        showAuthLinksInNav();
        changeLanguage('ru');
    } else if (path.endsWith('login.html')) {
        setupLoginForm();
    } else if (path.endsWith('profile.html')) {
        setupProfilePage();
    }

    // Языковой переключатель
    const langSelect = document.getElementById('lang-select');
    if (langSelect) {
        langSelect.addEventListener('change', () => {
            changeLanguage(langSelect.value);
        });
        changeLanguage('ru');
    }
    
    // Если мы на главной странице, загрузим события, карту и погоду
    if (document.getElementById('map-container')) {
        loadEvents();
        updateWeather();
        setInterval(updateTime, 1000);
        updateTime();
    }
});

let myMap;
let allEvents = [];
let placemarks = [];
let currentLanguage = 'ru';

// Загрузка событий и инициализация карты
function loadEvents() {
    fetch('events.json')
        .then(response => response.json())
        .then(data => {
            allEvents = data;
            initMap();
            displayEvents(allEvents);
            setTimeout(() => {
              addMapMarkers(allEvents);
            }, 1000);
        })
        .catch(err => console.error('Ошибка загрузки событий:', err));
}

function initMap() {
    ymaps.ready(function() {
        myMap = new ymaps.Map("map-container", {
            center: [51.169392, 71.449074],
            zoom: 12
        });
    });
}

function addMapMarkers(events) {
    if (!myMap) return;
    if (placemarks.length > 0) {
        placemarks.forEach(pm => myMap.geoObjects.remove(pm));
        placemarks = [];
    }

    events.forEach(ev => {
        let dateObj = new Date(ev.date);
        let dateStr = dateObj.toLocaleString(getLocale(), {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit'
        });
        let placemark = new ymaps.Placemark([ev.lat, ev.lng], {
            hintContent: ev.title,
            balloonContent: `<strong>${ev.title}</strong><br>${ev.location}<br>${dateStr}<br>Тип: ${ev.type}`
        });
        placemarks.push(placemark);
        myMap.geoObjects.add(placemark);
    });
}

function displayEvents(events) {
    const eventList = document.querySelector('.event-list');
    if (!eventList) return;
    eventList.innerHTML = '';
    events.forEach(ev => {
        let dateObj = new Date(ev.date);
        let dateStr = dateObj.toLocaleString(getLocale(), {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute:'2-digit'
        });

        let li = document.createElement('li');
        li.innerHTML = `
            <h3>${ev.title}</h3>
            <p>${getTranslatedLabel("date")}: ${dateStr}</p>
            <p>${getTranslatedLabel("address")}: ${ev.location}</p>
            <p>${getTranslatedLabel("event_type")}: ${ev.type}</p>
            <a href="details.html?id=${ev.id}" class="details-button" data-i18n="more_details">Подробнее</a>
        `;
        eventList.appendChild(li);
    });
}

function applyFilters() {
    const selectedDate = document.getElementById('filter-date').value;
    const selectedType = document.getElementById('filter-type').value;

    let filteredEvents = allEvents.filter(ev => {
        let pass = true;
        if (selectedDate) {
            let evDate = new Date(ev.date);
            let filterDate = new Date(selectedDate);
            pass = pass && (evDate.toDateString() === filterDate.toDateString());
        }
        if (selectedType) {
            pass = pass && (ev.type === selectedType);
        }
        return pass;
    });

    displayEvents(filteredEvents);
    addMapMarkers(filteredEvents);
}

function updateWeather() {
    const apiKey = '649d502c84c9d70785ce7ec263adabbb'; 
    const cityId = '1526273';
    fetch(`https://api.openweathermap.org/data/2.5/weather?id=${cityId}&appid=${apiKey}&units=metric&lang=${currentLanguage === 'ru' ? 'ru' : (currentLanguage === 'kk' ? 'en' : 'en')}`)
      .then(response => response.json())
      .then(data => {
        let tempLabel = currentLanguage === 'ru' ? 'Температура' : (currentLanguage === 'en' ? 'Temperature' : 'Температура');
        let condLabel = currentLanguage === 'ru' ? 'Условия' : (currentLanguage === 'en' ? 'Conditions' : 'Жағдайлар');
        document.getElementById('temperature').textContent = `${tempLabel}: ${data.main.temp} °C`;
        document.getElementById('conditions').textContent = `${condLabel}: ${data.weather[0].description}`;
      })
      .catch(error => console.error('Ошибка при получении погоды:', error));
}

function updateTime() {
    let now = new Date();
    document.getElementById('local-time').textContent = now.toLocaleTimeString(getLocale(), {timeZone: 'Asia/Almaty'});
}

function getLocale() {
    if (currentLanguage === 'ru') return 'ru-RU';
    if (currentLanguage === 'kk') return 'kk-KZ';
    return 'en-US';
}

function getTranslatedLabel(key) {
    const dict = {
        "date": {
            "ru": "Дата",
            "en": "Date",
            "kk": "Күні"
        },
        "address": {
            "ru": "Адрес",
            "en": "Address",
            "kk": "Мекенжай"
        },
        "event_type": {
            "ru": "Тип мероприятия",
            "en": "Event type",
            "kk": "Іс-шара түрі"
        }
    };
    return dict[key][currentLanguage];
}

function changeLanguage(lang) {
    currentLanguage = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (translations[key] && translations[key][lang]) {
          el.textContent = translations[key][lang];
      }
    });

    // Обновляем динамические данные, если есть
    if (allEvents.length > 0) {
      displayEvents(allEvents);
      addMapMarkers(allEvents);
    }
    updateWeather();
    updateTime();
}

// Авторизация
function showAuthLinksInNav() {
    const navMenu = document.getElementById('nav-menu');
    const userData = getUserData();

    let li = document.createElement('li');
    if (userData && userData.loggedIn) {
        li.innerHTML = `<a href="profile.html">Мой профиль</a>`;
    } else {
        li.innerHTML = `<a href="login.html">Войти</a>`;
    }
    navMenu.appendChild(li);

    // Фильтры событий
    const filterDate = document.getElementById('filter-date');
    const filterType = document.getElementById('filter-type');
    if (filterDate && filterType) {
        filterDate.addEventListener('change', applyFilters);
        filterType.addEventListener('change', applyFilters);
    }
}

function setupLoginForm() {
    const form = document.getElementById('login-form');
    const error = document.getElementById('login-error');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        if (username === 'admin' && password === 'password') {
            const userData = {
                loggedIn: true,
                username: 'admin',
                description: getUserDescription()
            };
            localStorage.setItem('userData', JSON.stringify(userData));
            window.location.href = 'profile.html';
        } else {
            error.style.display = 'block';
        }
    });
}

function setupProfilePage() {
    const userData = getUserData();
    const profileContent = document.getElementById('profile-content');
    const profileError = document.getElementById('profile-error');
    const logoutBtn = document.getElementById('logout');
    const saveBtn = document.getElementById('save-profile');
    const descriptionField = document.getElementById('profile-description');
    const usernameSpan = document.getElementById('profile-username');

    if (!userData || !userData.loggedIn) {
        profileContent.style.display = 'none';
        profileError.style.display = 'block';
        return;
    }

    usernameSpan.textContent = userData.username;
    descriptionField.value = userData.description || '';

    saveBtn.addEventListener('click', () => {
        userData.description = descriptionField.value;
        localStorage.setItem('userData', JSON.stringify(userData));
        alert('Профиль сохранен!');
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('userData');
        window.location.href = 'index.html';
    });
}

function getUserData() {
    const data = localStorage.getItem('userData');
    if (!data) return null;
    return JSON.parse(data);
}

function getUserDescription() {
    const data = getUserData();
    return data && data.description ? data.description : '';
}
