// Estado do personagem
// Garante que a animação glitch esteja sempre disponível
if (!document.getElementById('glitch-keyframes')) {
    const style = document.createElement('style');
    style.id = 'glitch-keyframes';
    style.textContent = `
    @keyframes glitch {
        0% { transform: none; }
        10% { transform: skewX(-2deg) scaleY(1.01); }
        20% { transform: translate(-2px, 1px) skewX(2deg); }
        30% { transform: translate(2px, -1px) skewX(-1deg); }
        40% { transform: skewX(1deg) scaleY(0.99); }
        50% { transform: none; }
        60% { transform: translate(1px, 2px) skewX(1deg); }
        70% { transform: translate(-1px, -2px) skewX(-2deg); }
        80% { transform: skewX(2deg) scaleY(1.01); }
        90% { transform: translate(2px, 1px) skewX(-1deg); }
        100% { transform: none; }
    }
    `;
    document.head.appendChild(style);
}
let character = {
    // Identidade
    apelido: '',
    aparencia: '',
    esquema: '',
    detalhesEsquema: '',
    
    // Atitudes
    atitudes: {
        agressiva: { value: 0, bugado: false },
        sagaz: { value: 0, bugado: false },
        empatica: { value: 0, bugado: false },
        furtiva: { value: 0, bugado: false }
    },
    // Perícias
    pericias: {
        analise: { value: 0, bugado: false },
        atletismo: { value: 0, bugado: false },
        'mano-a-mano': { value: 0, bugado: false },
        programacao: { value: 0, bugado: false },
        influencia: { value: 0, bugado: false },
        pilotagem: { value: 0, bugado: false },
        tiro: { value: 0, bugado: false },
        gambiarra: { value: 0, bugado: false },
        ciencias: { value: 0, bugado: false },
        manha: { value: 0, bugado: false }
    },
    
    // Especializações
    especializacoes: {},
    
    // Ampliações
    ampliacoes: [],
    
    // Equipamentos
    carga: 5,
    equipamentos: {},
    
    // Estresse e Dano
    estresse: [],
    dano: {
        leve: 0,
        moderado: 0,
        grave: false
    },
    exausta: false,
    sobrecarregada: false,
    atitudeBugada: '',
    consequenciaSobrecarga: '',

    // Imagem do personagem
    imagemPersonagem: null
};

// Cache de elementos DOM para melhor performance
const domCache = {
    atitudeStatus: null,
    periciaStatus: null,
    cargaStatus: null,
    equipmentCheckboxes: null,
    stressCheckboxes: null,
    damageCheckboxes: null
};

// Função de debounce para otimizar performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Versões debounced das funções custosas
const debouncedValidateAtitudes = debounce(validateAtitudes, 50);
const debouncedValidatePericias = debounce(validatePericias, 50);
const debouncedUpdateCargaStatus = debounce(updateCargaStatus, 100);

// Função para adicionar selo diegético de bugado (aparece só no hover ou se bugado)
function addBugSealToItems(selector) {
    document.querySelectorAll(selector).forEach(item => {
        // Remove selos antigos
        item.querySelectorAll('.bug-seal').forEach(seal => seal.remove());
        item.style.position = 'relative';
        item.style.overflow = 'visible';
        item.style.zIndex = '2';
        const seal = document.createElement('div');
        seal.className = 'bug-seal';
        seal.title = 'Marcar como bugado';
        seal.innerHTML = '<span>B</span>';
        // Estilo diegético: selo quadrado como os dice-box das outras páginas
        Object.assign(seal.style, {
            zIndex: '10',
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '32px',
            height: '32px',
            borderRadius: '6px', // Quadrado com bordas arredondadas como dice-box
            background: item.classList.contains('bugado') ? 'var(--bg-card)' : 'var(--bg-card)',
            color: item.classList.contains('bugado') ? 'var(--neon-pink)' : 'var(--neon-cyan)',
            border: item.classList.contains('bugado') ? '2px solid var(--neon-pink)' : '2px solid var(--neon-cyan)',
            fontFamily: 'Orbitron, monospace',
            fontWeight: '900',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: item.classList.contains('bugado') ? '0 0 15px var(--neon-pink-glow)' : 'none',
            cursor: 'pointer',
            opacity: item.classList.contains('bugado') ? '1' : '0', // Invisível quando não bugado
            pointerEvents: item.classList.contains('bugado') ? 'auto' : 'none',
            transition: 'all 0.3s ease', // Mesma transição dos dice-box
            zIndex: '5',
            userSelect: 'none',
            visibility: item.classList.contains('bugado') ? 'visible' : 'hidden', // Garante que esteja oculto
            textShadow: 'var(--text-glow)',
        });
        // Garante que o item nunca tenha sombra
        item.style.boxShadow = 'none';
        // Hover para mostrar selo
        item.addEventListener('mouseenter', () => {
            if (!item.classList.contains('bugado')) {
                seal.style.visibility = 'visible';
                seal.style.opacity = '1';
                seal.style.pointerEvents = 'auto';
                seal.style.color = 'var(--neon-cyan)';
                seal.style.border = '2px solid var(--neon-cyan)';
                seal.style.boxShadow = '0 0 10px rgba(77, 208, 225, 0.3)';
            }
        });
        item.addEventListener('mouseleave', () => {
            if (!item.classList.contains('bugado')) {
                seal.style.visibility = 'hidden';
                seal.style.opacity = '0';
                seal.style.pointerEvents = 'none';
                seal.style.color = 'var(--neon-cyan)';
                seal.style.border = '2px solid var(--neon-cyan)';
                seal.style.boxShadow = 'none';
            }
        });
        seal.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            // Permite alternar bugado mesmo equipado
            item.classList.toggle('bugado');
            // Garante que o item nunca tenha sombra
            item.style.boxShadow = 'none';
            // Procura um input[type=checkbox] dentro do item
            const checkbox = item.querySelector('input[type="checkbox"]');
            const equipado = checkbox && checkbox.checked;
            // Atualiza visual do selo
            if (item.classList.contains('bugado')) {
                seal.style.background = 'var(--bg-card)';
                seal.style.color = 'var(--neon-pink)';
                seal.style.border = '2px solid var(--neon-pink)';
                seal.style.boxShadow = '0 0 15px var(--neon-pink-glow)';
                seal.style.opacity = '1';
                seal.style.visibility = 'visible';
                seal.style.pointerEvents = 'auto';
                applyGlitchEffect(item);
            } else {
                seal.style.background = 'var(--bg-card)';
                seal.style.color = 'var(--neon-cyan)';
                seal.style.border = '2px solid var(--neon-cyan)';
                seal.style.boxShadow = 'none';
                seal.style.opacity = '0';
                seal.style.visibility = 'hidden';
                seal.style.pointerEvents = 'none';
                removeGlitchEffect(item);
            }
        });

        // Aplica o efeito se já estiver bugado ao carregar
        // E garante que o item nunca tenha sombra
        item.style.boxShadow = 'none';
        if (item.classList.contains('bugado')) {
            applyGlitchEffect(item);
            seal.style.opacity = '1';
            seal.style.pointerEvents = 'auto';
            seal.style.color = '#fff';
            seal.style.border = '2.5px solid #ff1744';
            seal.style.boxShadow = '0 0 4px 1px #ff1744';
            seal.querySelector('span').style.textShadow = '0 0 8px #ff1744, 0 0 2px #fff';
        } else {
            removeGlitchEffect(item);
            seal.style.opacity = '0.25';
            seal.style.pointerEvents = 'none';
            seal.style.color = 'rgba(77, 208, 225, 0.25)';
            seal.style.border = '2.5px solid rgba(77, 208, 225, 0.25)';
            seal.style.boxShadow = '0 0 8px 1px rgba(77, 208, 225, 0.15)';
            seal.querySelector('span').style.textShadow = '0 0 6px rgba(77, 208, 225, 0.15)';
        }

        // Se houver checkbox, atualiza efeito glitch ao equipar/desequipar
        const checkboxListener = item.querySelector('input[type="checkbox"]');
        if (checkboxListener) {
            checkboxListener.addEventListener('change', function() {
                // Garante que o item nunca tenha sombra
                item.style.boxShadow = 'none';
                if (item.classList.contains('bugado')) {
                    applyGlitchEffect(item);
                } else {
                    removeGlitchEffect(item);
                }
            });
        }

        // Função para aplicar efeito glitch
        function applyGlitchEffect(target) {
            removeGlitchEffect(target);
            target.style.position = 'relative';
            target.style.overflow = 'visible';
            target.style.boxShadow = 'none';
            target.style.setProperty('filter', 'contrast(1.2) brightness(1.1)', 'important');
            target.style.setProperty('animation', 'glitch 0.7s infinite linear', 'important');
        }
        // Função para remover efeito glitch
        function removeGlitchEffect(target) {
            target.style.removeProperty('filter');
            target.style.removeProperty('animation');
            target.style.boxShadow = 'none';
        }
        item.appendChild(seal);
        // Garante que o selo nunca seja escondido por overflow do item
        seal.style.zIndex = '10';
        seal.style.pointerEvents = seal.style.pointerEvents || 'none';

        // Se houver checkbox, atualiza efeito glitch ao equipar/desequipar
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (checkbox) {
            checkbox.addEventListener('change', function() {
                if (item.classList.contains('bugado')) {
                    applyGlitchEffect(item);
                } else {
                    removeGlitchEffect(item);
                }
            });
        }
    });
}

