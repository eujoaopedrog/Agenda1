// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD6h3UHMjBSY7WNSRp-rW5pjcl5EWSlMTA",
  authDomain: "psicologa-agenda.firebaseapp.com",
  projectId: "psicologa-agenda",
  storageBucket: "psicologa-agenda.appspot.com",
  messagingSenderId: "224208583343",
  appId: "1:224208583343:web:1c12345b8e91a4b3a1725a"
};

// Inicialização do Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Configuração de persistência
firebase.firestore().enablePersistence()
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      console.warn('Múltiplas abas abertas, persistência não pode ser habilitada');
    } else if (err.code == 'unimplemented') {
      console.warn('Navegador não suporta persistência');
    }
  });

// Exportação dos serviços
const auth = firebase.auth();
const db = firebase.firestore();
const timestamp = firebase.firestore.FieldValue.serverTimestamp;

// Função para visualização da senha
function setupPasswordToggle() {
  document.querySelectorAll('.toggle-password').forEach(eye => {
    eye.addEventListener('click', function() {
      const input = this.previousElementSibling;
      const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
      input.setAttribute('type', type);
      this.classList.toggle('fa-eye-slash');
    });
  });
}

// Cadastro completo
async function handleCadastro(e) {
  e.preventDefault();
  const btn = document.querySelector('.auth-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cadastrando...';

  const userData = {
    nome: document.getElementById('nome').value,
    email: document.getElementById('email').value,
    telefone: document.getElementById('telefone').value,
    senha: document.getElementById('senha').value,
    dataNascimento: document.getElementById('dataNascimento').value
  };

  try {
    // 1. Cria autenticação
    const userCredential = await auth.createUserWithEmailAndPassword(userData.email, userData.senha);
    
    // 2. Salva dados adicionais no Firestore
    await db.collection('usuarios').doc(userCredential.user.uid).set({
      nome: userData.nome,
      email: userData.email,
      telefone: userData.telefone,
      dataNascimento: userData.dataNascimento,


      dataCadastro: timestamp(),
      tipo: 'paciente',
      uid: userCredential.user.uid
    });

    // 3. Feedback visual e redirecionamento
    btn.innerHTML = '<i class="fas fa-check"></i> Cadastro realizado!';
    await auth.signOut(); // Desloga o usuário após o cadastro
    setTimeout(() => {
      window.location.replace('login.html');
    }, 1500);
    
  } catch (error) {
    console.error("Erro no cadastro:", error);
    let mensagem = 'Erro no cadastro: ';
    if (error.code === 'auth/email-already-in-use') {
      mensagem += 'Este e-mail já está cadastrado.';
    } else if (error.code === 'auth/weak-password') {
      mensagem += 'A senha deve ter pelo menos 6 caracteres.';
    } else {
      mensagem += error.message;
    }
    alert(mensagem);
    btn.innerHTML = '<i class="fas fa-user-plus"></i> Tentar novamente';
    btn.disabled = false;
  }
}

// Login redirecionando para agenda
async function handleLogin(e) {
  e.preventDefault();
  const btn = document.querySelector('.auth-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';

  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;

  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, senha);
    
    // Verifica se o usuário existe no Firestore
    const userDoc = await db.collection('usuarios').doc(userCredential.user.uid).get();
    if (!userDoc.exists) {
      throw new Error('Dados do usuário não encontrados');
    }
    
    btn.innerHTML = '<i class="fas fa-check"></i> Login realizado!';
    setTimeout(() => {
      window.location.replace('agenda.html');
    }, 1500);
  } catch (error) {
    let mensagem = 'Erro no login: ';
    if (error.code === 'auth/user-not-found') {
      mensagem += 'Usuário não encontrado.';
    } else if (error.code === 'auth/wrong-password') {
      mensagem += 'Senha incorreta.';
    } else {
      mensagem += error.message;
    }
    alert(mensagem);
    btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar';
    btn.disabled = false;
  }
}

// Inicializa tudo quando o DOM carregar
document.addEventListener('DOMContentLoaded', () => {
  setupPasswordToggle();
  
  // Verifica se está na página de cadastro
  if (document.getElementById('cadastroForm')) {
    document.getElementById('cadastroForm').addEventListener('submit', handleCadastro);
    
    // Máscara de telefone
    document.getElementById('telefone').addEventListener('input', function(e) {
      e.target.value = e.target.value
        .replace(/\D/g, '')
        .replace(/^(\d{2})(\d)/g, '($1) $2')
        .replace(/(\d)(\d{4})$/, '$1-$2');
    });
  }

  // Verifica se está na página de login
  if (document.getElementById('loginForm')) {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
  }

  // Verifica autenticação
  auth.onAuthStateChanged(async user => {
    const currentPath = window.location.pathname;
    
    if (user) {
      // Usuário está logado
      if (currentPath.includes('login.html') || currentPath.includes('cadastro.html')) {
        window.location.replace('agenda.html');
      }
    } else {
      // Usuário não está logado
      if (currentPath.includes('agenda.html')) {
        window.location.replace('login.html');
      }
    }
  });
});

// Configuração de persistência de autenticação
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .catch((error) => {
    console.error("Erro na persistência de autenticação:", error);
  });

// Configuração de erro global
db.enablePersistence().catch((err) => {
  console.warn("Persistência offline não suportada:", err.code);
});

// Exportações para uso nos componentes
export { auth, db, timestamp };