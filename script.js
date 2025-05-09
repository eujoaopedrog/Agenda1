// Importações do Firebase (adicione esses scripts no HTML antes do script.js)
// <script src="https://www.gstatic.com/firebasejs/9.6.0/firebase-app-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/9.6.0/firebase-auth-compat.js"></script>

// Tente esta função de teste no seu código
auth.signInWithEmailAndPassword("teste@teste.com", "123456")
  .catch(error => console.log("Firebase conectado! Erro esperado:", error.message));
/***********************
 * CONFIGURAÇÃO FIREBASE
 ***********************/
const firebaseConfig = {
    apiKey: "AIzaSyD6h3UHMjBSY7WNSRp-rW5pjcl5EWSlMTA",
    authDomain: "psicologa-agenda.firebaseapp.com",
    projectId: "psicologa-agenda",
    storageBucket: "psicologa-agenda.appspot.com",
    messagingSenderId: "224208583343",
    appId: "1:224208583343:web:1c12345b8e91a4b3a1725a"
  };
  
  // Inicialize o Firebase
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  const auth = firebase.auth();
  
  /***********************
   * VARIÁVEIS GLOBAIS
   ***********************/
  let currentUser = null;
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();
  let selectedDate = null;
  const HORARIOS_DISPONIVEIS = ['09:00', '10:00', '11:00', '14:00', '15:00'];
  const VALOR_CONSULTA = 150;
  
  /***********************
   * FUNÇÕES PRINCIPAIS
   ***********************/
  function initLoginPage() {
      const loginForm = document.getElementById('loginForm');
      const cadastroForm = document.getElementById('cadastroForm');
      const toggleCadastro = document.getElementById('toggleCadastro');
      const toggleLogin = document.getElementById('toggleLogin');
  
      if (toggleCadastro && toggleLogin) {
          toggleCadastro.addEventListener('click', () => toggleForms('cadastro'));
          toggleLogin.addEventListener('click', () => toggleForms('login'));
      }
  
      if (cadastroForm) {
          cadastroForm.addEventListener('submit', handleCadastro);
      }
  
      if (loginForm) {
          loginForm.addEventListener('submit', handleLogin);
      }
  
      // Máscara de telefone
      const telefoneInput = document.getElementById('telefone');
      if (telefoneInput) {
          telefoneInput.addEventListener('input', formatarTelefone);
      }
  
      // Verifica se usuário já está logado
      auth.onAuthStateChanged(user => {
          if (user) {
              window.location.href = 'agenda.html';
          }
      });
  }
  
  function initAgendaPage() {
      if (!document.getElementById('calendarioGrid')) return;
  
      // Verifica se usuário está logado
      auth.onAuthStateChanged(user => {
          if (!user) {
              window.location.href = 'login.html';
          } else {
              currentUser = user;
              renderCalendario(currentMonth, currentYear);
              setupAgendaEventListeners();
          }
      });
  
      // Modal de confirmação
      document.querySelector('.close-modal')?.addEventListener('click', () => {
          document.getElementById('confirmModal').style.display = 'none';
      });
  
      document.getElementById('confirmBtn')?.addEventListener('click', confirmarAgendamento);
  }
  
  /***********************
   * FUNÇÕES AUXILIARES
   ***********************/
  function toggleForms(formToShow) {
      document.querySelector('.login-form').style.display = formToShow === 'login' ? 'block' : 'none';
      document.querySelector('.cadastro-form').style.display = formToShow === 'cadastro' ? 'block' : 'none';
  }
  
  async function handleCadastro(e) {
      e.preventDefault();
      const btn = document.querySelector('.auth-btn');
      const email = document.getElementById('cadastroEmail').value;
      const senha = document.getElementById('cadastroSenha').value;
  
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cadastrando...';
      btn.disabled = true;
  
      try {
          const userCredential = await auth.createUserWithEmailAndPassword(email, senha);
          
          await db.collection('usuarios').doc(userCredential.user.uid).set({
              nome: document.getElementById('cadastroNome').value,
              telefone: document.getElementById('telefone').value,
              tipo: 'paciente'
          });
  
          btn.innerHTML = '<i class="fas fa-check"></i> Cadastro realizado!';
          setTimeout(() => window.location.href = 'login.html', 1500);
      } catch (error) {
          btn.innerHTML = 'Cadastrar';
          btn.disabled = false;
          alert(`Erro: ${error.message}`);
      }
  }
  
  async function handleLogin(e) {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const senha = document.getElementById('loginSenha').value;
  
      try {
          await auth.signInWithEmailAndPassword(email, senha);
          window.location.href = 'agenda.html';
      } catch (error) {
          alert(`Falha no login: ${error.message}`);
      }
  }
  
  function formatarTelefone(e) {
      e.target.value = e.target.value
          .replace(/\D/g, '')
          .replace(/^(\d{2})(\d)/g, '($1) $2')
          .replace(/(\d)(\d{4})$/, '$1-$2');
  }
  
  function renderCalendario(month, year) {
      const calendarioGrid = document.getElementById('calendarioGrid');
      const currentMonthElement = document.getElementById('currentMonth');
      
      if (!calendarioGrid || !currentMonthElement) return;
  
      calendarioGrid.innerHTML = '';
      currentMonthElement.textContent = new Date(year, month).toLocaleDateString('pt-BR', { 
          month: 'long', 
          year: 'numeric' 
      }).replace(/^\w/, c => c.toUpperCase());
  
      // Dias da semana
      ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].forEach(dia => {
          const divDia = document.createElement('div');
          divDia.className = 'dias-semana';
          divDia.textContent = dia;
          calendarioGrid.appendChild(divDia);
      });
  
      // Dias do mês
      const firstDay = new Date(year, month, 1).getDay();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
  
      for (let i = 0; i < firstDay; i++) {
          calendarioGrid.appendChild(createDayElement('', true));
      }
  
      for (let day = 1; day <= daysInMonth; day++) {
          const currentDate = new Date(year, month, day);
          calendarioGrid.appendChild(createDayElement(day, currentDate < hoje));
      }
  }
  
  function createDayElement(day, isDisabled) {
      const divDia = document.createElement('div');
      divDia.className = `dia-mes ${isDisabled ? 'disabled' : ''}`;
      divDia.textContent = day;
      
      if (!isDisabled) {
          divDia.addEventListener('click', () => selectDate(day));
      }
      
      return divDia;
  }
  
  function selectDate(day) {
      selectedDate = new Date(currentYear, currentMonth, day);
      
      document.querySelectorAll('.dia-mes').forEach(el => {
          el.classList.remove('selected');
      });
      
      event.target.classList.add('selected');
      document.getElementById('selectedDate').textContent = selectedDate.toLocaleDateString('pt-BR', { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long' 
      }).replace(/^\w/, c => c.toUpperCase());
      
      loadHorarios();
  }
  
  async function loadHorarios() {
      const horariosList = document.getElementById('horariosList');
      if (!horariosList || !selectedDate) return;
  
      horariosList.innerHTML = '<p>Carregando...</p>';
  
      try {
          const snapshot = await db.collection('consultas')
              .where('data', '==', firebase.firestore.Timestamp.fromDate(selectedDate))
              .get();
  
          const consultasDoDia = snapshot.docs.map(doc => doc.data().horario);
  
          horariosList.innerHTML = '';
          HORARIOS_DISPONIVEIS.forEach(horario => {
              const jaAgendado = consultasDoDia.includes(horario);
              const horarioItem = document.createElement('div');
              horarioItem.className = `horario-item ${jaAgendado ? 'booked' : ''}`;
              horarioItem.innerHTML = jaAgendado ?
                  `<span>${horario}</span><small>Indisponível</small>` :
                  `<span>${horario}</span><small>R$ ${VALOR_CONSULTA},00</small>`;
              
              if (!jaAgendado) {
                  horarioItem.addEventListener('click', () => openModal(horario));
              }
              
              horariosList.appendChild(horarioItem);
          });
      } catch (error) {
          horariosList.innerHTML = '<p>Erro ao carregar horários</p>';
          console.error("Erro ao carregar horários:", error);
      }
  }
  
  function openModal(horario) {
      const modal = document.getElementById('confirmModal');
      document.getElementById('modalText').innerHTML = `
          Você está agendando para <strong>
          ${selectedDate.toLocaleDateString('pt-BR')} às ${horario}
          </strong>.
      `;
      modal.style.display = 'flex';
  }
  
  async function confirmarAgendamento() {
      const horario = document.querySelector('.horario-item:not(.booked) span').textContent;
      const btn = document.getElementById('confirmBtn');
      
      btn.disabled = true;
      btn.textContent = "Processando...";
  
      try {
          await db.collection('consultas').add({
              pacienteId: currentUser.uid,
              data: firebase.firestore.Timestamp.fromDate(selectedDate),
              horario: horario,
              valor: VALOR_CONSULTA,
              status: 'agendado',
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
  
          alert('Consulta agendada com sucesso!');
          document.getElementById('confirmModal').style.display = 'none';
          loadHorarios();
      } catch (error) {
          alert(`Erro: ${error.message}`);
      } finally {
          btn.disabled = false;
          btn.textContent = "Confirmar";
      }
  }
  
  function setupAgendaEventListeners() {
      document.getElementById('prevMonth')?.addEventListener('click', () => {
          currentMonth--;
          if (currentMonth < 0) {
              currentMonth = 11;
              currentYear--;
          }
          renderCalendario(currentMonth, currentYear);
      });
  
      document.getElementById('nextMonth')?.addEventListener('click', () => {
          currentMonth++;
          if (currentMonth > 11) {
              currentMonth = 0;
              currentYear++;
          }
          renderCalendario(currentMonth, currentYear);
      });
  
      document.getElementById('logoutBtn')?.addEventListener('click', () => {
          auth.signOut().then(() => {
              window.location.href = 'login.html';
          });
      });
  }
  
  /***********************
   * INICIALIZAÇÃO
   ***********************/
  document.addEventListener('DOMContentLoaded', () => {
      initLoginPage();
      initAgendaPage();
  });