// Adiciona glitch visual para atitudes e perícias bugadas
function applyGlitchToBuggedDice() {
    // Atitudes
    Object.keys(character.atitudes).forEach(atitude => {
        const isBugado = character.atitudes[atitude]?.bugado;
        const bugBtn = document.querySelector(`[data-atitude="${atitude}"][data-value="bugado"]`);
        let container = null;
        if (bugBtn) {
            container = bugBtn.closest('.atitude-column') || bugBtn.closest('.atitude-item');
        }
        if (container) {
            if (isBugado) {
                container.style.setProperty('filter', 'contrast(1.2) brightness(1.1)', 'important');
                container.style.setProperty('animation', 'glitch 0.7s infinite linear', 'important');
                console.log('GLITCH ATITUDE CONTAINER', container, container.style.animation);
            } else {
                container.style.removeProperty('filter');
                container.style.removeProperty('animation');
            }
            container.style.boxShadow = 'none';
        }
        if (bugBtn) {
            if (isBugado) {
                bugBtn.style.setProperty('filter', 'contrast(1.2) brightness(1.1)', 'important');
                bugBtn.style.setProperty('animation', 'glitch 0.7s infinite linear', 'important');
                console.log('GLITCH ATITUDE BOTAO', bugBtn, bugBtn.style.animation);
            } else {
                bugBtn.style.removeProperty('filter');
                bugBtn.style.removeProperty('animation');
            }
            bugBtn.style.boxShadow = 'none';
        }
    });
    // Perícias
    Object.keys(character.pericias).forEach(pericia => {
        const isBugado = character.pericias[pericia]?.bugado;
        let nomePericia = pericia.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
        if (pericia === 'mano-a-mano') nomePericia = 'mano-a-mano';
        const bugBtn = document.querySelector(`[data-pericia="${nomePericia}"][data-value="bugado"]`);
        let container = null;
        if (bugBtn) {
            container = bugBtn.closest('.pericia-item') || bugBtn.closest('.pericia-column');
        }
        if (container) {
            if (isBugado) {
                container.style.setProperty('filter', 'contrast(1.2) brightness(1.1)', 'important');
                container.style.setProperty('animation', 'glitch 0.7s infinite linear', 'important');
                console.log('GLITCH PERICIA CONTAINER', container, container.style.animation);
            } else {
                container.style.removeProperty('filter');
                container.style.removeProperty('animation');
            }
            container.style.boxShadow = 'none';
        }
        if (bugBtn) {
            if (isBugado) {
                bugBtn.style.setProperty('filter', 'contrast(1.2) brightness(1.1)', 'important');
                bugBtn.style.setProperty('animation', 'glitch 0.7s infinite linear', 'important');
                console.log('GLITCH PERICIA BOTAO', bugBtn, bugBtn.style.animation);
            } else {
                bugBtn.style.removeProperty('filter');
                bugBtn.style.removeProperty('animation');
            }
            bugBtn.style.boxShadow = 'none';
        }
    });
}
// Inicialização
// ===== INICIALIZAÇÃO PRINCIPAL =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado!');
    
    // Cachear elementos DOM importantes
    domCache.atitudeStatus = document.getElementById('atitude-status');
    domCache.periciaStatus = document.getElementById('pericia-status');
    domCache.cargaStatus = document.getElementById('carga-status');
    domCache.equipmentCheckboxes = document.querySelectorAll('input[type="checkbox"][name^="equip-"]');
    domCache.stressCheckboxes = document.querySelectorAll('input[name^="stress-"]');
    domCache.damageCheckboxes = document.querySelectorAll('input[name^="dano-"]');

    console.log('Inicializando componentes...');
    
    initializeTabs();
    initializeFormHandlers();
    initializeDiceBoxes();
    initializeValidation();
    initializeEquipmentCategories();
    initializeSaveLoad();
    initializeImageUpload();

    console.log('Componentes inicializados!');

    // Adiciona selo diegético B para equipamentos e ampliações
    setTimeout(() => {
        addBugSealToItems('.equipment-item');
        addBugSealToItems('.ampliacao-item-eq');
        // Aplica glitch visual para atitudes e perícias bugadas ao carregar
        applyGlitchToBuggedDice();
    }, 0);
});

// Sistema de Navegação
function initializeTabs() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            
            // Remove active class from all tabs and contents
            navBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            btn.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
}

// Manipuladores de Formulário (otimizados)
function initializeFormHandlers() {
    // Identidade
    const apelido = document.getElementById('apelido');
    const aparencia = document.getElementById('aparencia');
    const esquema = document.getElementById('esquema');
    const detalhesEsquema = document.getElementById('detalhes-esquema');
    
    if (apelido) apelido.addEventListener('input', (e) => character.apelido = e.target.value);
    if (aparencia) aparencia.addEventListener('input', (e) => character.aparencia = e.target.value);
    if (esquema) esquema.addEventListener('change', (e) => character.esquema = e.target.value);
    if (detalhesEsquema) detalhesEsquema.addEventListener('input', (e) => character.detalhesEsquema = e.target.value);

    // Especializações com event delegation
    document.addEventListener('input', function(event) {
        if (event.target.matches('.especializacao-input')) {
            handleEspecializacaoChange(event);
        }
    });
    
    // Carga
    document.addEventListener('change', function(event) {
        if (event.target.matches('input[name="carga"]')) {
            character.carga = parseInt(event.target.value);
            debouncedUpdateCargaStatus();
        }
        
        // Equipamentos
        if (event.target.matches('input[type="checkbox"][name^="equip-"]')) {
            handleEquipmentChange(event);
        }
        
        // Estresse
        if (event.target.matches('input[name^="stress-"]')) {
            handleStressChange();
        }
        
        // Dano
        if (event.target.matches('input[name^="dano-"]')) {
            handleDamageChange();
        }
        
        // Estados
        if (event.target.id === 'exausta') {
            character.exausta = event.target.checked;
        }
        
        if (event.target.id === 'sobrecarregada') {
            character.sobrecarregada = event.target.checked;
        }
    });
}

// Sistema de Caixas de Dados Interativas
function initializeDiceBoxes() {
    // Inicializar caixas de atitudes
    document.querySelectorAll('[data-atitude]').forEach(box => {
        box.addEventListener('click', handleAtitudeDiceClick);
    });
    
    // Inicializar caixas de perícias
    document.querySelectorAll('[data-pericia]').forEach(box => {
        box.addEventListener('click', handlePericiaDiceClick);
    });
    
    // Atualizar estado inicial dos botões de especialização
    updateEspecializacaoButtons();
}

function handleAtitudeDiceClick(event) {
    const box = event.target;
    const atitude = box.dataset.atitude;
    const value = box.dataset.value;
    
    if (value === 'bugado') {
        // Toggle bugado
        const isBugado = box.classList.contains('active');
        box.classList.toggle('active');
        character.atitudes[atitude].bugado = !isBugado;
    } else {
        // Toggle this individual box
        box.classList.toggle('active');
        
        // Calcular valor usando cache local para evitar querySelectorAll
        let totalValue = 0;
        const atitudeContainer = box.closest('.atitude-column') || box.closest('.atitude-item');
        if (atitudeContainer) {
            const activeBoxes = atitudeContainer.querySelectorAll(`[data-atitude="${atitude}"][data-value]:not([data-value="bugado"]).active`);
            activeBoxes.forEach(activeBox => {
                totalValue += parseInt(activeBox.dataset.value);
            });
        }
        
        character.atitudes[atitude].value = totalValue;
    }
    
    // Usar requestAnimationFrame para otimizar a validação
    debouncedValidateAtitudes();
    // Aplica glitch visual imediatamente após interação
    applyGlitchToBuggedDice();
}

