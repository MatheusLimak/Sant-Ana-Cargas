// Credenciais de acesso (armazenadas no JS - sem backend)
const CREDENTIALS = {
  username: 'santana',
  password: 'C@rgas123'
};

// Verificar se está logado
function checkAuth() {
  const isAuthenticated = sessionStorage.getItem('portal_authenticated') === 'true';
  if (isAuthenticated) {
    showDashboard();
  }
}

// Login
document.getElementById('loginForm')?.addEventListener('submit', function(e) {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorMessage = document.getElementById('errorMessage');

  if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
    sessionStorage.setItem('portal_authenticated', 'true');
    errorMessage.classList.remove('show');
    showDashboard();
  } else {
    errorMessage.classList.add('show');
  }
});

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', function() {
  sessionStorage.removeItem('portal_authenticated');
  document.getElementById('loginScreen').style.display = 'block';
  document.getElementById('dashboardScreen').classList.remove('active');
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
});

// Mostrar dashboard
function showDashboard() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('dashboardScreen').classList.add('active');
  loadOrçamentos();
  setTimeout(setupCNPJMask, 100);
}

// Adicionar item ao orçamento
let itemCount = 1;

function addItem() {
  const container = document.getElementById('itensContainer');
  const newItem = document.createElement('div');
  newItem.className = 'item-row';
  newItem.innerHTML = `
    <div class="form-group" style="margin-bottom: 0;">
      <label>Descrição do Item</label>
      <input type="text" class="item-desc" required>
    </div>
    <div class="form-group" style="margin-bottom: 0;">
      <label>Quantidade</label>
      <input type="number" class="item-qtd" min="1" value="1" required>
    </div>
    <div class="form-group" style="margin-bottom: 0;">
      <label>Valor Unitário (R$)</label>
      <input type="number" class="item-valor" step="0.01" min="0" required>
    </div>
    <button type="button" class="btn-remove-item" onclick="removeItem(this)">Remover</button>
  `;
  container.appendChild(newItem);
  itemCount++;
  
  // Mostrar botão remover no primeiro item se houver mais de um
  updateRemoveButtons();
}

function removeItem(btn) {
  const container = document.getElementById('itensContainer');
  if (container.children.length > 1) {
    btn.closest('.item-row').remove();
    updateRemoveButtons();
  }
}

function updateRemoveButtons() {
  const items = document.querySelectorAll('.item-row');
  items.forEach((item, index) => {
    const removeBtn = item.querySelector('.btn-remove-item');
    if (items.length > 1) {
      removeBtn.style.display = 'block';
    } else {
      removeBtn.style.display = 'none';
    }
  });
}

// Limpar formulário
function clearForm() {
  const form = document.getElementById('orçamentoForm');
  const container = document.getElementById('itensContainer');
  const modalTitle = document.getElementById('modalTitle');
  const btnSubmit = document.getElementById('btnSubmitForm');
  
  if (form) form.reset();
  if (container) {
    container.innerHTML = `
      <div class="item-row">
        <div class="form-group" style="margin-bottom: 0;">
          <label>Descrição do Item</label>
          <input type="text" class="item-desc" required>
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <label>Quantidade</label>
          <input type="number" class="item-qtd" min="1" value="1" required>
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <label>Valor Unitário (R$)</label>
          <input type="number" class="item-valor" step="0.01" min="0" required>
        </div>
        <button type="button" class="btn-remove-item" onclick="removeItem(this)" style="display: none;">Remover</button>
      </div>
    `;
  }
  itemCount = 1;
  currentEditIndex = null;
  if (modalTitle) modalTitle.textContent = 'Novo Orçamento';
  if (btnSubmit) btnSubmit.textContent = 'Gerar PDF do Orçamento';
}

// Variável para controlar edição
let currentEditIndex = null;

// Abrir modal
function openModal(keepData = false) {
  const modal = document.getElementById('modalOverlay');
  modal.classList.add('active');
  if (!keepData) {
    clearForm();
  }
}

