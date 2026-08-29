<div align="center">

# 🎺 SistCautela - Gestão de Cautelas e Controle de Patrimônio

**Sistema Completo de Controle de Inventário, Cautelas de Instrumentos e Emissão de Termos Digitais**

![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-Lucide_Icons-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)

</div>

---

## 📌 Sobre o Projeto

O **SistCautela** é uma aplicação web full stack desenvolvida para modernizar, agilizar e auditar o processo de **cautela (empréstimo/custódia), devolução e controle patrimonial** de instrumentos musicais, acessórios e materiais institucionais.

O sistema elimina o uso de livros de registro em papel, automatizando a geração de **Termos de Responsabilidade em PDF com assinatura eletrônica em tela** e **autenticação via QR Code**, permitindo rastreabilidade e histórico em tempo real.

> 🔒 **Aviso de Privacidade & Proteção de Dados:**  
> Este repositório foi publicado exclusivamente para fins de **demonstração técnica e portfólio profissional**. Todos os dados de militares, números de série e patrimônios contidos na demonstração pública são estritamente fictícios ou descaracterizados, em conformidade com as boas práticas de segurança da informação e LGPD.

---

## ✨ Principais Funcionalidades

- **📋 Gestão de Cautelas (Fixas e Temporárias):**
  - Registro de empréstimos vinculando materiais a responsáveis.
  - Baixa de devoluções com registro de data, estado do item e observações.
  - Histórico completo de movimentações e auditoria.

- **✍️ Assinatura Eletrônica e Termos em PDF:**
  - Coleta de assinatura digital direto no canvas do dispositivo (celular, tablet ou mouse).
  - Geração instantânea de Termo de Responsabilidade em PDF formatado ([jsPDF](https://github.com/parallax/jsPDF)).
  - Carimbo de data/hora e hash de validação.

- **📱 Leitura e Geração de QR Code:**
  - Emissão de QR Codes para cada item patrimonial ou termo de cautela.
  - Leitor de QR Code integrado via câmera para conferência rápida em eventos e formaturas.

- **📦 Controle de Estoque e Patrimônio:**
  - Cadastro categorizado de instrumentos (Madeiras, Metais, Percussão, Acessórios).
  - Status em tempo real (*Disponível*, *Cautelado*, *Em Manutenção*, *Baixado*).

- **📊 Dashboard Analítico:**
  - Visão geral de materiais em uso, quantidade de itens cautelados e taxas de devolução.

- **🔐 Autenticação e Níveis de Acesso:**
  - Controle de sessão seguro com criptografia de senhas (bcrypt) e tokens de autenticação.

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** com **TypeScript**
- **Vite** para build ultra-rápido
- **Lucide React** para iconografia moderna
- **jsPDF & html2canvas** para geração e renderização de relatórios
- **HTML5 Canvas API** para coleta de assinatura manuscrita

### Backend & Nuvem
- **Node.js & Express** integrado como **Serverless Functions** na **Vercel**
- **Supabase (PostgreSQL)** para banco de dados relacional e persistência
- **Bcrypt** para hashing seguro de credenciais
- **Vercel** para deploy e hospedagem com CI/CD contínuo

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- [Git](https://git-scm.com/)

### 1. Clonar o Repositório
```bash
git clone https://github.com/SEU_USUARIO/sistcautela-banda.git
cd sistcautela-banda
```

### 2. Instalar as Dependências
```bash
npm install
```

### 3. Configurar as Variáveis de Ambiente
Copie o arquivo de exemplo e preencha com as credenciais do seu banco de dados:
```bash
cp .env.example .env
```

### 4. Executar em Modo de Desenvolvimento
```bash
npm run dev
```
Acesse `http://localhost:5173` no seu navegador.

---

## 🏛️ Arquitetura do Repositório

```text
├── api/                  # Serverless API Routes (Vercel Backend)
│   └── index.ts          # Endpoints Express (Auth, Cautelas, Inventário)
├── public/               # Ativos estáticos e logotipos
├── src/
│   ├── components/       # Modais (PDF, Assinatura, QR Code Scanner)
│   ├── AuthContext.tsx   # Gerenciamento global de autenticação
│   ├── Dashboard.tsx     # Painel de métricas e visão geral
│   ├── CautionArea.tsx   # Fluxo de emissão e devolução de cautelas
│   ├── InventoryArea.tsx # Gestão de patrimônio e instrumentos
│   ├── pdfService.ts     # Gerador de documentos e termos em PDF
│   └── App.tsx           # Roteamento e estrutura principal
├── vercel.json           # Configuração de rotas e Serverless Vercel
└── vite.config.ts        # Configuração do Vite e plugins
```

---

## 👨‍💻 Autor

Desenvolvido por **PABLO HENRIQUE BENEDITO SILVA CAMARGO**  
- **LinkedIn:** [Pablo Henrique
](www.linkedin.com/in/pablo-henrique-176984274)  

---

<div align="center">
  <sub>SistCautela • Desenvolvido com foco em eficiência, segurança e modernização de processos.</sub>
</div>