function handlePericiaDiceClick(event) {
    const box = event.target;
    const pericia = box.dataset.pericia;
    const value = box.dataset.value;
    const periciaContainer = box.closest('.pericia-item') || box.closest('.pericia-column');
    
    if (value === 'bugado') {
        // Toggle bugado
        const isBugado = box.classList.contains('active');
        box.classList.toggle('active');
        character.pericias[pericia].bugado = !isBugado;
    } else if (value === '3') {
        // Botão de especialização - verificar se já houver 2 pontos
        let currentValue = 0;
        if (periciaContainer) {
            const currentActiveBoxes = periciaContainer.querySelectorAll(`[data-pericia="${pericia}"][data-value]:not([data-value="bugado"]):not([data-value="3"]).active`);
            currentActiveBoxes.forEach(activeBox => {
                currentValue += parseInt(activeBox.dataset.value);
            });
        }
        
        // Só permite clicar na especialização se já houver pelo menos 2 pontos
        if (currentValue < 2 && !box.classList.contains('active')) {
            return; // Não faz nada se não houver 2 pontos e está tentando ativar
        }
        
        // Toggle this individual box
        box.classList.toggle('active');
        
        // Recalcular o valor total usando container local
        let totalValue = 0;
        if (periciaContainer) {
            const activeBoxes = periciaContainer.querySelectorAll(`[data-pericia="${pericia}"][data-value]:not([data-value="bugado"]).active`);
            activeBoxes.forEach(activeBox => {
                totalValue += parseInt(activeBox.dataset.value);
            });
        }
        
        character.pericias[pericia].value = totalValue;
    } else {
        // Toggle this individual box (pontos 1 e 2)
        box.classList.toggle('active');
        
        // Recalcular o valor total usando container local
        let totalValue = 0;
        if (periciaContainer) {
            const activeBoxes = periciaContainer.querySelectorAll(`[data-pericia="${pericia}"][data-value]:not([data-value="bugado"]).active`);
            activeBoxes.forEach(activeBox => {
                totalValue += parseInt(activeBox.dataset.value);
            });
        }
        
        // Limitar a 3 pontos máximo por perícia
        if (totalValue > 3) {
            // Se exceder 3, desfazer a última ação
            box.classList.toggle('active');
            return;
        }
        
        character.pericias[pericia].value = totalValue;
    }
    
    // Usar requestAnimationFrame para otimizar atualizações
    requestAnimationFrame(() => {
        updateEspecializacaoButtons();
        debouncedValidatePericias();
        applyGlitchToBuggedDice();
    });
}

function validateAtitudes() {
    const values = Object.values(character.atitudes).map(att => att.value);
    const total = values.reduce((sum, val) => sum + val, 0);
    const twoCount = values.filter(val => val === 2).length;
    const oneCount = values.filter(val => val === 1).length;
    
    const status = domCache.atitudeStatus;
    if (!status) return; // Proteção se elemento não existir
    
    if (twoCount === 1 && oneCount === 2 && total === 4) {
        status.textContent = 'Distribuição correta!';
        status.className = 'status-message valid';
    } else {
        status.textContent = 'Distribua: um ++ e dois +';
        status.className = 'status-message invalid';
    }
    
    // Usar requestAnimationFrame para otimizar
    requestAnimationFrame(() => updateDiceCalculatorOptions());
}

function validatePericias() {
    const values = Object.values(character.pericias).map(per => per.value);
    const total = values.reduce((sum, val) => sum + val, 0);
    
    const status = domCache.periciaStatus;
    if (!status) return; // Proteção se elemento não existir
    
    if (total === 8) {
        status.textContent = 'Distribuição correta!';
        status.className = 'status-message valid';
    } else if (total < 8) {
        status.textContent = `Restam ${8 - total} pontos para distribuir`;
        status.className = 'status-message';
    } else {
        status.textContent = `Excesso de ${total - 8} pontos`;
        status.className = 'status-message invalid';
    }
    
    // Usar requestAnimationFrame para otimizar
    requestAnimationFrame(() => updateDiceCalculatorOptions());
}

// Especializações
function handleEspecializacaoChange() {
    const inputs = document.querySelectorAll('.especializacao-input');
    
    inputs.forEach(input => {
        const periciaName = input.dataset.pericia;
        character.especializacoes[periciaName] = input.value;
    });
}

// Atualizar visual dos botões de especialização
function updateEspecializacaoButtons() {
    // Para cada perícia, verificar se pode usar especialização
    Object.keys(character.pericias).forEach(pericia => {
        // Padronizar nome para o formato com hífens
        let nomePericia = pericia.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
        if (pericia === 'mano-a-mano') nomePericia = 'mano-a-mano';
        const especializacaoBox = document.querySelector(`[data-pericia="${nomePericia}"][data-value="3"]`);
        if (!especializacaoBox) return;
        // Calcular pontos atuais excluindo a especialização
        const activeBoxes = document.querySelectorAll(`[data-pericia="${nomePericia}"][data-value]:not([data-value="bugado"]):not([data-value="3"]).active`);
        let currentValue = 0;
        activeBoxes.forEach(activeBox => {
            currentValue += parseInt(activeBox.dataset.value);
        });
        // Se o botão está ativo, nunca deve estar desabilitado
        if (especializacaoBox.classList.contains('active')) {
            especializacaoBox.classList.remove('disabled');
            especializacaoBox.title = '3 pontos (Especialização)';
        } else if (currentValue < 2) {
            especializacaoBox.classList.add('disabled');
            especializacaoBox.title = 'Precisa de pelo menos 2 pontos na perícia';
        } else {
            especializacaoBox.classList.remove('disabled');
            especializacaoBox.title = '3 pontos (Especialização)';
        }
    });
}

// Equipamentos
function handleEquipmentChange() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"][name^="equip-"]');
    
    checkboxes.forEach(checkbox => {
        character.equipamentos[checkbox.name] = {
            checked: checkbox.checked,
            weight: parseInt(checkbox.dataset.weight) || 1
        };
    });
    
    updateCargaStatus();
}

// Função para toggle das categorias de equipamentos
function toggleCategoria(headerElement) {
    const categoria = headerElement.parentElement;
    categoria.classList.toggle('collapsed');
}

// Função para atualizar contadores das categorias (otimizada)
function updateCategoriaCounter(categoria) {
    const categoriaElement = document.querySelector(`[data-categoria="${categoria}"]`)?.closest('.categoria-equipamento');
    if (!categoriaElement) return;
    
    const selectedItems = categoriaElement.querySelectorAll('input[type="checkbox"]:checked');
    const counter = categoriaElement.querySelector('.categoria-counter');
    const totalItems = categoriaElement.querySelectorAll('input[type="checkbox"]').length;
    
    // Atualizar contador
    if (counter) {
        counter.textContent = `(${selectedItems.length}/${totalItems})`;
    }
}

// Flag para evitar múltiplas inicializações
let equipmentCategoriesInitialized = false;

// Inicializar event listeners para equipamentos (otimizado com event delegation)
function initializeEquipmentCategories() {
    if (equipmentCategoriesInitialized) {
        return;
    }
    
    // Usar event delegation no body para capturar todos os checkboxes de equipamentos
    document.body.addEventListener('change', function(event) {
        if (event.target.matches('input[data-categoria]')) {
            const categoria = event.target.dataset.categoria;
            updateCategoriaCounter(categoria);
            debouncedUpdateCargaStatus(); // Usar versão debounced
        }
    });
    
    // Inicializar estado das categorias (todas fechadas)
    document.querySelectorAll('.categoria-equipamento').forEach(categoria => {
        categoria.classList.add('collapsed');
    });
    
    // Atualizar contadores iniciais
    const categorias = ['armas', 'protecoes', 'maquinas', 'ferramentas', 'kits', 'carga'];
    categorias.forEach(categoria => {
        updateCategoriaCounter(categoria);
    });
    
    equipmentCategoriesInitialized = true;
}

// Status da Carga otimizado
function updateCargaStatus() {
    let totalWeight = 0;
    
    // Usar cache de checkboxes para melhor performance
    if (domCache.equipmentCheckboxes) {
        domCache.equipmentCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const weight = parseInt(checkbox.dataset.weight) || 1;
                totalWeight += weight;
            }
        });
    }
    
    const maxCarga = character.carga;
    const status = domCache.cargaStatus;
    if (!status) return; // Proteção se elemento não existir
    
    if (totalWeight <= maxCarga) {
        status.textContent = `${totalWeight}/${maxCarga} pontos de carga`;
        status.className = 'status-message valid';
    } else {
        status.textContent = `Sobrecarga! ${totalWeight}/${maxCarga} pontos de carga`;
        status.className = 'status-message invalid';
    }
}

// Estresse otimizado
function handleStressChange() {
    if (!domCache.stressCheckboxes) return;
    
    const specialStressElement = document.querySelector('input[name="stress-special"]');
    const specialStressChecked = specialStressElement ? specialStressElement.checked : false;
    
    character.estresse = Array.from(domCache.stressCheckboxes).map(cb => cb.checked);
    
    // Usar requestAnimationFrame para otimizar
    requestAnimationFrame(() => updateStressIndicator(specialStressChecked));
}

// Dano otimizado
function handleDamageChange() {
    // Usar cache ou consultas mais específicas
    const danoLeveElements = document.querySelectorAll('input[name^="dano-leve"]:checked');
    const danoModeradoElements = document.querySelectorAll('input[name^="dano-moderado"]:checked');
    const danoGraveElement = document.querySelector('input[name="dano-grave"]');
    
    const danoLeve = danoLeveElements.length;
    const danoModerado = danoModeradoElements.length;
    const danoGrave = danoGraveElement ? danoGraveElement.checked : false;
    
    // Atualizar estado do personagem
    character.dano = {
        leve: danoLeve,
        moderado: danoModerado,
        grave: danoGrave
    };
    
    // Usar requestAnimationFrame para otimizar
    requestAnimationFrame(() => updateDamageIndicators(danoLeve, danoModerado, danoGrave));
}

