<div align="center">

# 🎺 SistCautela - Banda de Música da EEAR (FAB)

**Sistema de Gestão de Cautelas, Inventário Patrimonial e Emissão de Termos Digitais**  
*Desenvolvido para a Banda de Música da Escola de Especialistas de Aeronáutica (EEAR) — Força Aérea Brasileira*

![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-Lucide_Icons-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)

</div>

---

## 🎯 Contexto e Instituição

A **Escola de Especialistas de Aeronáutica (EEAR)**, sediada em Guaratinguetá-SP, é o maior complexo de ensino técnico militar da América do Sul. A **Banda de Música da EEAR** possui intensa rotina operacional em cerimoniais militares, desfiles, formaturas e apresentações culturais, demandando a guarda, manutenção e transporte contínuo de centenas de instrumentos musicais de alto valor patrimonial e sensibilidade técnica.

---

## 🧩 O Problema Enfrentado

Antes da concepção do **SistCautela**, a rotina de controle de materiais e instrumentos enfrentava desafios operacionais recorrentes:

1. **Dependência de Livros de Papel e Planilhas Descentralizadas:**  
   O registro manual de cautelas gerava lentidão no atendimento aos músicos, rasuras, ilegibilidade e vulnerabilidade à perda física de registros.
2. **Dificuldade na Rastreabilidade em Grandes Eventos:**  
   Durante formaturas e viagens com alto volume de movimentação simultânea, identificar com precisão o militar responsável por cada item em tempo hábil era complexo.
3. **Ausência de Comprovação Imediata e Formal:**  
   A falta de um termo de responsabilidade padronizado com assinatura digital gerava insegurança jurídica e administrativa em casos de avarias ou extravios.
4. **Inventário Moroso:**  
   A contagem de patrimônio e o diagnóstico do estado de conservação dos instrumentos exigiam esforço manual exaustivo.

---

## 💡 A Solução Implementada

O **SistCautela** digitalizou e automatizou 100% do ciclo de vida das cautelas e do patrimônio da Banda:

* **Agilidade no Balcão de Cautela:** Emissão de empréstimos fixos ou temporários em menos de 1 minuto.
* **Termos de Responsabilidade com Assinatura Digital:** Coleta de assinatura manuscrita diretamente na tela (touch ou mouse) com geração instantânea do PDF formatado contendo data/hora e hash de auditoria.
* **Rastreabilidade por QR Code:** Identificação rápida de instrumentos e termos através de câmera/scanner, agilizando a conferência de entrada e saída.
* **Painel Gerencial (Dashboard):** Visão analítica em tempo real de itens disponíveis, cautelados, em manutenção ou recolhidos.
* **Histórico Completo de Movimentações:** Auditoria com registro de quem retirou, quem devolveu, data e condições do material.

> 🔒 **Aviso de Privacidade & Proteção de Dados (LGPD):**  
> Este repositório foi disponibilizado publicamente para fins de **demonstração técnica e portfólio de engenharia de software**. Quaisquer dados pessoais, matrículas e patrimônios exibidos nesta versão são fictícios ou descaracterizados, preservando o sigilo das informações institucionais.

---

## ✨ Principais Funcionalidades

- **📋 Fluxo Completo de Cautelas:**
  - Empréstimos fixos (uso contínuo pelo efetivo) e temporários (apresentações e escalas avulsas).
  - Devolução com checklist de integridade e observações de manutenção.
- **✍️ Coleta de Assinatura Eletrônica (Canvas API):**
  - Assinatura no navegador com integração direta ao documento.
- **📄 Geração Automatizada de Termos em PDF:**
  - Renderização precisa de documentos padronizados com brasão institucional e dados do responsável.
- **📱 Integração com QR Code:**
  - Geração de etiquetas QR Code para identificação física e leitor via câmera web/mobile.
- **📦 Gestão de Inventário:**
  - Categorização completa (Madeiras, Metais, Percussão, Cordas e Acessórios) e controle de estado de conservação.

---

## 🛠️ Stack Tecnológica

### Frontend
- **React 18** com **TypeScript**
- **Vite** para otimização de build
- **Lucide Icons** para interface limpa e intuitiva
- **jsPDF & html2canvas** para emissão dos termos
- **HTML5 Canvas API** para assinatura digital

### Backend & Cloud
- **Node.js & Express** arquitetado em **Serverless Functions** na **Vercel**
- **Supabase (PostgreSQL)** para banco de dados relacional e integridade referencial
- **Bcrypt** para segurança e hashing de senhas
- **Vercel** para hospedagem escalável e CI/CD

---

## 🚀 Como Executar Localmente

### 1. Clonar o Projeto
```bash
git clone https://github.com/SEU_USUARIO/sistcautela-banda.git
cd sistcautela-banda
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Configurar o Arquivo `.env`
Crie um arquivo `.env` a partir do `.env.example`:
```bash
cp .env.example .env
```
Preencha com as credenciais do seu banco de dados Supabase.

### 4. Iniciar o Ambiente de Desenvolvimento
```bash
npm run dev
```
Acesse `http://localhost:5173`.

---

## 🏛️ Estrutura do Código

```text
├── api/                  # Serverless API Routes (Backend Express na Vercel)
│   └── index.ts          # Rotas de Autenticação, Cautelas e Inventário
├── public/               # Ativos estáticos e brasão institucional
├── src/
│   ├── components/       # Modais de Assinatura, Prévia de PDF e Leitor QR Code
│   ├── AuthContext.tsx   # Gerenciamento de sessão e contexto de usuário
│   ├── Dashboard.tsx     # Indicadores e métricas em tempo real
│   ├── CautionArea.tsx   # Gestão e devolução de cautelas
│   ├── InventoryArea.tsx # Cadastro e controle de instrumentos
│   ├── pdfService.ts     # Serviço de geração e layout de termos em PDF
│   └── App.tsx           # Ponto de entrada e rotas da aplicação
├── vercel.json           # Configuração de rotas Serverless da Vercel
└── vite.config.ts        # Configuração do Vite
```

---

## 👨‍💻 Autor

Desenvolvido por **PABLO HENRIQUE BENEDITO SILVA CAMARGO**  
- **LinkedIn:** [Pablo Henrique
](www.linkedin.com/in/pablo-henrique-176984274)  