// Fechar modal
function closeModal() {
  const modal = document.getElementById('modalOverlay');
  modal.classList.remove('active');
  clearForm();
}

// Editar orçamento
function editOrçamento(index) {
  const orçamentos = JSON.parse(localStorage.getItem('orçamentos') || '[]');
  if (!orçamentos[index]) return;
  
  const orc = orçamentos[index];
  currentEditIndex = index;
  
  // Preencher formulário
  document.getElementById('clienteNome').value = orc.clienteNome;
  document.getElementById('clienteEmail').value = orc.clienteEmail;
  document.getElementById('clienteTelefone').value = orc.clienteTelefone;
  document.getElementById('clienteCNPJ').value = orc.clienteCNPJ || '';
  document.getElementById('dataEvento').value = orc.dataEvento;
  document.getElementById('descricao').value = orc.descricao || '';
  document.getElementById('observacoes').value = orc.observacoes || '';
  
  // Preencher itens
  const container = document.getElementById('itensContainer');
  container.innerHTML = '';
  orc.itens.forEach((item, idx) => {
    const newItem = document.createElement('div');
    newItem.className = 'item-row';
    newItem.innerHTML = `
      <div class="form-group" style="margin-bottom: 0;">
        <label>Descrição do Item</label>
        <input type="text" class="item-desc" value="${item.descricao}" required>
      </div>
      <div class="form-group" style="margin-bottom: 0;">
        <label>Quantidade</label>
        <input type="number" class="item-qtd" min="1" value="${item.quantidade}" required>
      </div>
      <div class="form-group" style="margin-bottom: 0;">
        <label>Valor Unitário (R$)</label>
        <input type="number" class="item-valor" step="0.01" min="0" value="${item.valorUnitario}" required>
      </div>
      <button type="button" class="btn-remove-item" onclick="removeItem(this)">Remover</button>
    `;
    container.appendChild(newItem);
  });
  
  itemCount = orc.itens.length;
  updateRemoveButtons();
  
  // Atualizar título e botão
  document.getElementById('modalTitle').textContent = 'Editar Orçamento';
  document.getElementById('btnSubmitForm').textContent = 'Atualizar e Gerar PDF';
  
  // Abrir modal sem limpar dados
  openModal(true);
}

// Limpar histórico
function clearHistory() {
  if (confirm('Tem certeza que deseja limpar todo o histórico de orçamentos? Esta ação não pode ser desfeita.')) {
    localStorage.removeItem('orçamentos');
    loadOrçamentos();
    alert('Histórico limpo com sucesso!');
  }
}

// Salvar orçamento
function saveOrçamento(orçamentoData, editIndex = null) {
  let orçamentos = JSON.parse(localStorage.getItem('orçamentos') || '[]');
  if (editIndex !== null && editIndex >= 0 && editIndex < orçamentos.length) {
    // Editar orçamento existente
    orçamentos[editIndex] = orçamentoData;
  } else {
    // Novo orçamento
    orçamentos.push(orçamentoData);
  }
  localStorage.setItem('orçamentos', JSON.stringify(orçamentos));
  loadOrçamentos();
}