// Atualizar indicador de estresse (sobrecarregada)
function updateStressIndicator(specialStressActive) {
    const indicatorSobrecarregada = document.getElementById('indicator-sobrecarregada');
    
    // Indicador de SOBRECARREGADA (bloco especial S marcado)
    if (specialStressActive) {
        showDamageIndicator(indicatorSobrecarregada, 'sobrecarregada');
    } else {
        hideDamageIndicator(indicatorSobrecarregada);
    }
}

// Atualizar indicadores visuais de dano
function updateDamageIndicators(danoLeve, danoModerado, danoGrave, specialStressActive = null) {
    const indicatorLeve = document.getElementById('indicator-leve');
    const indicatorModerado = document.getElementById('indicator-moderado');
    const indicatorGrave = document.getElementById('indicator-grave');
    
    // Indicador de Dano Leve (2 caixas = ▽E)
    if (danoLeve >= 2) {
        showDamageIndicator(indicatorLeve, 'leve');
    } else {
        hideDamageIndicator(indicatorLeve);
    }
    
    // Indicador de Dano Moderado (2 caixas = -1d)
    if (danoModerado >= 2) {
        showDamageIndicator(indicatorModerado, 'moderado');
    } else {
        hideDamageIndicator(indicatorModerado);
    }
    
    // Indicador de Dano Grave (1 caixa = EXAUSTA)
    if (danoGrave) {
        showDamageIndicator(indicatorGrave, 'grave');
    } else {
        hideDamageIndicator(indicatorGrave);
    }
    
    // Se specialStressActive foi fornecido, atualizar também o indicador de estresse
    if (specialStressActive !== null) {
        updateStressIndicator(specialStressActive);
    }
}

function showDamageIndicator(indicator, type) {
    if (!indicator) return;
    
    indicator.className = `damage-indicator ${type}`;
    indicator.style.display = 'flex';
}

function hideDamageIndicator(indicator) {
    if (!indicator) return;
    
    if (indicator.style.display !== 'none') {
        indicator.classList.add('fade-out');
        setTimeout(() => {
            indicator.style.display = 'none';
            indicator.classList.remove('fade-out');
        }, 300);
    }
}

// Ampliações
// Sistema de Dados
function initializeDiceSystem() {
    updateDiceCalculatorOptions();
    

}



// Validação
function initializeValidation() {
    // Validar perícias ao carregar
    const periciaInputs = document.querySelectorAll('.pericia-input');
    periciaInputs.forEach(input => {
        input.addEventListener('input', function() {
            const value = parseInt(this.value);
            if (value > 3) {
                this.value = 3;
            }
        });
    });

    // Perícias
    document.querySelectorAll('.pericia-input').forEach(input => {
        const name = input.name.replace(/-/g, '');
        const finalName = name === 'manoamano' ? 'manoAmano' : name;
        character.pericias[finalName] = parseInt(input.value) || 0;
    });
    
    // Especializações
    document.querySelectorAll('.especializacao-input').forEach(input => {
        const periciaName = input.name.replace('-esp', '').replace(/-/g, '');
        const finalName = periciaName === 'manoamano' ? 'manoAmano' : periciaName;
        character.especializacoes[finalName] = input.value;
    });
    
    // Carga
    const cargaRadio = document.querySelector('input[name="carga"]:checked');
    if (cargaRadio) character.carga = parseInt(cargaRadio.value);
    
    // Equipamentos
    character.equipamentos = {};
    document.querySelectorAll('input[type="checkbox"][name^="equip-"]').forEach(checkbox => {
        if (checkbox.checked) {
            character.equipamentos[checkbox.name] = {
                checked: true,
                weight: parseInt(checkbox.dataset.weight) || 1
            };
        } else {
            character.equipamentos[checkbox.name] = {
                checked: false,
                weight: parseInt(checkbox.dataset.weight) || 1
            };
        }
    });
    
    // Estresse
    character.estresse = [];
    document.querySelectorAll('input[name^="stress-"]').forEach((checkbox, index) => {
        character.estresse[index] = checkbox.checked;
    });
    
    // Dano
    const danoLeve = document.querySelectorAll('input[name^="dano-leve"]:checked').length;
    const danoModerado = document.querySelectorAll('input[name^="dano-moderado"]:checked').length;
    const danoGrave = document.querySelector('input[name="dano-grave"]').checked;
    
    character.dano = {
        leve: danoLeve,
        moderado: danoModerado,
        grave: danoGrave
    };
    
    // Estados
    character.ajuda = document.querySelector('input[name="ajuda"]')?.checked || false;
    character.exausta = document.querySelector('input[name="exausta"]')?.checked || false;
    character.sobrecarregada = document.querySelector('input[name="sobrecarregada"]')?.checked || false;
    
    const retrospecto = document.querySelector('input[name="retrospecto"]:checked');
    character.retrospecto = retrospecto ? parseInt(retrospecto.value) : 0;
    
    // Ampliações
    character.ampliacoes = [];
    
    // Ampliações da seção de equipamentos
    document.querySelectorAll('.ampliacoes-grid-equipamentos .ampliacao-item-eq').forEach((item, index) => {
        const nome = item.querySelector(`input[name^="ampliacao-nome-eq"]`)?.value || '';
        const efeito = item.querySelector(`textarea[name^="ampliacao-efeito-eq"]`)?.value || '';
        
        if (nome || efeito) {
            character.ampliacoes.push({ nome, efeito, fonte: 'equipamentos' });
        }
    });
}

// Esta função foi removida como parte da refatoração do sistema de salvamento

