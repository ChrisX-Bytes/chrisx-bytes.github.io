(function() {
    'use strict';

    const langData = LANG_DATA;

    function getNestedValue(obj, path) {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    }

    // ===== 根据当前路径获取标题的语言键 =====
    function getPageTitleKey() {
        const path = window.location.pathname;
        let p = path.replace(/\/$/, '').replace(/\/index\.html$/, '');
        if (p === '' || p === '/') return 'page_title_home';
        if (p.endsWith('/tools') || p.includes('/tools/')) return 'page_title_tools';
        if (p.endsWith('/news') || p.includes('/news/')) return 'page_title_news';
        if (p.endsWith('/about') || p.includes('/about/')) return 'page_title_about';
        return 'page_title_home';
    }

    function applyLanguage() {
        const lang = 'zh';

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = getNestedValue(langData[lang], key);
            if (translation !== undefined) {
                el.innerHTML = translation;
            }
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            const translation = getNestedValue(langData[lang], key);
            if (translation !== undefined) {
                el.placeholder = translation;
            }
        });

        renderNewsItems(lang);
        renderTeamMembers(lang);

        const todoList = document.getElementById('todoList');
        if (todoList) {
            const emptyLi = todoList.querySelector('.todo-empty');
            if (emptyLi) {
                const key = 'tools_todo_empty';
                const translation = getNestedValue(langData[lang], key);
                if (translation) {
                    emptyLi.textContent = translation;
                }
            }
        }

        const titleKey = getPageTitleKey();
        const titleTranslation = getNestedValue(langData[lang], titleKey);
        if (titleTranslation) {
            document.title = titleTranslation;
        }

        document.documentElement.lang = 'zh-CN';
    }

    function renderNewsItems(lang) {
        const container = document.getElementById('newsList');
        if (!container) return;
        const items = langData[lang].news_items || [];
        if (items.length === 0) {
            container.innerHTML = '<p class="todo-empty">暂无新闻。</p>';
            return;
        }
        let html = '';
        items.forEach(item => {
            html += `
                <article class="news-item">
                    <span class="news-date">${item.date}</span>
                    <h3>${item.title}</h3>
                    <p>${item.desc}</p>
                    <span class="news-tag">${item.tag}</span>
                </article>
            `;
        });
        container.innerHTML = html;
    }

    function renderTeamMembers(lang) {
        const container = document.getElementById('teamGrid');
        if (!container) return;
        const members = langData[lang].team_members || [];
        if (members.length === 0) {
            container.innerHTML = '<p></p>';
            return;
        }
        let html = '';
        members.forEach(m => {
            html += `
                <div class="team-card">
                    <div class="avatar">${m.avatar}</div>
                    <h4>${m.name}</h4>
                    <p>${m.role}</p>
                </div>
            `;
        });
        container.innerHTML = html;
    }

    function highlightNav() {
        const currentPath = window.location.pathname;
        const links = document.querySelectorAll('.nav-links a');

        function normalize(path) {
            let p = path.replace(/\/$/, '');
            if (p.endsWith('/index.html')) {
                p = p.replace(/\/index\.html$/, '');
            }
            if (p === '') p = '/';
            return p;
        }

        const cur = normalize(currentPath);

        links.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (!href || href === '#') return;
            const tempLink = document.createElement('a');
            tempLink.href = href;
            let linkPath = tempLink.pathname;
            const linkNormalized = normalize(linkPath);
            if (cur === linkNormalized) {
                link.classList.add('active');
            }
        });
    }

    function initTodo() {
        const todoInput = document.getElementById('todoInput');
        const todoAddBtn = document.getElementById('todoAddBtn');
        const todoList = document.getElementById('todoList');
        if (!todoInput || !todoAddBtn || !todoList) return;

        let todos = [];
        const STORAGE_KEY = 'xingchen_todos';

        function loadTodos() {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) todos = JSON.parse(stored);
            } catch (_) { todos = []; }
        }
        function saveTodos() {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
        }
        function renderTodos() {
            if (todos.length === 0) {
                todoList.innerHTML = `<li class="todo-empty">${getLangText('tools_todo_empty')}</li>`;
                return;
            }
            let html = '';
            todos.forEach((todo, index) => {
                const doneClass = todo.done ? 'done' : '';
                html += `
                    <li data-index="${index}">
                        <span class="todo-text ${doneClass}">${escapeHtml(todo.text)}</span>
                        <div class="todo-actions">
                            <button class="done-btn" data-action="toggle" title="✓">✓</button>
                            <button class="del-btn" data-action="delete" title="✕">✕</button>
                        </div>
                    </li>
                `;
            });
            todoList.innerHTML = html;
        }
        function escapeHtml(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }
        function getLangText(key) {
            const val = getNestedValue(langData['zh'], key);
            return val || key;
        }
        function addTodo() {
            const text = todoInput.value.trim();
            if (!text) { todoInput.focus(); return; }
            todos.push({ text, done: false });
            saveTodos();
            renderTodos();
            todoInput.value = '';
            todoInput.focus();
        }
        function handleTodoAction(e) {
            const li = e.target.closest('li');
            if (!li) return;
            const index = parseInt(li.dataset.index, 10);
            if (isNaN(index) || index < 0 || index >= todos.length) return;
            const action = e.target.dataset.action;
            if (action === 'toggle') {
                todos[index].done = !todos[index].done;
                saveTodos();
                renderTodos();
            } else if (action === 'delete') {
                todos.splice(index, 1);
                saveTodos();
                renderTodos();
            }
        }

        todoAddBtn.addEventListener('click', addTodo);
        todoInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') addTodo();
        });
        todoList.addEventListener('click', handleTodoAction);

        loadTodos();
        renderTodos();
    }

    function initMobileMenu() {
        const toggle = document.getElementById('menuToggle');
        const nav = document.getElementById('navLinks');
        if (!toggle || !nav) return;
        toggle.addEventListener('click', function() {
            nav.classList.toggle('open');
        });
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.navbar')) {
                nav.classList.remove('open');
            }
        });
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') nav.classList.remove('open');
        });
    }

    // ===== 加载公共组件（使用绝对路径） =====
    function loadComponents(callback) {
        const headerPlaceholder = document.getElementById('header-placeholder');
        const footerPlaceholder = document.getElementById('footer-placeholder');

        if (!headerPlaceholder || !footerPlaceholder) {
            console.warn('未找到占位元素，请在页面中添加 <div id="header-placeholder"></div> 和 <div id="footer-placeholder"></div>');
            if (callback) callback();
            return;
        }

        // ✅ 直接使用绝对路径，从根目录获取组件
        const headerUrl = '/assets/components/header.html';
        const footerUrl = '/assets/components/footer.html';

        Promise.all([
            fetch(headerUrl).then(res => {
                if (!res.ok) throw new Error(`Header 加载失败 (HTTP ${res.status})`);
                return res.text();
            }),
            fetch(footerUrl).then(res => {
                if (!res.ok) throw new Error(`Footer 加载失败 (HTTP ${res.status})`);
                return res.text();
            })
        ]).then(([headerHtml, footerHtml]) => {
            headerPlaceholder.innerHTML = headerHtml;
            footerPlaceholder.innerHTML = footerHtml;
            if (callback) callback();
        }).catch(err => {
            console.error('加载公共组件失败:', err);
            if (callback) callback();
        });
    }

    // ---------- 初始化 ----------
    function init() {
        loadComponents(function() {
            applyLanguage();
            highlightNav();
            initTodo();
            initMobileMenu();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();