// Carregar orçamentos
function loadOrçamentos() {
  const orçamentos = JSON.parse(localStorage.getItem('orçamentos') || '[]');
  const listContainer = document.getElementById('orçamentosList');
  const btnClearHistory = document.getElementById('btnClearHistory');
  
  if (orçamentos.length === 0) {
    listContainer.innerHTML = '<p style="color: var(--cinza); text-align: center; padding: 40px;">Nenhum orçamento gerado ainda</p>';
    btnClearHistory.style.display = 'none';
    return;
  }

  btnClearHistory.style.display = 'block';

  listContainer.innerHTML = orçamentos.map((orc, index) => {
    const data = new Date(orc.dataCriacao);
    const dataFormatada = data.toLocaleDateString('pt-BR');
    const valorTotal = orc.itens.reduce((sum, item) => sum + (item.quantidade * item.valorUnitario), 0);
    
    return `
      <div class="orçamento-item">
        <div class="orçamento-info">
          <h3>${orc.clienteNome}</h3>
          <p><strong>E-mail:</strong> ${orc.clienteEmail}</p>
          <p><strong>Telefone:</strong> ${orc.clienteTelefone}</p>
          ${orc.clienteCNPJ ? `<p><strong>CNPJ:</strong> ${orc.clienteCNPJ}</p>` : ''}
          <p><strong>Data do Serviço:</strong> ${orc.dataEvento}</p>
          <p><strong>Valor Total:</strong> R$ ${valorTotal.toFixed(2).replace('.', ',')}</p>
          <p><strong>Criado em:</strong> ${dataFormatada}</p>
        </div>
        <div class="orçamento-actions">
          <button class="btn-edit" onclick="editOrçamento(${index})">Editar</button>
          <button class="btn-view-pdf" onclick="generatePDFFromSaved(${index})">Ver PDF</button>
        </div>
      </div>
    `;
  }).join('');
}

// Carregar logo como base64
function loadLogoAsBase64() {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = function() {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Usar dimensões originais da imagem
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const base64 = canvas.toDataURL('image/png');
        resolve({ base64, width: img.width, height: img.height });
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = function(error) {
      console.error('Erro ao carregar logo:', error);
      reject(new Error('Não foi possível carregar a imagem Logo.png. Verifique se o arquivo existe no diretório.'));
    };
    
    // Carregar a imagem
    img.src = 'Logo.png';
  });
}