function populateForm() {
    // Identidade
    document.getElementById('apelido').value = character.apelido || '';
    document.getElementById('aparencia').value = character.aparencia || '';
    document.getElementById('esquema').value = character.esquema || '';
    document.getElementById('detalhes-esquema').value = character.detalhesEsquema || '';
    
    // Atitudes - atualizar caixas de dados
    Object.entries(character.atitudes).forEach(([nome, atitude]) => {
        // Limpar todas as caixas desta atitude
        document.querySelectorAll(`[data-atitude="${nome}"]`).forEach(box => {
            box.classList.remove('active');
        });
        
        // Ativar caixas baseado no valor total
        let remainingValue = atitude.value || 0;
        
        // Ativar caixas de valor 2 primeiro (mais eficiente)
        const box2 = document.querySelector(`[data-atitude="${nome}"][data-value="2"]`);
        while (remainingValue >= 2 && box2) {
            box2.classList.add('active');
            remainingValue -= 2;
            break; // Só pode ter uma caixa de valor 2
        }
        
        // Ativar caixas de valor 1 para o restante
        const box1 = document.querySelector(`[data-atitude="${nome}"][data-value="1"]`);
        while (remainingValue >= 1 && box1) {
            box1.classList.add('active');
            remainingValue -= 1;
            break; // Só pode ter uma caixa de valor 1
        }
        
        // Ativar caixa bugada se necessário
        if (atitude.bugado) {
            const bugBox = document.querySelector(`[data-atitude="${nome}"][data-value="bugado"]`);
            if (bugBox) bugBox.classList.add('active');
        }
    });
    
    // Perícias - atualizar caixas de dados
    Object.entries(character.pericias).forEach(([nome, pericia]) => {
        // Padronizar nome para o formato com hífens (ex: mano-a-mano)
        let nomePericia = nome.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
        // Exceção para nomes já corretos
        if (nome === 'mano-a-mano') nomePericia = 'mano-a-mano';
        // Limpar todas as caixas desta perícia
        document.querySelectorAll(`[data-pericia="${nomePericia}"]`).forEach(box => {
            box.classList.remove('active');
        });
        // Ativar caixas baseado no valor total
        let remainingValue = pericia.value || 0;
        // Ativar caixa de valor 3 primeiro (mais eficiente)
        const box3 = document.querySelector(`[data-pericia="${nomePericia}"][data-value="3"]`);
        if (remainingValue >= 3 && box3) {
            box3.classList.add('active');
            remainingValue -= 3;
        }
        // Ativar caixas de valor 2
        const box2 = document.querySelector(`[data-pericia="${nomePericia}"][data-value="2"]`);
        if (remainingValue >= 2 && box2) {
            box2.classList.add('active');
            remainingValue -= 2;
        }
        // Ativar caixas de valor 1 para o restante
        const box1 = document.querySelector(`[data-pericia="${nomePericia}"][data-value="1"]`);
        if (remainingValue >= 1 && box1) {
            box1.classList.add('active');
            remainingValue -= 1;
        }
        // Ativar caixa bugada se necessário
        if (pericia.bugado) {
            const bugBox = document.querySelector(`[data-pericia="${nomePericia}"][data-value="bugado"]`);
            if (bugBox) bugBox.classList.add('active');
        }
    });
    
    // Especializações
    Object.entries(character.especializacoes || {}).forEach(([nome, valor]) => {
        // Padronizar nome para o formato com hífens
        let nomePericia = nome.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
        if (nome === 'mano-a-mano') nomePericia = 'mano-a-mano';
        const input = document.querySelector(`input[data-pericia="${nomePericia}"]`);
        if (input) input.value = valor;
    });
    
    // Carga
    const cargaRadio = document.querySelector(`input[name="carga"][value="${character.carga}"]`);
    if (cargaRadio) cargaRadio.checked = true;
    
    // Equipamentos
    Object.entries(character.equipamentos || {}).forEach(([nome, equipData]) => {
        const checkbox = document.querySelector(`input[name="${nome}"]`);
        if (checkbox) {
            // Suporte para formato antigo (boolean) e novo formato (objeto)
            const isChecked = typeof equipData === 'boolean' ? equipData : equipData.checked;
            checkbox.checked = isChecked;
        }
    });
    
    // Estresse
    character.estresse.forEach((checked, index) => {
        const checkbox = document.querySelector(`input[name="stress-${index + 1}"]`);
        if (checkbox) checkbox.checked = checked;
    });
    
    // Dano
    if (character.dano) {
        // Carregar dano leve
        const danoLeveCheckboxes = document.querySelectorAll('input[name^="dano-leve"]');
        for (let i = 0; i < Math.min(character.dano.leve || 0, danoLeveCheckboxes.length); i++) {
            danoLeveCheckboxes[i].checked = true;
        }
        
        // Carregar dano moderado
        const danoModeradoCheckboxes = document.querySelectorAll('input[name^="dano-moderado"]');
        for (let i = 0; i < Math.min(character.dano.moderado || 0, danoModeradoCheckboxes.length); i++) {
            danoModeradoCheckboxes[i].checked = true;
        }
        
        // Carregar dano grave
        const danoGraveCheckbox = document.querySelector('input[name="dano-grave"]');
        if (danoGraveCheckbox) danoGraveCheckbox.checked = character.dano.grave || false;
        
        // Atualizar indicadores
        const specialStressActive = document.querySelector('input[name="stress-special"]').checked;
        updateDamageIndicators(
            character.dano.leve || 0,
            character.dano.moderado || 0,
            character.dano.grave || false,
            specialStressActive
        );
    }
    
    // Estados
    if (character.ajuda) {
        const ajudaCheckbox = document.querySelector('input[name="ajuda"]');
        if (ajudaCheckbox) ajudaCheckbox.checked = true;
    }
    
    if (character.retrospecto) {
        const retrospecto = document.querySelector(`input[name="retrospecto"][value="${character.retrospecto}"]`);
        if (retrospecto) retrospecto.checked = true;
    }
    
    // Carregar ampliações
    if (character.ampliacoes && character.ampliacoes.length > 0) {
        character.ampliacoes.forEach((ampliacao, index) => {
            // Adicionar apenas na seção de equipamentos (3 colunas fixas)
            const container = document.querySelector('.ampliacoes-grid-equipamentos');
            const item = container.querySelectorAll('.ampliacao-item-eq')[Math.min(index, 2)]; // Máximo 3 ampliações
            
            if (item && index < 3) {
                const nomeInput = item.querySelector('input[name^="ampliacao-nome-eq"]');
                const efeitoTextarea = item.querySelector('textarea[name^="ampliacao-efeito-eq"]');
                
                if (nomeInput) nomeInput.value = ampliacao.nome || '';
                if (efeitoTextarea) efeitoTextarea.value = ampliacao.efeito || '';
            }
        });
    }
    
    // Atualizar validações
    handleAtitudeChange();
    handlePericiaChange();
    updateCargaStatus();
    updateEspecializacaoButtons();
    
    // Atualizar contadores de equipamentos
    setTimeout(() => {
        ['armas', 'protecoes', 'maquinas', 'ferramentas', 'kits', 'carga'].forEach(categoria => {
            const firstCheckbox = document.querySelector(`[data-categoria="${categoria}"]`);
            if (firstCheckbox) {
                updateCategoriaCounter(categoria);
            }
        });
    }, 100);
}

// Sistema de Salvar/Carregar Ficha
function coletarDadosFicha() {
    const dadosFicha = {
        // Metadados
        versao: "1.0",
        dataExportacao: new Date().toISOString(),
        
        // Identidade
        apelido: document.getElementById('apelido')?.value || '',
        aparencia: document.getElementById('aparencia')?.value || '',
        esquema: document.getElementById('esquema')?.value || '',
        detalhesEsquema: document.getElementById('detalhes-esquema')?.value || '',
        
        // Imagem do personagem
        imagemPersonagem: character.imagemPersonagem || null,
        
        // Atitudes
        atitudes: {},
        
        // Perícias
        pericias: {},
        especializacoes: {},
        
        // Ampliações
        ampliacoes: [],
        
        // Equipamentos
        carga: parseInt(document.querySelector('input[name="carga"]:checked')?.value) || 5,
        equipamentos: {},
        
        // Dano e Estresse
        dano: {
            leve: 0,
            moderado: 0,
            grave: false
        },
        estresse: [],
        // Estados (controles automáticos baseados em dano/estresse)
        estados: {
            exausta: false, // Será controlado automaticamente pelo dano grave
            sobrecarregada: false, // Será controlado automaticamente pelo estresse especial
            atitudeBugada: '', // Campo de texto para qual atitude está bugada
            consequenciaSobrecarga: '' // Campo de texto para consequência
        }
    };
    
    // Coletar atitudes
    ['agressiva', 'sagaz', 'empatica', 'furtiva'].forEach(atitude => {
        const diceBoxes = document.querySelectorAll(`[data-atitude="${atitude}"]`);
        let value = 0;
        let bugado = false;
        
        diceBoxes.forEach(box => {
            if (box.classList.contains('active')) {
                if (box.classList.contains('bugado')) {
                    bugado = true;
                }
                value++;
            }
        });
        
        dadosFicha.atitudes[atitude] = { value, bugado };
    });
    
    // Coletar perícias
    const pericias = ['analise', 'atletismo', 'mano-a-mano', 'programacao', 'influencia', 
                     'pilotagem', 'tiro', 'gambiarra', 'ciencias', 'manha'];
    
    pericias.forEach(pericia => {
        const diceBoxes = document.querySelectorAll(`[data-pericia="${pericia}"]`);
        let value = 0;
        let bugado = false;
        
        diceBoxes.forEach(box => {
            if (box.classList.contains('active')) {
                if (box.classList.contains('bugado')) {
                    bugado = true;
                }
                value++;
            }
        });
        
        dadosFicha.pericias[pericia] = { value, bugado };
        
        // Verificar especialização
        const especInput = document.querySelector(`input[data-pericia="${pericia}"]`);
        if (especInput?.value) {
            dadosFicha.especializacoes[pericia] = especInput.value;
        }
    });
    
    // Coletar ampliações
    document.querySelectorAll('.ampliacoes-grid-equipamentos .ampliacao-item-eq').forEach((item, index) => {
        const nome = item.querySelector(`input[name^="ampliacao-nome-eq"]`)?.value || '';
        const efeito = item.querySelector(`textarea[name^="ampliacao-efeito-eq"]`)?.value || '';
        const integrada = item.querySelector(`input[type="checkbox"]`)?.checked || false;
        
        if (nome || efeito) {
            dadosFicha.ampliacoes.push({ nome, efeito, integrada });
        }
    });
    
    // Coletar equipamentos
    document.querySelectorAll('input[data-categoria]').forEach(checkbox => {
        if (checkbox.checked) {
            const categoria = checkbox.dataset.categoria;
            const nome = checkbox.name.replace('equip-', '');
            const weight = parseInt(checkbox.dataset.weight) || 1;
            
            if (!dadosFicha.equipamentos[categoria]) {
                dadosFicha.equipamentos[categoria] = [];
            }
            dadosFicha.equipamentos[categoria].push({ nome, weight });
        }
    });
    
    // Coletar dano
    const danoLeve = document.querySelectorAll('input[name^="dano-leve"]:checked').length;
    const danoModerado = document.querySelectorAll('input[name^="dano-moderado"]:checked').length;
    const danoGrave = document.querySelector('input[name="dano-grave"]')?.checked || false;
    
    dadosFicha.dano = {
        leve: danoLeve,
        moderado: danoModerado,
        grave: danoGrave
    };
    
    // Coletar estresse
    const estresseNormal = [];
    document.querySelectorAll('input[name^="stress-"]:not([name="stress-special"]):checked').forEach(checkbox => {
        estresseNormal.push(checkbox.name);
    });
    
    const estresseEspecial = document.querySelector('input[name="stress-special"]')?.checked || false;
    
    dadosFicha.estresse = {
        normal: estresseNormal,
        especial: estresseEspecial
    };
    
    return dadosFicha;
}

