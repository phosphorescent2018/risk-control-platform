/* DE 模型配置页 —— 交互层（在静态还原之上叠加，默认渲染与原页面一致） */
(function () {
    const MODEL_TYPES = ['XGBoost', 'Linear Regression', 'Python 模型（pickle）', 'PMML 模型'];
    const ALLOWED = ['.model', '.pkl', '.pickle', '.pmml'];
    const MAX_MB = 100;

    const $ = (sel, root) => (root || document).querySelector(sel);
    const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

    /* ---------- 模型类型下拉 ---------- */
    let currentType = '';

    function typeBox() {
        const input = document.getElementById('0_type');
        return input ? input.closest('div[class*="style_90"]') : null;
    }

    function typeLabelEl() {
        const box = typeBox();
        if (!box) return null;
        const spans = $$('span', box).filter((s) => !s.querySelector('input'));
        return spans.length ? spans[spans.length - 1] : null;
    }

    function hideHint(el, texts) {
        let root = el;
        for (let i = 0; i < 8 && root.parentElement; i += 1) root = root.parentElement;
        $$('*', root).forEach((n) => {
            const t = (n.textContent || '').trim();
            if (!n.children.length && texts.indexOf(t) !== -1) {
                n.style.display = 'none';
                const h = n.closest('[id$="_help"]');
                if (h) h.style.display = 'none';
            }
        });
    }

    function setModelType(label, flash) {
        const el = typeLabelEl();
        if (!el) return;
        currentType = label;
        el.textContent = label;
        el.style.color = 'rgb(3, 25, 56)';
        hideHint(el, ['Please select', 'Please input']);
        const boxEl = typeBox();
        if (boxEl) boxEl.style.borderColor = '#d9d9d9';
        const box = typeBox();
        if (box && flash) {
            box.classList.add('rcp-flash');
            setTimeout(() => box.classList.remove('rcp-flash'), 1200);
        }
    }

    function openTypeMenu() {
        const box = typeBox();
        if (!box) return;
        closeMenus();
        const rect = box.getBoundingClientRect();
        const menu = document.createElement('div');
        menu.className = 'rcp-menu';
        menu.style.left = rect.left + 'px';
        menu.style.top = rect.bottom + 4 + 'px';
        menu.style.width = rect.width + 'px';
        MODEL_TYPES.forEach((label) => {
            const item = document.createElement('div');
            item.className = 'rcp-menu-item' + (label === currentType ? ' is-active' : '');
            item.textContent = label;
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                setModelType(label, false);
                closeMenus();
            });
            menu.appendChild(item);
        });
        document.body.appendChild(menu);
    }

    function closeMenus() {
        $$('.rcp-menu').forEach((m) => m.remove());
    }

    /* ---------- 上传 ---------- */
    function uploadButtons() {
        return $$('button').filter((b) => b.textContent.trim() === 'Click to upload');
    }

    function errorHost(btn) {
        // 找到该上传控件的行容器，在它下面放一行错误提示
        let node = btn;
        for (let i = 0; i < 5 && node.parentElement; i += 1) node = node.parentElement;
        let err = node.querySelector(':scope > .rcp-error');
        if (!err) {
            err = document.createElement('div');
            err.className = 'rcp-error';
            node.appendChild(err);
        }
        return err;
    }

    function showError(btn, msg) {
        const err = errorHost(btn);
        err.textContent = msg;
        err.style.display = 'block';
    }

    function clearError(btn) {
        const err = errorHost(btn);
        err.textContent = '';
        err.style.display = 'none';
    }

    function showFileName(btn, name) {
        const label = btn.lastElementChild || btn;
        label.textContent = name;
        label.style.width = 'auto';
        label.style.maxWidth = '112px';
        label.style.overflow = 'hidden';
        label.style.textOverflow = 'ellipsis';
        btn.classList.add('rcp-has-file');
        btn.title = name;
        hideHint(btn, ['Please select']);
    }

    function suffixOf(name) {
        const i = name.lastIndexOf('.');
        return i < 0 ? '' : name.slice(i).toLowerCase();
    }

    function setupUpload(btn, index) {
        const input = document.createElement('input');
        input.type = 'file';
        input.style.display = 'none';
        if (index === 0) input.accept = ALLOWED.join(',');
        if (index === 1) input.accept = '.py';
        if (index === 2) input.multiple = true;
        document.body.appendChild(input);

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            input.value = '';
            input.click();
        });

        input.addEventListener('change', () => {
            if (!input.files || !input.files.length) return;
            const file = input.files[0];
            clearError(btn);

            if (index === 0) {
                const ext = suffixOf(file.name);
                if (ALLOWED.indexOf(ext) === -1) {
                    showError(btn, '模型文件格式需为 .model/.pkl/.pickle/.pmml 格式');
                    return;
                }
                if (file.size / 1024 / 1024 > MAX_MB) {
                    showError(btn, '上传文件不能大于100M');
                    return;
                }
                showFileName(btn, file.name);
                if (ext === '.pkl' || ext === '.pickle') setModelType('Python 模型（pickle）', true);
                if (ext === '.pmml') setModelType('PMML 模型', true);
                return;
            }

            if (index === 1) {
                if (suffixOf(file.name) !== '.py') {
                    showError(btn, '变量处理器格式需为.py格式');
                    return;
                }
                showFileName(btn, file.name);
                return;
            }

            showFileName(btn, input.files.length > 1 ? input.files.length + ' 个文件' : file.name);
        });
    }

    function boot() {
        const box = typeBox();
        if (box && !box.dataset.rcpBound) {
            box.dataset.rcpBound = '1';
            box.addEventListener('click', (e) => {
                e.stopPropagation();
                if ($('.rcp-menu')) closeMenus();
                else openTypeMenu();
            });
        }
        uploadButtons().forEach((btn, i) => {
            if (btn.dataset.rcpBound) return;
            btn.dataset.rcpBound = '1';
            setupUpload(btn, i);
        });
    }

    document.addEventListener('click', closeMenus);
    window.addEventListener('resize', closeMenus);
    window.addEventListener('scroll', closeMenus, true);

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
    // React 渲染后再兜一次
    setTimeout(boot, 300);
    setTimeout(boot, 1200);
})();
