document.addEventListener('DOMContentLoaded', () => {
    const stonesContainer = document.getElementById('stones-catalog');
    const accessoriesContainer = document.getElementById('accessories-catalog');
    const whatsappNumber = "5583999486999";
    
    let currentModalImages = [];
    let currentModalImageIndex = 0;

    const isLocalServer = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const API_BASE = (isLocalServer && window.location.port !== '5000') ? 'http://127.0.0.1:5000' : '';
    const isStaticHost = window.location.hostname.endsWith('github.io') || window.location.protocol === 'file:';

    let products = [];

    // ── Renderizar e carregar produtos ──
    function renderProducts(data) {
        products = data;
        renderSection('pedra', stonesContainer);
        renderSection('acessorio', accessoriesContainer);
        if (document.getElementById('table-general-modal')?.classList.contains('active')) {
            renderAdminTable();
        }
    }

    function fetchProducts() {
        if (isStaticHost) {
            // No GitHub Pages: window.products já foi carregado pelo <script src="products.js">
            // que o navegador baixa direto do servidor, sempre atualizado.
            // O cache local só é usado se há itens pendentes de sync.
            const localCache = localStorage.getItem('vidal_products_cache');
            const serverProducts = window.products || [];

            if (localCache) {
                try {
                    const cached = JSON.parse(localCache);
                    // Se cache local tem mais itens que o servidor, o sync ainda está pendente
                    if (cached.length > serverProducts.length) {
                        renderProducts(cached);
                        return;
                    }
                } catch(e) { /* ignorar cache corrompido */ }
            }
            // Usar dados frescos do servidor (products.js carregado na página)
            localStorage.setItem('vidal_products_cache', JSON.stringify(serverProducts));
            renderProducts(serverProducts);
            return;
        }

        // Servidor Flask local
        fetch(`${API_BASE}/api/products`)
            .then(res => {
                if (!res.ok) throw new Error('Falha no backend');
                return res.json();
            })
            .then(data => {
                localStorage.setItem('vidal_products_cache', JSON.stringify(data));
                renderProducts(data);
            })
            .catch(err => {
                console.warn('Erro ao carregar via API, usando window.products:', err);
                renderProducts(window.products || []);
            });
    }

    fetchProducts();

    // GSAP Initialization
    gsap.registerPlugin(ScrollTrigger);

    function createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.opacity = '0';
        
        let currentImageIndex = 0;
        const message = encodeURIComponent(`Olá! Tenho interesse no produto: ${product.name} (R$ ${product.price}). Pode me dar mais detalhes?`);
        const whatsappLink = `https://wa.me/${whatsappNumber}?text=${message}`;

        card.innerHTML = `
            <div class="card-admin-actions">
                <button class="btn-card-action edit" onclick="event.stopPropagation(); window.triggerCardEdit(${product.id})" title="Editar Produto">✏️</button>
                <button class="btn-card-action delete" onclick="event.stopPropagation(); window.triggerCardDelete(${product.id})" title="Excluir Produto">🗑️</button>
            </div>
            <div class="product-image-container">
                <div class="image-slider">
                    ${product.images.map((img, index) => `
                        <img src="${img}" 
                             alt="${product.name}" 
                             class="slider-img ${index === 0 ? 'active' : ''}"
                             onerror="this.src='https://via.placeholder.com/400x400/f8f9f8/0e3d2f?text=${encodeURIComponent(product.name)}'">
                    `).join('')}
                </div>
                
                <button class="slider-btn prev" title="Anterior">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <button class="slider-btn next" title="Próximo">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>

                <div class="slider-dots">
                    ${product.images.map((_, index) => `
                        <span class="dot ${index === 0 ? 'active' : ''}"></span>
                    `).join('')}
                </div>
            </div>
            <div class="product-info">
                <span class="product-category">${product.category}</span>
                <h3 class="product-title">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-footer">
                    <span class="product-price">R$ ${product.price}</span>
                    <a href="${whatsappLink}" target="_blank" class="buy-btn">Tenho Interesse</a>
                </div>
            </div>
        `;

        // Slider logic
        const images = card.querySelectorAll('.slider-img');
        const dots = card.querySelectorAll('.dot');
        const prevBtn = card.querySelector('.slider-btn.prev');
        const nextBtn = card.querySelector('.slider-btn.next');

        function updateSlider(newIndex) {
            images[currentImageIndex].classList.remove('active');
            dots[currentImageIndex].classList.remove('active');
            
            currentImageIndex = newIndex;
            if (currentImageIndex < 0) currentImageIndex = images.length - 1;
            if (currentImageIndex >= images.length) currentImageIndex = 0;
            
            images[currentImageIndex].classList.add('active');
            dots[currentImageIndex].classList.add('active');
        }

        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            updateSlider(currentImageIndex - 1);
        });

        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            updateSlider(currentImageIndex + 1);
        });

        // Modal functionality
        images.forEach((img, index) => {
            img.addEventListener('click', (e) => {
                e.stopPropagation();
                const modal = document.getElementById('product-modal');
                const modalImg = document.getElementById('modal-image');
                const modalCategory = document.getElementById('modal-category');
                const modalTitle = document.getElementById('modal-title');
                const modalDesc = document.getElementById('modal-description');
                const modalPrice = document.getElementById('modal-price');
                const modalWhatsapp = document.getElementById('modal-whatsapp');

                if(modal) {
                    currentModalImages = product.images;
                    currentModalImageIndex = index;
                    modalImg.src = currentModalImages[currentModalImageIndex];

                    modalCategory.textContent = product.category;
                    modalTitle.textContent = product.name;
                    modalDesc.textContent = product.description;
                    modalPrice.textContent = `R$ ${product.price}`;
                    modalWhatsapp.href = whatsappLink;

                    modal.classList.add('active');
                    document.body.style.overflow = 'hidden'; // Prevent scrolling
                }
            });
        });

        return card;
    }

    function renderSection(type, container) {
        if (!container) return;
        container.innerHTML = '';
        
        const filteredProducts = products.filter(p => p.type === type);

        if (filteredProducts.length === 0) {
            container.innerHTML = '<div class="loading">Nenhum produto encontrado.</div>';
            return;
        }

        filteredProducts.forEach((product) => {
            const card = createProductCard(product);
            container.appendChild(card);
        });

        // Animation for cards in this container
        gsap.to(container.children, {
            scrollTrigger: {
                trigger: container,
                start: "top 85%",
            },
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: "power2.out"
        });
    }

    // Hero Animations
    gsap.from(".hero-mini", { opacity: 0, y: 20, duration: 1, delay: 0.2 });
    gsap.from(".hero h1", { opacity: 0, y: 30, duration: 1, delay: 0.4 });
    gsap.from(".hero p", { opacity: 0, y: 30, duration: 1, delay: 0.6 });
    gsap.from(".hero-btns", { opacity: 0, y: 30, duration: 1, delay: 0.8 });

    // Section Animations
    gsap.utils.toArray('section').forEach(section => {
        gsap.from(section.querySelector('.section-header'), {
            scrollTrigger: {
                trigger: section,
                start: "top 80%",
            },
            opacity: 0,
            y: 50,
            duration: 1
        });
    });

    // Initial render
    renderSection('pedra', stonesContainer);
    renderSection('acessorio', accessoriesContainer);

    // Mobile Menu Toggle Logic
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const mobileOverlay = document.getElementById('mobile-overlay');
    const allNavLinks = document.querySelectorAll('.nav-links a');

    function toggleMenu() {
        mobileMenuToggle.classList.toggle('active');
        navLinks.classList.toggle('active');
        mobileOverlay.classList.toggle('active');
        document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    }

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', toggleMenu);
    }

    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', toggleMenu);
    }

    allNavLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navLinks.classList.contains('active')) {
                toggleMenu();
            }
        });
    });

    // Mouse Parallax
    document.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth) - 0.5;
        const y = (e.clientY / window.innerHeight) - 0.5;

        gsap.to('.bg-decor', {
            x: x * 50,
            y: y * 50,
            duration: 1,
            ease: "power2.out",
            stagger: 0.05
        });
    });

    // Modal Close Logic
    const modal = document.getElementById('product-modal');
    if (modal) {
        const closeModal = document.querySelector('.close-modal');
        closeModal.addEventListener('click', () => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        });

        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });

        // Modal Slider Logic
        const modalPrevBtn = document.getElementById('modal-prev');
        const modalNextBtn = document.getElementById('modal-next');
        const modalImg = document.getElementById('modal-image');

        if (modalPrevBtn && modalNextBtn && modalImg) {
            modalPrevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (currentModalImages.length > 0) {
                    currentModalImageIndex = (currentModalImageIndex - 1 + currentModalImages.length) % currentModalImages.length;
                    modalImg.src = currentModalImages[currentModalImageIndex];
                }
            });

            modalNextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (currentModalImages.length > 0) {
                    currentModalImageIndex = (currentModalImageIndex + 1) % currentModalImages.length;
                    modalImg.src = currentModalImages[currentModalImageIndex];
                }
            });
        }
    }

    /* ==========================================================================
       MODULO ADMINISTRATIVO INTEGRADO (CMS INTEGRADO)
       ========================================================================== */

    // 1. Controle de Modais Admin (Abrir / Fechar)
    function openAdminModal(id) {
        const m = document.getElementById(id);
        if (m) {
            m.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeAdminModal(id) {
        const m = document.getElementById(id);
        if (m) {
            m.classList.remove('active');
            // Só libera o overflow se nenhum outro modal estiver aberto
            if (!document.querySelector('.modal-admin.active') && !document.querySelector('.modal.active')) {
                document.body.style.overflow = '';
            }
        }
    }

    window.openAdminModal = openAdminModal;
    window.closeAdminModal = closeAdminModal;

    // 2. Sistema de Notificações Toast Modernas
    function showToast(message, type = 'info', duration = 4000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast-alert ${type}`;
        
        let icon = 'ℹ️';
        if (type === 'success') icon = '✅';
        if (type === 'error') icon = '❌';
        if (type === 'info' && message.includes('Sincronizando')) {
            icon = '<span class="spinner-icon">🔄</span>';
        }
        
        toast.innerHTML = `<div>${icon}</div><div>${message}</div>`;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 400);
        }, duration);
        
        return toast;
    }
    window.showToast = showToast;

    // 3. Autenticação & Modo Admin
    const loginForm = document.getElementById('login-form');
    const loginCpf = document.getElementById('login-cpf');

    // Máscara para CPF no input de login
    if (loginCpf) {
        loginCpf.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, "");
            if (val.length > 9) {
                val = val.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
            } else if (val.length > 6) {
                val = val.replace(/^(\d{3})(\d{3})(\d{0,3})$/, "$1.$2.$3");
            } else if (val.length > 3) {
                val = val.replace(/^(\d{3})(\d{0,3})$/, "$1.$2");
            }
            e.target.value = val;
        });
    }

    function enableAdminMode() {
        document.body.classList.add('admin-mode-active');
        sessionStorage.setItem('adminMode', 'true');
        const loginBtn = document.getElementById('admin-login-btn');
        if (loginBtn) loginBtn.textContent = 'Painel Ativo';
        
        // Re-renderiza para exibir botões de edição nos cards
        renderSection('pedra', stonesContainer);
        renderSection('acessorio', accessoriesContainer);
    }

    function disableAdminMode() {
        document.body.classList.remove('admin-mode-active');
        sessionStorage.removeItem('adminMode');
        const loginBtn = document.getElementById('admin-login-btn');
        if (loginBtn) loginBtn.textContent = 'Entrar';
        
        // Re-renderiza para remover os botões de edição nos cards
        renderSection('pedra', stonesContainer);
        renderSection('acessorio', accessoriesContainer);
        showToast("🚪 Modo Administrador desativado.", "info");
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const cpf = document.getElementById('login-cpf').value.trim();
            const password = document.getElementById('login-password').value;

            // Validação: qualquer e-mail, CPF e senha fixos
            if (cpf === '570.384.654-49' && password === '#Deusefiel122009') {
                showToast("🔑 Acesso administrativo concedido!", "success");
                closeAdminModal('login-modal');
                enableAdminMode();
                loginForm.reset();
            } else {
                showToast("❌ E-mail, CPF ou Senha incorretos.", "error");
            }
        });
    }

    // Ouvintes globais de ativação / saída do admin
    document.getElementById('admin-login-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (document.body.classList.contains('admin-mode-active')) {
            showToast("👑 Você está logado na Área Administrativa!", "success");
        } else {
            openAdminModal('login-modal');
        }
    });

    document.getElementById('close-login-btn')?.addEventListener('click', () => closeAdminModal('login-modal'));
    document.getElementById('admin-logout-btn')?.addEventListener('click', disableAdminMode);

    // 4. Seção Retrátil (Accordion) no formulário do Produto
    const collTrigger = document.getElementById('collapsible-trigger');
    const collContainer = document.querySelector('.collapsible-container');
    if (collTrigger && collContainer) {
        collTrigger.addEventListener('click', () => {
            collContainer.classList.toggle('active');
        });
    }

    // 5. Configuração do GitHub
    document.getElementById('admin-gh-btn')?.addEventListener('click', () => {
        document.getElementById('gh-admin-token').value = localStorage.getItem('gh-token') || '';
        document.getElementById('gh-admin-owner').value = localStorage.getItem('gh-owner') || '';
        document.getElementById('gh-admin-repo').value = localStorage.getItem('gh-repo') || '';
        document.getElementById('gh-admin-branch').value = localStorage.getItem('gh-branch') || 'main';
        openAdminModal('github-config-modal');
    });

    document.getElementById('close-github-config-btn')?.addEventListener('click', () => closeAdminModal('github-config-modal'));

    document.getElementById('github-admin-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        localStorage.setItem('gh-token', document.getElementById('gh-admin-token').value.trim());
        localStorage.setItem('gh-owner', document.getElementById('gh-admin-owner').value.trim());
        localStorage.setItem('gh-repo', document.getElementById('gh-admin-repo').value.trim());
        localStorage.setItem('gh-branch', document.getElementById('gh-admin-branch').value.trim());
        showToast("⚙️ Dados do GitHub gravados no navegador!", "success");
        closeAdminModal('github-config-modal');
    });

    // 6. Sincronização com o GitHub
    function syncWithGitHub() {
        const token = localStorage.getItem('gh-token');
        const owner = localStorage.getItem('gh-owner');
        const repo = localStorage.getItem('gh-repo');
        const branch = localStorage.getItem('gh-branch') || 'main';

        if (!token || !owner || !repo) {
            showToast("⚠️ Alteração salva localmente. Configure o GitHub no botão ⚙️ para publicar na Web.", "info", 8000);
            return;
        }

        const toast = showToast("🔄 Sincronizando alterações com o GitHub...", "info", 15000);

        const url = `https://api.github.com/repos/${owner}/${repo}/contents/products.js`;
        const productsContent = `const products = ${JSON.stringify(products, null, 4)};\n`;

        // 1. Obter o SHA do arquivo atual no repositório
        fetch(url, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Cache-Control': 'no-cache'
            }
        })
        .then(res => {
            if (res.status === 404) {
                // Se não existir, cria sem SHA
                return { sha: null };
            }
            if (!res.ok) {
                throw new Error(`Erro ao obter metadata do repositório (status ${res.status})`);
            }
            return res.json();
        })
        .then(data => {
            const sha = data.sha;
            
            // 2. Converter conteúdo para base64 com suporte a UTF-8
            const utf8Bytes = new TextEncoder().encode(productsContent);
            let binary = '';
            const len = utf8Bytes.byteLength;
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(utf8Bytes[i]);
            }
            const base64Content = btoa(binary);

            const bodyData = {
                message: 'Atualizar catálogo de produtos via Painel Administrativo',
                content: base64Content,
                branch: branch
            };
            if (sha) {
                bodyData.sha = sha;
            }

            return fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify(bodyData)
            });
        })
        .then(res => {
            if (toast) toast.remove();
            if (!res.ok) {
                return res.json().then(errData => {
                    let detailedMsg = errData.message || `Erro HTTP ${res.status}`;
                    if (res.status === 401 || res.status === 403) {
                        detailedMsg = `Token inválido, expirado ou sem permissão 'repo' (Status: ${res.status})`;
                    } else if (res.status === 404) {
                        detailedMsg = `Repositório não encontrado. Verifique Owner e Repo (Status: 404)`;
                    } else if (res.status === 409) {
                        detailedMsg = `Conflito de edição. Alguém modificou o arquivo antes de você (Status: 409)`;
                    }
                    throw new Error(detailedMsg);
                }).catch(e => {
                    if (e.message.includes('Token') || e.message.includes('Repositório') || e.message.includes('Conflito')) {
                        throw e; // Repassa nosso erro amigável
                    }
                    throw new Error(`Erro HTTP ${res.status} (Falha ao ler detalhes)`);
                });
            }
            showToast("✅ Publicado com sucesso no GitHub! O site será atualizado em 1 a 2 minutos.", "success", 6000);
        })
        .catch(err => {
            if (toast) toast.remove();
            console.error('Erro na sincronização com GitHub:', err);
            
            let finalMsg = err.message;
            if (finalMsg === 'Failed to fetch') {
                finalMsg = "Falha de conexão. O Token pode estar incorreto, expirado, ou há um problema de rede.";
            }
            
            showToast(`❌ Erro GitHub: ${finalMsg}`, "error", 10000);
        });
    }

    // 7. Lógica de Gerenciamento de Produtos (Criação, Edição, Remoção)
    let uploadedImagesBase64 = [];
    const adminFilePreview = document.getElementById('admin-image-preview');
    const adminFileInput = document.getElementById('product-admin-file-input');

    // Helper para redimensionar imagem antes do base64
    function resizeImage(file, maxWidth, maxHeight) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width *= maxHeight / height;
                            height = maxHeight;
                        }
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.8));
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    }

    function addAdminPreviewImage(base64) {
        uploadedImagesBase64.push(base64);
        
        const wrapper = document.createElement('div');
        wrapper.className = 'image-preview-wrapper';
        
        const imgEl = document.createElement('img');
        imgEl.src = base64;
        
        const removeBtn = document.createElement('span');
        removeBtn.className = 'image-preview-remove';
        removeBtn.innerHTML = '&times;';
        
        removeBtn.onclick = () => {
            const idx = uploadedImagesBase64.indexOf(base64);
            if(idx > -1) uploadedImagesBase64.splice(idx, 1);
            wrapper.remove();
        };

        wrapper.appendChild(imgEl);
        wrapper.appendChild(removeBtn);
        adminFilePreview.appendChild(wrapper);
    }

    if (adminFileInput) {
        adminFileInput.addEventListener('change', async (e) => {
            const files = e.target.files;
            if (!files.length) return;

            for (let file of files) {
                if (file.type.startsWith('image/')) {
                    try {
                        const base64 = await resizeImage(file, 800, 800);
                        addAdminPreviewImage(base64);
                    } catch (err) {
                        console.error(err);
                        showToast("Falha ao processar arquivo de imagem.", "error");
                    }
                }
            }
            adminFileInput.value = '';
        });
    }

    const productAdminForm = document.getElementById('product-admin-form');
    const productModalTitle = document.getElementById('product-modal-title');
    const productAdminId = document.getElementById('product-admin-id');
    const productAdminName = document.getElementById('product-admin-name');
    const productAdminType = document.getElementById('product-admin-type');
    const productAdminCategory = document.getElementById('product-admin-category');
    const productAdminPrice = document.getElementById('product-admin-price');
    const productAdminDesc = document.getElementById('product-admin-description');
    const productAdminBenefits = document.getElementById('product-admin-benefits');
    const productAdminImages = document.getElementById('product-admin-images');

    // Novo Produto
    document.getElementById('admin-new-btn')?.addEventListener('click', () => {
        productAdminForm.reset();
        productAdminId.value = '';
        productModalTitle.textContent = 'Adicionar Produto';
        uploadedImagesBase64 = [];
        adminFilePreview.innerHTML = '';
        document.querySelector('.collapsible-container')?.classList.remove('active');
        openAdminModal('product-admin-modal');
    });

    document.getElementById('close-product-admin-btn')?.addEventListener('click', () => closeAdminModal('product-admin-modal'));
    document.getElementById('cancel-product-admin-btn')?.addEventListener('click', () => closeAdminModal('product-admin-modal'));

    // Editar Produto
    function editProductLogic(id) {
        const product = products.find(p => p.id === id);
        if (!product) return;

        productModalTitle.textContent = 'Editar Produto';
        productAdminId.value = product.id;
        productAdminName.value = product.name;
        productAdminType.value = product.type;
        productAdminCategory.value = product.category || '';
        productAdminPrice.value = product.price || '';
        productAdminDesc.value = product.description || '';
        productAdminBenefits.value = product.benefits || '';
        
        uploadedImagesBase64 = [];
        adminFilePreview.innerHTML = '';
        let urls = [];

        if (product.images && Array.isArray(product.images)) {
            product.images.forEach(img => {
                if (img.startsWith('data:image')) {
                    addAdminPreviewImage(img);
                } else {
                    urls.push(img);
                }
            });
        }

        productAdminImages.value = urls.join(', ');
        document.querySelector('.collapsible-container')?.classList.remove('active');
        openAdminModal('product-admin-modal');
    }
    window.triggerCardEdit = editProductLogic;

    // Excluir Produto
    function deleteProductLogic(id) {
        const product = products.find(p => p.id === id);
        if (!product) return;

        if (confirm(`Tem certeza que deseja excluir o produto "${product.name}"?`)) {
            if (isStaticHost) {
                products = products.filter(p => p.id !== id);
                localStorage.setItem('vidal_products_cache', JSON.stringify(products));
                showToast(`🗑️ "${product.name}" excluído localmente.`, "success");
                
                renderSection('pedra', stonesContainer);
                renderSection('acessorio', accessoriesContainer);
                if (document.getElementById('table-general-modal')?.classList.contains('active')) {
                    renderAdminTable();
                }
                
                syncWithGitHub();
                return;
            }

            fetch(`${API_BASE}/api/products/${id}`, { method: 'DELETE' })
                .then(res => {
                    if (res.ok) {
                        showToast(`🗑️ "${product.name}" excluído.`, "success");
                        fetchProducts();
                    } else {
                        showToast("Erro ao excluir produto.", "error");
                    }
                })
                .catch(err => {
                    console.error(err);
                    showToast("Erro ao excluir produto.", "error");
                });
        }
    }
    window.triggerCardDelete = deleteProductLogic;

    // Submissão do Formulário de Produto
    productAdminForm?.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = productAdminName.value.trim();
        const type = productAdminType.value;
        
        // Smart Defaults (Valores inteligentes se em branco)
        let price = productAdminPrice.value.trim();
        if (!price) price = "Sob Consulta";

        let category = productAdminCategory.value.trim();
        if (!category) {
            category = type === 'pedra' ? 'Pedra Natural' : 'Acessório';
        }

        let desc = productAdminDesc.value.trim();
        if (!desc) {
            desc = `Lindo(a) ${name}, selecionado(a) especialmente para trazer sofisticação e ótimas energias ao seu dia.`;
        }

        let benefits = productAdminBenefits.value.trim();
        if (!benefits) {
            benefits = "Harmonização energética, beleza e exclusividade.";
        }

        // Imagens
        const imagesStr = productAdminImages.value.trim();
        const urlsArray = imagesStr.split(',').map(img => img.trim()).filter(img => img !== '');
        const finalImagesArray = [...urlsArray, ...uploadedImagesBase64];

        if (finalImagesArray.length === 0) {
            // Imagem padrão elegante
            finalImagesArray.push("https://images.unsplash.com/photo-1567653418876-5bb0e566e1c2?auto=format&fit=crop&q=80&w=800");
        }

        const productData = {
            name,
            type,
            category,
            price,
            description: desc,
            benefits,
            images: finalImagesArray
        };

        const productId = productAdminId.value ? parseInt(productAdminId.value) : null;

        if (isStaticHost) {
            if (productId) {
                // Editar
                const idx = products.findIndex(p => p.id === productId);
                if (idx > -1) {
                    products[idx] = { id: productId, ...productData };
                }
            } else {
                // Novo
                const maxId = products.reduce((max, p) => p.id > max ? p.id : max, 0);
                const newProduct = { id: maxId + 1, ...productData };
                products.push(newProduct);
            }

            localStorage.setItem('vidal_products_cache', JSON.stringify(products));
            showToast(`✅ "${name}" salvo localmente!`, "success");
            closeAdminModal('product-admin-modal');

            renderSection('pedra', stonesContainer);
            renderSection('acessorio', accessoriesContainer);
            if (document.getElementById('table-general-modal')?.classList.contains('active')) {
                renderAdminTable();
            }

            syncWithGitHub();
            return;
        }

        const url = productId ? `/api/products/${productId}` : '/api/products';
        const method = productId ? 'PUT' : 'POST';

        fetch(`${API_BASE}${url}`, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        })
        .then(res => {
            if (res.ok) {
                showToast(`✅ "${name}" salvo com sucesso!`, "success");
                closeAdminModal('product-admin-modal');
                fetchProducts();
            } else {
                showToast("Erro ao salvar produto.", "error");
            }
        })
        .catch(err => {
            console.error(err);
            showToast("Erro ao salvar produto.", "error");
        });
    });

    // 8. Tabela Geral de Produtos (Modal)
    function renderAdminTable() {
        const tbody = document.getElementById('products-tbody');
        if (!tbody) return;

        tbody.innerHTML = '';
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Nenhum produto cadastrado.</td></tr>';
            return;
        }

        products.forEach(p => {
            const tr = document.createElement('tr');
            const mainImage = (p.images && p.images.length > 0) ? p.images[0] : 'https://via.placeholder.com/50';

            tr.innerHTML = `
                <td>#${p.id}</td>
                <td><img src="${mainImage}" class="table-product-preview" alt="${p.name}"></td>
                <td><strong>${p.name}</strong></td>
                <td><span style="text-transform: capitalize;">${p.type}</span></td>
                <td>${p.category}</td>
                <td>R$ ${p.price}</td>
                <td>
                    <button class="btn-table-edit" onclick="triggerTableEdit(${p.id})">Editar</button>
                    <button class="btn-table-delete" onclick="triggerTableDelete(${p.id})">Excluir</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    window.triggerTableEdit = (id) => {
        closeAdminModal('table-general-modal');
        editProductLogic(id);
    };

    window.triggerTableDelete = (id) => {
        deleteProductLogic(id);
    };

    document.getElementById('admin-table-btn')?.addEventListener('click', () => {
        renderAdminTable();
        openAdminModal('table-general-modal');
    });
    document.getElementById('close-table-general-btn')?.addEventListener('click', () => closeAdminModal('table-general-modal'));

    // 9. Persistência de Login (Iniciar logado se já autenticado na aba)
    if (sessionStorage.getItem('adminMode') === 'true') {
        enableAdminMode();
    }
});