function aplicarDadosFicha(dadosFicha) {
    try {
        // Aplicar identidade
        if (dadosFicha.apelido) document.getElementById('apelido').value = dadosFicha.apelido;
        if (dadosFicha.aparencia) document.getElementById('aparencia').value = dadosFicha.aparencia;
        if (dadosFicha.esquema) document.getElementById('esquema').value = dadosFicha.esquema;
        if (dadosFicha.detalhesEsquema) document.getElementById('detalhes-esquema').value = dadosFicha.detalhesEsquema;
        
        // Aplicar imagem do personagem
        if (dadosFicha.imagemPersonagem) {
            setPersonagemImage(dadosFicha.imagemPersonagem);
        } else {
            removePersonagemImage();
        }
        
        // Limpar estados anteriores
        document.querySelectorAll('.dice-box.active').forEach(box => box.classList.remove('active'));
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => checkbox.checked = false);
        
        // Aplicar atitudes
        if (dadosFicha.atitudes) {
            Object.entries(dadosFicha.atitudes).forEach(([atitude, data]) => {
                const diceBoxes = document.querySelectorAll(`[data-atitude="${atitude}"]`);
                for (let i = 0; i < data.value && i < diceBoxes.length; i++) {
                    const box = diceBoxes[i];
                    box.classList.add('active');
                    if (data.bugado && box.classList.contains('bugado')) {
                        // Se é bugado, só marcar a caixa bugada
                        diceBoxes.forEach(b => b.classList.remove('active'));
                        box.classList.add('active');
                        break;
                    }
                }
            });
        }
        
        // Aplicar perícias
        if (dadosFicha.pericias) {
            Object.entries(dadosFicha.pericias).forEach(([pericia, data]) => {
                // Padronizar nome para o formato com hífens
                let nomePericia = pericia.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
                if (pericia === 'mano-a-mano') nomePericia = 'mano-a-mano';
                // Limpar todas as caixas antes de ativar
                const allBoxes = document.querySelectorAll(`[data-pericia="${nomePericia}"]`);
                allBoxes.forEach(box => box.classList.remove('active'));
                let remaining = data.value || 0;
                // Ativar caixas de valor 1 e 2 normalmente
                const box1 = document.querySelector(`[data-pericia="${nomePericia}"][data-value="1"]`);
                const box2 = document.querySelector(`[data-pericia="${nomePericia}"][data-value="2"]`);
                let pontosRestantes = data.value || 0;
                // Ativar caixa de valor 2 se possível
                if (pontosRestantes >= 2 && box2) {
                    box2.classList.add('active');
                    pontosRestantes -= 2;
                }
                // Ativar caixa de valor 1 para o restante
                if (pontosRestantes >= 1 && box1) {
                    box1.classList.add('active');
                    pontosRestantes -= 1;
                }
                // Se o valor for 3, ative também a especialização
                if (data.value === 3) {
                    const box3 = document.querySelector(`[data-pericia="${nomePericia}"][data-value="3"]`);
                    if (box3) {
                        box3.classList.add('active');
                        box3.classList.remove('disabled');
                    }
                }
                // Ativar caixa bugada se necessário
                if (data.bugado) {
                    const bugBox = document.querySelector(`[data-pericia="${nomePericia}"][data-value="bugado"]`);
                    if (bugBox) {
                        // Se é bugado, só marcar a caixa bugada
                        allBoxes.forEach(b => b.classList.remove('active'));
                        bugBox.classList.add('active');
                    }
                }
            });
        }
        // Aplicar especializações
        if (dadosFicha.especializacoes) {
            Object.entries(dadosFicha.especializacoes).forEach(([pericia, especializacao]) => {
                // Padronizar nome para o formato com hífens
                let nomePericia = pericia.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');
                if (pericia === 'mano-a-mano') nomePericia = 'mano-a-mano';
                const input = document.querySelector(`input[data-pericia="${nomePericia}"]`);
                if (input) {
                    input.value = especializacao;
                }
            });
        }
        
        // Aplicar ampliações
        if (dadosFicha.ampliacoes) {
            const container = document.querySelector('.ampliacoes-grid-equipamentos');
            if (container) {
                dadosFicha.ampliacoes.forEach((ampliacao, index) => {
                    const item = container.querySelectorAll('.ampliacao-item-eq')[Math.min(index, 2)]; // Máximo 3 ampliações
                    if (item) {
                        const nomeInput = item.querySelector('input[name^="ampliacao-nome-eq"]');
                        const efeitoTextarea = item.querySelector('textarea[name^="ampliacao-efeito-eq"]');
                        const integradaCheckbox = item.querySelector('input[type="checkbox"]');
                        
                        if (nomeInput) nomeInput.value = ampliacao.nome || '';
                        if (efeitoTextarea) efeitoTextarea.value = ampliacao.efeito || '';
                        if (integradaCheckbox) integradaCheckbox.checked = ampliacao.integrada || false;
                    }
                });
            }
        }
        
        // Aplicar carga
        if (dadosFicha.carga) {
            const cargaRadio = document.querySelector(`input[name="carga"][value="${dadosFicha.carga}"]`);
            if (cargaRadio) cargaRadio.checked = true;
        }
        
        // Aplicar equipamentos
        if (dadosFicha.equipamentos) {
            Object.entries(dadosFicha.equipamentos).forEach(([categoria, itens]) => {
                itens.forEach(item => {
                    const checkbox = document.querySelector(`input[name="equip-${item.nome}"]`);
                    if (checkbox) checkbox.checked = true;
                });
            });
        }
        
        // Aplicar dano
        if (dadosFicha.dano) {
            // Dano leve
            for (let i = 1; i <= dadosFicha.dano.leve; i++) {
                const checkbox = document.querySelector(`input[name="dano-leve-${i}"]`);
                if (checkbox) checkbox.checked = true;
            }
            
            // Dano moderado
            for (let i = 1; i <= dadosFicha.dano.moderado; i++) {
                const checkbox = document.querySelector(`input[name="dano-moderado-${i}"]`);
                if (checkbox) checkbox.checked = true;
            }
            
            // Dano grave
            if (dadosFicha.dano.grave) {
                const checkbox = document.querySelector('input[name="dano-grave"]');
                if (checkbox) checkbox.checked = true;
            }
        }
        
        // Aplicar estresse
        if (dadosFicha.estresse) {
            if (dadosFicha.estresse.normal) {
                dadosFicha.estresse.normal.forEach(stressName => {
                    const checkbox = document.querySelector(`input[name="${stressName}"]`);
                    if (checkbox) checkbox.checked = true;
                });
            }
            
            if (dadosFicha.estresse.especial) {
                const checkbox = document.querySelector('input[name="stress-special"]');
                if (checkbox) checkbox.checked = true;
            }
        }
        
        // Aplicar estados (os estados são controlados automaticamente pelo dano/estresse)
        // Não há controles manuais para exausta/sobrecarregada no HTML atual
        
        // Atualizar validações e contadores
        debouncedValidateAtitudes();
        debouncedValidatePericias();
        debouncedUpdateCargaStatus();
        
        // Atualizar contadores de equipamentos
        ['armas', 'protecoes', 'maquinas', 'ferramentas', 'kits', 'carga'].forEach(categoria => {
            updateCategoriaCounter(categoria);
        });
        
        // Mostrar mensagem de sucesso
        mostrarNotificacao('Ficha carregada com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao aplicar dados da ficha:', error);
        mostrarNotificacao('Erro ao carregar a ficha. Verifique se o arquivo está correto.', 'error');
    }
}