// Gerar PDF
async function generatePDF(orçamentoData) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  
  // Cores profissionais harmonizadas
  const corAzulEscuro = [7, 19, 38];      // Azul profundo
  const corAzulMedio = [31, 63, 140];      // Azul médio
  const corLaranja = [255, 123, 47];       // Laranja (usar com moderação)
  const corCinzaEscuro = [64, 69, 83];     // Cinza escuro
  const corCinzaClaro = [142, 148, 173];   // Cinza claro
  const corBranco = [255, 255, 255];       // Branco
  const corFundoClaro = [249, 250, 252];  // Fundo claro
  
  // Carregar logo primeiro
  let logoData = null;
  try {
    logoData = await loadLogoAsBase64();
  } catch (error) {
    console.warn('Logo não carregada:', error);
  }
  
  // Cabeçalho moderno e limpo - alinhado às margens
  // Linha decorativa superior em azul (margem completa)
  doc.setFillColor(...corAzulEscuro);
  doc.rect(0, 0, 210, 3, 'F');
  
  // Adicionar logo no topo direito (alinhado à margem direita)
  if (logoData) {
    const logoWidthMm = 35;
    const logoHeightMm = (logoData.height / logoData.width) * logoWidthMm;
    const logoX = 210 - logoWidthMm - 15; // Margem direita de 15mm
    const logoY = 10;
    doc.addImage(logoData.base64, 'PNG', logoX, logoY, logoWidthMm, logoHeightMm);
  }
  
  // Informações da empresa no topo esquerdo (alinhado à margem esquerda)
  doc.setTextColor(...corAzulEscuro);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text("Sant'Ana Cargas", 15, 22);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...corCinzaEscuro);
  doc.text("Santanas Cargas – Agilidade e segurança é o nosso forte", 15, 30);
  
  // Informações de contato
  doc.setFontSize(8);
  doc.setTextColor(...corCinzaClaro);
  doc.text("São Paulo - SP | Tel: (11) 98948-8326 | E-mail: santanacargas2025@gmail.com", 15, 37);
  
  // Linha separadora (alinhada às margens)
  doc.setDrawColor(...corCinzaClaro);
  doc.setLineWidth(0.3);
  doc.line(15, 46, 195, 46);
  
  // Título do documento - sem background, apenas texto
  doc.setTextColor(...corAzulEscuro);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text("ORÇAMENTO", 15, 58);
  
  // Data do orçamento (alinhada à margem direita)
  const dataOrçamento = new Date().toLocaleDateString('pt-BR');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...corCinzaEscuro);
  const dataText = `Data: ${dataOrçamento}`;
  const dataTextWidth = doc.getTextWidth(dataText);
  doc.text(dataText, 195 - dataTextWidth, 58);
  
  let yPos = 70;
  
  // Seção de dados do cliente - sem background, apenas texto alinhado
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...corAzulEscuro);
  doc.text("DADOS DO CLIENTE", 15, yPos);
  yPos += 7;
  
  // Linha decorativa (alinhada à margem esquerda)
  doc.setDrawColor(...corLaranja);
  doc.setLineWidth(0.8);
  doc.line(15, yPos - 1, 45, yPos - 1);
  yPos += 5;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...corCinzaEscuro);
  
  // Nome (alinhado à margem esquerda)
  doc.setFont('helvetica', 'bold');
  doc.text("Nome:", 15, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(orçamentoData.clienteNome, 30, yPos);
  yPos += 6;
  
  // E-mail
  doc.setFont('helvetica', 'bold');
  doc.text("E-mail:", 15, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(orçamentoData.clienteEmail, 30, yPos);
  yPos += 6;
  
  // Telefone
  doc.setFont('helvetica', 'bold');
  doc.text("Telefone:", 15, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(orçamentoData.clienteTelefone, 35, yPos);
  
  // CNPJ (se houver) - lado direito (alinhado à margem direita)
  if (orçamentoData.clienteCNPJ) {
    doc.setFont('helvetica', 'bold');
    const cnpjLabel = "CNPJ:";
    const cnpjLabelWidth = doc.getTextWidth(cnpjLabel);
    doc.text(cnpjLabel, 195 - cnpjLabelWidth - doc.getTextWidth(orçamentoData.clienteCNPJ) - 5, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(orçamentoData.clienteCNPJ, 195 - doc.getTextWidth(orçamentoData.clienteCNPJ), yPos);
  }
  yPos += 6;
  
  // Data do serviço
  doc.setFont('helvetica', 'bold');
  doc.text("Data do Serviço:", 15, yPos);
  doc.setFont('helvetica', 'normal');
  const dataFormatada = new Date(orçamentoData.dataEvento + 'T00:00:00').toLocaleDateString('pt-BR');
  doc.text(dataFormatada, 48, yPos);
  yPos += 10;
  
  // Descrição do serviço - sem background, apenas texto alinhado
  if (orçamentoData.descricao) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...corAzulEscuro);
    doc.text("DESCRIÇÃO DO SERVIÇO", 15, yPos);
    yPos += 7;
    
    // Linha decorativa (alinhada à margem esquerda)
    doc.setDrawColor(...corLaranja);
    doc.setLineWidth(0.8);
    doc.line(15, yPos - 1, 55, yPos - 1);
    yPos += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...corCinzaEscuro);
    const descLines = doc.splitTextToSize(orçamentoData.descricao, 175);
    descLines.forEach(line => {
      doc.text(line, 15, yPos);
      yPos += 5;
    });
    yPos += 6;
  }
  
  // Itens do orçamento - alinhado às margens
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...corAzulEscuro);
  doc.text("ITENS DO ORÇAMENTO", 15, yPos);
  yPos += 8;
  
  // Cabeçalho da tabela moderno (alinhado às margens)
  doc.setFillColor(...corAzulEscuro);
  doc.rect(15, yPos - 6, 180, 8, 'F');
  doc.setTextColor(...corBranco);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text("Descrição", 20, yPos);
  doc.text("Qtd", 125, yPos);
  doc.text("Valor Unit.", 145, yPos);
  doc.text("Total", 175, yPos);
  yPos += 8;
  
  let valorTotal = 0;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  orçamentoData.itens.forEach((item, index) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = 70;
    }
    
    const itemTotal = item.quantidade * item.valorUnitario;
    valorTotal += itemTotal;
    
    // Alternar cor de fundo para linhas (zebrado) - alinhado às margens
    if (index % 2 === 0) {
      doc.setFillColor(...corFundoClaro);
      doc.rect(15, yPos - 4, 180, 6, 'F');
    }
    
    doc.setTextColor(...corCinzaEscuro);
    const descLines = doc.splitTextToSize(item.descricao, 100);
    descLines.forEach((line, idx) => {
      doc.text(line, 20, yPos);
      if (idx === 0) {
        doc.text(item.quantidade.toString(), 125, yPos);
        doc.text(`R$ ${item.valorUnitario.toFixed(2).replace('.', ',')}`, 145, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text(`R$ ${itemTotal.toFixed(2).replace('.', ',')}`, 175, yPos);
        doc.setFont('helvetica', 'normal');
      }
      yPos += 5;
    });
    yPos += 3;
  });
  
  yPos += 5;
  
  // Linha separadora simples (alinhada às margens)
  doc.setDrawColor(...corCinzaClaro);
  doc.setLineWidth(0.5);
  doc.line(15, yPos, 195, yPos);
  yPos += 8;
  
  // Box de total destacado - profissional e alinhado à direita
  const boxWidth = 75;
  const boxHeight = 16;
  const boxX = 195 - boxWidth; // Alinhado à margem direita
  const boxY = yPos;
  
  doc.setFillColor(...corAzulEscuro);
  doc.rect(boxX, boxY, boxWidth, boxHeight, 'F');
  
  // Texto centralizado no box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...corBranco);
  const labelText = "VALOR TOTAL";
  const labelWidth = doc.getTextWidth(labelText);
  doc.text(labelText, boxX + (boxWidth - labelWidth) / 2, yPos + 5);
  
  doc.setFontSize(14);
  const valorText = `R$ ${valorTotal.toFixed(2).replace('.', ',')}`;
  const valorWidth = doc.getTextWidth(valorText);
  doc.text(valorText, boxX + (boxWidth - valorWidth) / 2, yPos + 12);
  
  yPos += 20;
  
  yPos += 10;
  
  // Observações - sem background, apenas texto alinhado
  if (orçamentoData.observacoes) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...corAzulEscuro);
    doc.text("OBSERVAÇÕES", 15, yPos);
    yPos += 7;
    
    // Linha decorativa (alinhada à margem esquerda)
    doc.setDrawColor(...corLaranja);
    doc.setLineWidth(0.8);
    doc.line(15, yPos - 1, 45, yPos - 1);
    yPos += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...corCinzaEscuro);
    const obsLines = doc.splitTextToSize(orçamentoData.observacoes, 175);
    
    obsLines.forEach(line => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 70;
      }
      doc.text(line, 15, yPos);
      yPos += 5;
    });
  }
  
  // Adicionar logo e rodapé em todas as páginas
  const pageCount = doc.internal.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Adicionar logo em todas as páginas (se ainda não foi adicionada na primeira)
    if (logoData && i > 1) {
      const logoWidthMm = 40;
      const logoHeightMm = (logoData.height / logoData.width) * logoWidthMm;
      const logoX = 210 - logoWidthMm - 15;
      const logoY = 8;
      doc.addImage(logoData.base64, 'PNG', logoX, logoY, logoWidthMm, logoHeightMm);
    }
    
    // Linha decorativa no rodapé (alinhada às margens)
    doc.setDrawColor(...corCinzaClaro);
    doc.setLineWidth(0.3);
    doc.line(15, 275, 195, 275);
    
    // Rodapé profissional (centralizado)
    doc.setFontSize(7);
    doc.setTextColor(...corCinzaClaro);
    doc.text(`Página ${i} de ${pageCount}`, 105, 280, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setTextColor(...corCinzaEscuro);
    doc.text("Sant'Ana Cargas – Agilidade e segurança é o nosso forte", 105, 285, { align: 'center' });
    doc.text("São Paulo - SP | Tel: (11) 98948-8326 | E-mail: santanacargas2025@gmail.com", 105, 290, { align: 'center' });
  }
  
  // Salvar PDF
  const fileName = `Orçamento_${orçamentoData.clienteNome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

// Gerar PDF a partir de orçamento salvo
async function generatePDFFromSaved(index) {
  const orçamentos = JSON.parse(localStorage.getItem('orçamentos') || '[]');
  if (orçamentos[index]) {
    await generatePDF(orçamentos[index]);
  }
}

// Submeter formulário
document.getElementById('orçamentoForm')?.addEventListener('submit', function(e) {
  e.preventDefault();
  
  const itens = [];
  document.querySelectorAll('.item-row').forEach(row => {
    const desc = row.querySelector('.item-desc').value;
    const qtd = parseFloat(row.querySelector('.item-qtd').value);
    const valor = parseFloat(row.querySelector('.item-valor').value);
    
    if (desc && qtd && valor) {
      itens.push({
        descricao: desc,
        quantidade: qtd,
        valorUnitario: valor
      });
    }
  });
  
  if (itens.length === 0) {
    alert('Adicione pelo menos um item ao orçamento');
    return;
  }
  
  const orçamentoData = {
    clienteNome: document.getElementById('clienteNome').value,
    clienteEmail: document.getElementById('clienteEmail').value,
    clienteTelefone: document.getElementById('clienteTelefone').value,
    clienteCNPJ: document.getElementById('clienteCNPJ').value || null,
    dataEvento: document.getElementById('dataEvento').value,
    descricao: document.getElementById('descricao').value,
    observacoes: document.getElementById('observacoes').value,
    itens: itens,
    dataCriacao: currentEditIndex !== null 
      ? JSON.parse(localStorage.getItem('orçamentos') || '[]')[currentEditIndex]?.dataCriacao || new Date().toISOString()
      : new Date().toISOString()
  };
  
  // Gerar PDF
  generatePDF(orçamentoData).then(() => {
    // Salvar orçamento (editar se estiver em modo de edição)
    saveOrçamento(orçamentoData, currentEditIndex);
    
    // Fechar modal e limpar formulário
    closeModal();
    
    alert(currentEditIndex !== null ? 'Orçamento atualizado e PDF gerado com sucesso!' : 'Orçamento gerado com sucesso!');
  }).catch(error => {
    console.error('Erro ao gerar PDF:', error);
    alert('Erro ao gerar PDF. Tente novamente.');
  });
});

// Máscara de CNPJ
function aplicarMascaraCNPJ(input) {
  input.addEventListener('input', function(e) {
    let valor = e.target.value.replace(/\D/g, '');
    
    if (valor.length <= 14) {
      valor = valor.replace(/^(\d{2})(\d)/, '$1.$2');
      valor = valor.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
      valor = valor.replace(/\.(\d{3})(\d)/, '.$1/$2');
      valor = valor.replace(/(\d{4})(\d)/, '$1-$2');
      e.target.value = valor;
    }
  });
}

// Inicializar máscara de CNPJ quando o dashboard estiver visível
function setupCNPJMask() {
  const cnpjInput = document.getElementById('clienteCNPJ');
  if (cnpjInput) {
    aplicarMascaraCNPJ(cnpjInput);
  }
}

// Configurar eventos do modal
document.addEventListener('DOMContentLoaded', function() {
  const btnNewOrçamento = document.getElementById('btnNewOrçamento');
  const modalClose = document.getElementById('modalClose');
  const modalOverlay = document.getElementById('modalOverlay');
  const btnClearHistory = document.getElementById('btnClearHistory');
  
  if (btnNewOrçamento) {
    btnNewOrçamento.addEventListener('click', openModal);
  }
  
  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }
  
  if (modalOverlay) {
    modalOverlay.addEventListener('click', function(e) {
      if (e.target === modalOverlay) {
        closeModal();
      }
    });
  }
  
  if (btnClearHistory) {
    btnClearHistory.addEventListener('click', clearHistory);
  }
  
  // Fechar modal com ESC
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modalOverlay?.classList.contains('active')) {
      closeModal();
    }
  });
});

// Inicializar
checkAuth();