function salvarFicha() {
    try {
        const dadosFicha = coletarDadosFicha();
        const nomePersonagem = dadosFicha.apelido || 'personagem';
        const dataAtual = new Date().toISOString().split('T')[0];
        const nomeArquivo = `${nomePersonagem}_${dataAtual}.json`;
        
        const blob = new Blob([JSON.stringify(dadosFicha, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = nomeArquivo;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        
        mostrarNotificacao(`Ficha salva como: ${nomeArquivo}`, 'success');
        
    } catch (error) {
        console.error('Erro ao salvar ficha:', error);
        mostrarNotificacao('Erro ao salvar a ficha.', 'error');
    }
}

function carregarFicha() {
    const fileInput = document.getElementById('file-input');
    fileInput.click();
}

function mostrarNotificacao(mensagem, tipo = 'info') {
    // Remover notificação anterior se existir
    const notificacaoExistente = document.querySelector('.notificacao');
    if (notificacaoExistente) {
        notificacaoExistente.remove();
    }
    
    const notificacao = document.createElement('div');
    notificacao.className = `notificacao ${tipo}`;
    notificacao.textContent = mensagem;
    
    // Estilos inline para a notificação
    Object.assign(notificacao.style, {
        position: 'fixed',
        top: '90px',
        right: '20px',
        padding: '15px 20px',
        borderRadius: '8px',
        fontFamily: 'Orbitron, monospace',
        fontWeight: '700',
        fontSize: '14px',
        zIndex: '10000',
        maxWidth: '300px',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
        animation: 'slideInRight 0.3s ease',
        border: '2px solid',
        textAlign: 'center'
    });
    
    // Cores baseadas no tipo
    if (tipo === 'success') {
        notificacao.style.backgroundColor = 'rgba(102, 187, 106, 0.9)';
        notificacao.style.borderColor = '#66bb6a';
        notificacao.style.color = '#0f1419';
    } else if (tipo === 'error') {
        notificacao.style.backgroundColor = 'rgba(229, 115, 115, 0.9)';
        notificacao.style.borderColor = '#e57373';
        notificacao.style.color = '#0f1419';
    } else {
        notificacao.style.backgroundColor = 'rgba(77, 208, 225, 0.9)';
        notificacao.style.borderColor = '#4dd0e1';
        notificacao.style.color = '#0f1419';
    }
    
    document.body.appendChild(notificacao);
    
    // Remover após 4 segundos
    setTimeout(() => {
        if (notificacao.parentNode) {
            notificacao.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notificacao.remove(), 300);
        }
    }, 4000);
}

// Inicializar sistema de salvar/carregar
function initializeSaveLoad() {
    const salvarBtn = document.getElementById('salvar-ficha');
    const carregarBtn = document.getElementById('carregar-ficha');
    const fileInput = document.getElementById('file-input');
    
    if (salvarBtn) {
        salvarBtn.addEventListener('click', salvarFicha);
    }
    
    if (carregarBtn) {
        carregarBtn.addEventListener('click', carregarFicha);
    }
    
    if (fileInput) {
        fileInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const dadosFicha = JSON.parse(e.target.result);
                        aplicarDadosFicha(dadosFicha);
                    } catch (error) {
                        console.error('Erro ao ler arquivo:', error);
                        mostrarNotificacao('Arquivo inválido. Selecione um arquivo JSON válido.', 'error');
                    }
                };
                reader.readAsText(file);
            }
            // Limpar o input para permitir recarregar o mesmo arquivo
            event.target.value = '';
        });
    }
}

// Adicionar animações CSS para as notificações
const notificationStyle = document.createElement('style');
notificationStyle.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(notificationStyle);

// Adicionar estilos CSS para os indicadores de dano
const style = document.createElement('style');
style.textContent = `
    .damage-indicators {
        position: fixed;
        top: 50%;
        right: 20px;
        transform: translateY(-50%);
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .damage-indicator {
        background: rgba(0, 0, 0, 0.9);
        border: 2px solid;
        border-radius: 8px;
        padding: 8px 12px;
        font-family: 'Orbitron', monospace;
        font-weight: 700;
        font-size: 14px;
        text-align: center;
        animation: pulse 2s infinite;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    }

    /* Cores organizadas dos indicadores de dano */
    .damage-indicator:nth-child(1) {
        border-color: #ffaa00;
        color: #ffaa00;
        text-shadow: 0 0 10px rgba(255, 170, 0, 0.8);
    }

    .damage-indicator:nth-child(2) {
        border-color: #ff6b6b;
        color: #ff6b6b;
        text-shadow: 0 0 10px rgba(255, 107, 107, 0.8);
    }

    .damage-indicator:nth-child(3) {
        border-color: #dc2626;
        color: #dc2626;
        text-shadow: 0 0 10px rgba(220, 38, 38, 0.8);
    }

    .damage-indicator:nth-child(4) {
        border-color: #9333ea;
        color: #9333ea;
        text-shadow: 0 0 10px rgba(147, 51, 234, 0.8);
    }

    @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 0.8; }
        50% { transform: scale(1.05); opacity: 1; }
    }

    @media (max-width: 768px) {
        .damage-indicators {
            right: 10px;
            top: auto;
            bottom: 80px;
            transform: none;
        }
        
        .damage-indicator {
            font-size: 12px;
            padding: 6px 10px;
        }
    }
`;
document.head.appendChild(style);

// ===== FUNCIONALIDADE SIMPLES DE IMAGEM DO PERSONAGEM =====

// Estado da imagem
let imagemPersonagem = null;

// Adicionar ao estado do personagem
character.imagemPersonagem = null;

// Função para criar um canvas de recorte interativo
function createSimpleCropModal(imageSrc) {
    console.log('createSimpleCropModal chamada com:', imageSrc ? 'imagem válida' : 'imagem inválida');
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        backdrop-filter: blur(5px);
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: #1a1f29;
        border: 2px solid #4dd0e1;
        border-radius: 15px;
        box-shadow: 0 0 30px rgba(77, 208, 225, 0.3);
        max-width: 90vw;
        max-height: 90vh;
        width: 700px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    `;
    
    const header = document.createElement('div');
    header.style.cssText = `
        padding: 20px;
        border-bottom: 1px solid #4dd0e1;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #0f1419;
    `;
    header.innerHTML = `
        <div>
            <h3 style="color: #4dd0e1; font-family: 'Orbitron', monospace; margin: 0;">Recortar Imagem</h3>
            <p style="color: #81c784; font-size: 0.8rem; margin: 5px 0 0 0;">Clique e arraste para selecionar a área de recorte</p>
        </div>
        <button id="close-crop" style="background: none; border: none; color: #e57373; font-size: 1.5rem; cursor: pointer;">&times;</button>
    `;
    
    const body = document.createElement('div');
    body.style.cssText = `
        padding: 20px;
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        min-height: 450px;
    `;
    
    const canvasContainer = document.createElement('div');
    canvasContainer.style.cssText = `
        position: relative;
        border: 2px solid #4dd0e1;
        margin-bottom: 20px;
        background: #000;
    `;
    
    const canvas = document.createElement('canvas');
    canvas.style.cssText = `
        display: block;
        max-width: 400px;
        max-height: 400px;
    `;
    
    const cropOverlay = document.createElement('div');
    cropOverlay.style.cssText = `
        position: absolute;
        border: 2px solid #4dd0e1;
        background: rgba(77, 208, 225, 0.2);
        cursor: move;
        top: 25%;
        left: 25%;
        width: 50%;
        height: 50%;
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
        box-sizing: border-box;
    `;
    // Adiciona handles nos 4 cantos
    const handleSize = 16;
    const handles = ['nw','ne','sw','se'].map(pos => {
        const h = document.createElement('div');
        h.className = 'crop-handle crop-handle-' + pos;
        h.style.cssText = `
            position: absolute;
            width: ${handleSize}px;
            height: ${handleSize}px;
            background: #4dd0e1;
            border: 2px solid #fff;
            border-radius: 50%;
            z-index: 2;
            cursor: ${pos==='nw'||pos==='se'?'nwse-resize':'nesw-resize'};
        `;
        if(pos==='nw'){h.style.left='-8px';h.style.top='-8px';}
        if(pos==='ne'){h.style.right='-8px';h.style.top='-8px';}
        if(pos==='sw'){h.style.left='-8px';h.style.bottom='-8px';}
        if(pos==='se'){h.style.right='-8px';h.style.bottom='-8px';}
        cropOverlay.appendChild(h);
        return h;
    });
    canvasContainer.appendChild(canvas);
    canvasContainer.appendChild(cropOverlay);
    
    const footer = document.createElement('div');
    footer.style.cssText = `
        padding: 20px;
        border-top: 1px solid #4dd0e1;
        display: flex;
        justify-content: flex-end;
        gap: 15px;
        background: #0f1419;
    `;
    footer.innerHTML = `
        <button id="cancel-crop" style="padding: 10px 20px; border: 2px solid #e57373; border-radius: 8px; background: transparent; color: #e57373; cursor: pointer; font-family: 'Orbitron', monospace;">Cancelar</button>
        <button id="confirm-crop" style="padding: 10px 20px; border: 2px solid #66bb6a; border-radius: 8px; background: transparent; color: #66bb6a; cursor: pointer; font-family: 'Orbitron', monospace;">Confirmar</button>
    `;
    
    body.appendChild(canvasContainer);
    content.appendChild(header);
    content.appendChild(body);
    content.appendChild(footer);
    modal.appendChild(content);
    
    // Variáveis para controle de crop
    let isDragging = false;
    let isResizing = false;
    let resizeHandle = null;
    let startX, startY, startW, startH, startL, startT;
    let originalImage = null;
    
    // Carregar e desenhar a imagem
    const img = new Image();
    img.onload = function() {
        originalImage = img;
        
        // Calcular dimensões proporcionais
        const maxSize = 400;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
            if (width > maxSize) {
                height = (height * maxSize) / width;
                width = maxSize;
            }
        } else {
            if (height > maxSize) {
                width = (width * maxSize) / height;
                height = maxSize;
            }
        }
        
        canvas.width = width;
        canvas.height = height;
        canvasContainer.style.width = width + 'px';
        canvasContainer.style.height = height + 'px';
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Ajustar overlay inicial
        const overlaySize = Math.min(width, height) * 0.6;
        const overlayX = (width - overlaySize) / 2;
        const overlayY = (height - overlaySize) / 2;
        
        cropOverlay.style.left = overlayX + 'px';
        cropOverlay.style.top = overlayY + 'px';
        cropOverlay.style.width = overlaySize + 'px';
        cropOverlay.style.height = overlaySize + 'px';
    };
    img.src = imageSrc;
    
    // Sistema de arrastar e redimensionar o overlay
    cropOverlay.addEventListener('mousedown', function(e) {
        if (e.target === cropOverlay) {
            isDragging = true;
            const rect = canvas.getBoundingClientRect();
            startX = e.clientX - rect.left - cropOverlay.offsetLeft;
            startY = e.clientY - rect.top - cropOverlay.offsetTop;
            e.preventDefault();
        }
    });
    handles.forEach((handle, idx) => {
        handle.addEventListener('mousedown', function(e) {
            isResizing = true;
            resizeHandle = handle;
            startX = e.clientX;
            startY = e.clientY;
            startW = cropOverlay.offsetWidth;
            startH = cropOverlay.offsetHeight;
            startL = cropOverlay.offsetLeft;
            startT = cropOverlay.offsetTop;
            e.preventDefault();
            e.stopPropagation();
        });
    });
    document.addEventListener('mousemove', function(e) {
        const rect = canvas.getBoundingClientRect();
        if (isDragging) {
            let newX = e.clientX - rect.left - startX;
            let newY = e.clientY - rect.top - startY;
            // Limitar movimento dentro do canvas
            const maxX = canvas.width - cropOverlay.offsetWidth;
            const maxY = canvas.height - cropOverlay.offsetHeight;
            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));
            cropOverlay.style.left = newX + 'px';
            cropOverlay.style.top = newY + 'px';
        } else if (isResizing && resizeHandle) {
            // Redimensionar mantendo proporção 1:1
            let dx = e.clientX - startX;
            let dy = e.clientY - startY;
            let newW = startW, newH = startH, newL = startL, newT = startT;
            const minSize = 40;
            if (resizeHandle === handles[0]) { // nw
                let size = Math.max(minSize, startW - dx, startH - dy);
                newL = startL + (startW - size);
                newT = startT + (startH - size);
                newW = size;
                newH = size;
            } else if (resizeHandle === handles[1]) { // ne
                let size = Math.max(minSize, startW + dx, startH - dy);
                newT = startT + (startH - size);
                newW = size;
                newH = size;
            } else if (resizeHandle === handles[2]) { // sw
                let size = Math.max(minSize, startW - dx, startH + dy);
                newL = startL + (startW - size);
                newW = size;
                newH = size;
            } else if (resizeHandle === handles[3]) { // se
                let size = Math.max(minSize, startW + dx, startH + dy);
                newW = size;
                newH = size;
            }
            // Limitar dentro do canvas
            newL = Math.max(0, Math.min(newL, canvas.width - newW));
            newT = Math.max(0, Math.min(newT, canvas.height - newH));
            if (newL + newW > canvas.width) newW = canvas.width - newL;
            if (newT + newH > canvas.height) newH = canvas.height - newT;
            cropOverlay.style.left = newL + 'px';
            cropOverlay.style.top = newT + 'px';
            cropOverlay.style.width = newW + 'px';
            cropOverlay.style.height = newH + 'px';
        }
    });
    document.addEventListener('mouseup', function() {
        isDragging = false;
        isResizing = false;
        resizeHandle = null;
    });
    
    // Eventos dos botões
    header.querySelector('#close-crop').onclick = () => document.body.removeChild(modal);
    footer.querySelector('#cancel-crop').onclick = () => document.body.removeChild(modal);
    footer.querySelector('#confirm-crop').onclick = () => {
        if (!originalImage) return;
        // Calcular coordenadas de recorte na imagem original
        // Usar getBoundingClientRect para precisão
        const rect = canvas.getBoundingClientRect();
        const overlayRect = cropOverlay.getBoundingClientRect();
        // Posição do overlay relativa ao canvas
        const relLeft = overlayRect.left - rect.left;
        const relTop = overlayRect.top - rect.top;
        const relWidth = cropOverlay.offsetWidth;
        const relHeight = cropOverlay.offsetHeight;
        // Proporção entre canvas e imagem original
        const scaleX = originalImage.width / canvas.width;
        const scaleY = originalImage.height / canvas.height;
        // Coordenadas finais na imagem original
        const cropX = Math.round(relLeft * scaleX);
        const cropY = Math.round(relTop * scaleY);
        const cropWidth = Math.round(relWidth * scaleX);
        const cropHeight = Math.round(relHeight * scaleY);
        // Criar canvas para a imagem recortada
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = 250;
        cropCanvas.height = 250;
        const cropCtx = cropCanvas.getContext('2d');
        // Recortar e redimensionar para 250x250
        cropCtx.imageSmoothingEnabled = true;
        cropCtx.imageSmoothingQuality = 'high';
        cropCtx.clearRect(0, 0, 250, 250);
        cropCtx.drawImage(
            originalImage,
            cropX, cropY, cropWidth, cropHeight,
            0, 0, 250, 250
        );
        // Exportar em PNG para máxima qualidade
        const dataURL = cropCanvas.toDataURL('image/png');
        setPersonagemImage(dataURL);
        document.body.removeChild(modal);
    };
    
    modal.onclick = (e) => {
        if (e.target === modal) document.body.removeChild(modal);
    };
    
    return modal;
}

// Função para definir a imagem do personagem
function setPersonagemImage(dataURL) {
    console.log('setPersonagemImage chamada com:', dataURL ? 'dados válidos' : 'dados inválidos');
    
    imagemPersonagem = dataURL;
    character.imagemPersonagem = dataURL;
    
    const preview = document.getElementById('personagem-preview');
    const placeholder = document.querySelector('.imagem-placeholder');
    const container = document.querySelector('.personagem-imagem');
    const removeBtn = document.getElementById('remover-imagem');
    
    console.log('Elementos para atualizar:', {
        preview: preview ? 'OK' : 'ERRO',
        placeholder: placeholder ? 'OK' : 'ERRO',
        container: container ? 'OK' : 'ERRO',
        removeBtn: removeBtn ? 'OK' : 'ERRO'
    });
    
    if (preview && placeholder && container) {
        preview.src = dataURL;
        preview.style.display = 'block';
        placeholder.style.display = 'none';
        container.classList.add('has-image');
        
        console.log('Imagem definida com sucesso!');
        
        if (removeBtn) {
            removeBtn.style.display = 'block';
        }
    } else {
        console.error('Elementos necessários não encontrados para definir a imagem');
    }
}

// Função para remover a imagem
function removePersonagemImage() {
    imagemPersonagem = null;
    character.imagemPersonagem = null;
    
    const preview = document.getElementById('personagem-preview');
    const placeholder = document.querySelector('.imagem-placeholder');
    const container = document.querySelector('.personagem-imagem');
    const removeBtn = document.getElementById('remover-imagem');
    
    if (preview && placeholder && container) {
        preview.style.display = 'none';
        preview.src = '';
        placeholder.style.display = 'flex';
        container.classList.remove('has-image');
        
        if (removeBtn) {
            removeBtn.style.display = 'none';
        }
    }
}

// ===== FIM DA FUNCIONALIDADE DE IMAGEM =====

// Função para inicializar o upload de imagem
function initializeImageUpload() {
    console.log('Inicializando upload de imagem...');
    const imageUpload = document.getElementById('imagem-upload');
    const removeBtn = document.getElementById('remover-imagem');
    
    console.log('Elementos encontrados:', {
        imageUpload: imageUpload ? 'OK' : 'ERRO',
        removeBtn: removeBtn ? 'OK' : 'ERRO'
    });
    
    if (imageUpload) {
        console.log('Adicionando event listener para upload...');
        imageUpload.addEventListener('change', function(event) {
            console.log('Evento change disparado');
            const file = event.target.files[0];
            if (file) {
                console.log('Arquivo selecionado:', file.name, file.type);
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        console.log('Imagem carregada, criando modal de crop...');
                        const modal = createSimpleCropModal(e.target.result);
                        document.body.appendChild(modal);
                    };
                    reader.readAsDataURL(file);
                } else {
                    alert('Por favor, selecione um arquivo de imagem válido.');
                }
            }
            // Limpar o input para permitir selecionar a mesma imagem novamente
            event.target.value = '';
        });
    } else {
        console.error('Elemento imagem-upload não encontrado!');
    }
    
    if (removeBtn) {
        console.log('Adicionando event listener para remoção...');
        removeBtn.addEventListener('click', function(event) {
            console.log('Botão remover clicado');
            event.preventDefault();
            removePersonagemImage();
        });
    } else {
        console.error('Elemento remover-imagem não encontrado!');
    }
}

// ===== FIM DA FUNCIONALIDADE DE IMAGEM =====
