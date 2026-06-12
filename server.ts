import express from "express";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env file");
}

const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
app.use(express.json());

// API Routes
// Auth
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  console.log(`Tentativa de login recebida para o usuário: ${username || 'Mestre'}`);
  try {
    // 1. Verificar se a senha informada corresponde à senha mestre (access_password)
    const { data: masterPass, error: masterError } = await supabase
      .from("configuracao")
      .select("value")
      .eq("key", "access_password")
      .maybeSingle();

    if (masterError) {
      console.error("Erro ao buscar senha mestre no Supabase:", masterError);
    }

    if (masterPass && (await bcrypt.compare(password, masterPass.value))) {
      console.log("Login bem-sucedido via senha mestre");
      return res.json({ success: true, user: { username: "admin", nome_conferente: "ADMINISTRADOR" } });
    }

    // 2. Se a senha mestre não coincidir e não houver username selecionado, retorna erro
    if (!username) {
      return res.status(401).json({ success: false, error: "Senha incorreta" });
    }

    // 3. Caso contrário, busca as credenciais do conferente específico
    const { data: user, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("username", username)
      .maybeSingle();

    if (error || !user) {
      console.warn(`Usuário não encontrado: ${username}`);
      return res.status(401).json({ success: false, error: "Conferente não encontrado" });
    }

    if (await bcrypt.compare(password, user.password)) {
      console.log(`Login bem-sucedido para ${username}`);
      res.json({ success: true, user: { username: user.username, nome_conferente: user.nome_conferente } });
    } else {
      console.warn(`Senha incorreta tentada para ${username}`);
      res.status(401).json({ success: false, error: "Senha incorreta" });
    }
  } catch (e: any) {
    console.error("Erro interno no login:", e);
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/update-password", async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const { data, error: fetchError } = await supabase
      .from("configuracao")
      .select("value")
      .eq("key", "access_password")
      .single();

    if (fetchError) throw fetchError;

    const match = await bcrypt.compare(oldPassword, data.value);
    if (!match) {
      return res.status(401).json({ error: "Senha antiga incorreta" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    const { error: updateError } = await supabase
      .from("configuracao")
      .update({ value: hashedNewPassword })
      .eq("key", "access_password");

    if (updateError) throw updateError;

    res.json({ success: true });
  } catch (e: any) {
    console.error("Erro ao atualizar senha:", e);
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/update-user-password", async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;
  try {
    const { data: user, error: fetchError } = await supabase
      .from("usuarios")
      .select("password")
      .eq("username", username)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({ error: "Conferente não encontrado" });
    }

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) {
      return res.status(401).json({ error: "Senha antiga incorreta" });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    const { error: updateError } = await supabase
      .from("usuarios")
      .update({ password: hashedNewPassword })
      .eq("username", username);

    if (updateError) throw updateError;

    res.json({ success: true });
  } catch (e: any) {
    console.error("Erro ao atualizar senha do conferente:", e);
    res.status(500).json({ error: e.message });
  }
});

// Configuration
app.get("/api/config/commander-signature", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("configuracao")
      .select("value")
      .eq("key", "commander_signature")
      .maybeSingle();

    if (error) throw error;
    res.json({ signature: data ? data.value : null });
  } catch (e: any) {
    console.error("Erro ao buscar assinatura do chefe:", e);
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/config/commander-signature", async (req, res) => {
  const { signature } = req.body;
  try {
    // Check if exists
    const { data: existing } = await supabase
      .from("configuracao")
      .select("key")
      .eq("key", "commander_signature")
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("configuracao")
        .update({ value: signature })
        .eq("key", "commander_signature");
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("configuracao")
        .insert([{ key: "commander_signature", value: signature }]);
      if (error) throw error;
    }
    res.json({ success: true });
  } catch (e: any) {
    console.error("Erro ao salvar assinatura do chefe:", e);
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/config/names", async (req, res) => {
  try {
    const { data: cmdNameData } = await supabase
      .from("configuracao")
      .select("value")
      .eq("key", "commander_name")
      .maybeSingle();

    const { data: confNameData } = await supabase
      .from("configuracao")
      .select("value")
      .eq("key", "conferente_name")
      .maybeSingle();

    res.json({
      commander_name: cmdNameData ? cmdNameData.value : "CAP VALDECI",
      conferente_name: confNameData ? confNameData.value : "1S ARTHUR"
    });
  } catch (e: any) {
    console.error("Erro ao buscar nomes de configuração:", e);
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/config/names", async (req, res) => {
  const { commander_name, conferente_name } = req.body;
  try {
    // Save commander_name
    if (commander_name !== undefined) {
      const { data: existingCmd } = await supabase
        .from("configuracao")
        .select("key")
        .eq("key", "commander_name")
        .maybeSingle();

      if (existingCmd) {
        await supabase
          .from("configuracao")
          .update({ value: commander_name })
          .eq("key", "commander_name");
      } else {
        await supabase
          .from("configuracao")
          .insert([{ key: "commander_name", value: commander_name }]);
      }
    }

    // Save conferente_name
    if (conferente_name !== undefined) {
      const { data: existingConf } = await supabase
        .from("configuracao")
        .select("key")
        .eq("key", "conferente_name")
        .maybeSingle();

      if (existingConf) {
        await supabase
          .from("configuracao")
          .update({ value: conferente_name })
          .eq("key", "conferente_name");
      } else {
        await supabase
          .from("configuracao")
          .insert([{ key: "conferente_name", value: conferente_name }]);
      }
    }

    res.json({ success: true });
  } catch (e: any) {
    console.error("Erro ao salvar nomes de configuração:", e);
    res.status(500).json({ error: e.message });
  }
});

// Militares
app.get("/api/militares", async (req, res) => {
  const { data, error } = await supabase
    .from("militares")
    .select("*")
    .order("nome", { ascending: true });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.post("/api/militares", async (req, res) => {
  const { nome, saram, posto, email, telefone, endereco } = req.body;
  try {
    const { data, error } = await supabase
      .from("militares")
      .insert([{ nome, saram, posto, email, telefone, endereco }])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    console.error("Erro ao cadastrar militar:", e);
    res.status(400).json({ error: e.message });
  }
});

app.delete("/api/militares/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { data: cautelas, error: cautelaError } = await supabase
      .from("cautelas")
      .select("id")
      .eq("militar_id", id)
      .eq("status", "Ativa");

    if (cautelaError) throw cautelaError;

    if (cautelas && cautelas.length > 0) {
      return res.status(400).json({ error: "Não é possível excluir um militar com cautelas ativas." });
    }

    const { error } = await supabase
      .from("militares")
      .delete()
      .eq("id", id);

    if (error) throw error;
    res.json({ success: true });
  } catch (e: any) {
    console.error("Erro ao excluir militar:", e);
    res.status(400).json({ error: e.message });
  }
});

app.put("/api/militares/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, saram, posto, email, telefone, endereco } = req.body;
  try {
    const { error } = await supabase
      .from("militares")
      .update({ nome, saram, posto, email, telefone, endereco })
      .eq("id", id);

    if (error) throw error;
    res.json({ success: true });
  } catch (e: any) {
    console.error("Erro ao atualizar militar:", e);
    res.status(400).json({ error: e.message });
  }
});

// Materiais
app.get("/api/materiais", async (req, res) => {
  try {
    const { data: materiais, error } = await supabase
      .from("materiais")
      .select(`
        *,
        cautela_itens (
          cautelas (
            status,
            militares (nome)
          )
        )
      `)
      .order("nome", { ascending: true });

    if (error) throw error;

    // Transform to include cautelado_por
    const formatted = materiais.map((m: any) => {
      let cautelado_por = undefined;

      // Look for active caution in joined data (plural paths confirmed by diagnostic script)
      if (m.cautela_itens && Array.isArray(m.cautela_itens)) {
        const activeItem = m.cautela_itens.find((ci: any) => ci.cautelas?.status === 'Ativa');
        if (activeItem && activeItem.cautelas?.militares) {
          cautelado_por = activeItem.cautelas.militares.nome;
        }
      }

      const { cautela_itens, ...rest } = m;
      return { ...rest, cautelado_por };
    });

    res.json(formatted);
  } catch (e: any) {
    console.error("Erro ao buscar materiais:", e);
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/materiais", async (req, res) => {
  const { nome, bmp, marca, estado, tipo, subtipo, lugar } = req.body;
  try {
    const status = estado === 'Manutenção' ? 'Manutenção' : 'Disponível';
    const { data, error } = await supabase
      .from("materiais")
      .insert([{ nome, bmp, marca, estado, tipo, subtipo, lugar, status }])
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (e: any) {
    console.error("Erro ao cadastrar material:", e);
    res.status(400).json({ error: e.message });
  }
});

app.put("/api/materiais/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, bmp, marca, estado, tipo, subtipo, lugar } = req.body;
  try {
    const { data: currentMat } = await supabase.from('materiais').select('status').eq('id', id).single();
    let status = currentMat?.status || 'Disponível';
    if (status !== 'Cautelado') {
      status = estado === 'Manutenção' ? 'Manutenção' : 'Disponível';
    }
    
    const { error } = await supabase
      .from("materiais")
      .update({ nome, bmp, marca, estado, tipo, subtipo, lugar, status })
      .eq("id", id);

    if (error) throw error;
    res.json({ success: true });
  } catch (e: any) {
    console.error("Erro ao atualizar material:", e);
    res.status(400).json({ error: e.message });
  }
});

app.delete("/api/materiais/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { data: cautelas, error: cautelaError } = await supabase
      .from("cautela_itens")
      .select("cautelas!inner(status)")
      .eq("material_id", id)
      .eq("cautelas.status", "Ativa");

    if (cautelaError) throw cautelaError;

    if (cautelas && cautelas.length > 0) {
      return res.status(400).json({ error: "Não é possível excluir um material que está cautelado." });
    }

    // Foreign key with ON DELETE CASCADE handles cautela_itens
    const { error } = await supabase
      .from("materiais")
      .delete()
      .eq("id", id);

    if (error) throw error;
    res.json({ success: true });
  } catch (e: any) {
    console.error("Erro ao excluir material:", e);
    res.status(400).json({ error: e.message });
  }
});

// Cautelas
app.get("/api/cautelas", async (req, res) => {
  try {
    const { data: cautelas, error } = await supabase
      .from("cautelas")
      .select(`
        *,
        militar:militares (nome, saram, posto),
        itens:cautela_itens (
          *,
          material:materiais (nome, bmp, marca)
        )
      `)
      .order("data_cautela", { ascending: false });

    if (error) throw error;

    // Transform data to match previous contract if necessary
    const formatted = cautelas.map(c => ({
      ...c,
      militar_nome: c.militar?.nome,
      militar_saram: c.militar?.saram,
      militar_posto: c.militar?.posto,
      itens: c.itens?.map((i: any) => ({
        ...i,
        nome: i.material?.nome,
        bmp: i.material?.bmp,
        marca: i.material?.marca
      }))
    }));

    res.json(formatted);
  } catch (e: any) {
    console.error("Erro ao buscar cautelas:", e);
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/cautelas", async (req, res) => {
  const { militar_id, material_ids, observacoes, tipo, assinatura_militar, assinatura_encarregado, data_devolucao, conferente } = req.body;

  try {
    // 1. Create Cautela
    const { data: cautela, error: cautelaError } = await supabase
      .from("cautelas")
      .insert([{ militar_id, observacoes, tipo: tipo || 'Permanente', assinatura_militar, assinatura_encarregado, data_devolucao, conferente }])
      .select()
      .single();

    if (cautelaError) throw cautelaError;

    const cautelaId = cautela.id;

    // 2. Create Itens and Update Materiais
    for (const matId of material_ids) {
      const { data: material, error: matFetchError } = await supabase
        .from("materiais")
        .select("estado")
        .eq("id", matId)
        .single();

      if (matFetchError) throw matFetchError;

      const { error: itemError } = await supabase
        .from("cautela_itens")
        .insert([{ cautela_id: cautelaId, material_id: matId, estado_na_cautela: material.estado }]);

      if (itemError) throw itemError;

      const { error: matUpdateError } = await supabase
        .from("materiais")
        .update({ status: 'Cautelado' })
        .eq("id", matId);

      if (matUpdateError) throw matUpdateError;
    }

    res.json({ id: cautelaId });
  } catch (e: any) {
    console.error("Erro ao cadastrar cautela:", e);
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/cautelas/:id/baixa", async (req, res) => {
  const { id } = req.params;
  const { itens_estados, assinatura_militar, assinatura_encarregado } = req.body;

  try {
    const { data: cautelaAtual, error: fetchError } = await supabase
      .from("cautelas")
      .select("*, itens:cautela_itens(id, material_id)")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    const returnedItemIds = itens_estados.map((i: any) => i.material_id);
    const keptItems = cautelaAtual.itens.filter((i: any) => !returnedItemIds.includes(i.material_id));

    if (keptItems.length > 0) {
      const { data: newCautela, error: newCautelaError } = await supabase
        .from("cautelas")
        .insert([{
          militar_id: cautelaAtual.militar_id,
          observacoes: cautelaAtual.observacoes,
          tipo: cautelaAtual.tipo,
          data_cautela: cautelaAtual.data_cautela,
          data_devolucao: cautelaAtual.data_devolucao,
          assinatura_militar: cautelaAtual.assinatura_militar,
          assinatura_encarregado: cautelaAtual.assinatura_encarregado,
          status: 'Ativa'
        }])
        .select()
        .single();

      if (newCautelaError) throw newCautelaError;

      for (const kept of keptItems) {
        const { error: updateItemError } = await supabase
          .from("cautela_itens")
          .update({ cautela_id: newCautela.id })
          .eq("id", kept.id);
        if (updateItemError) throw updateItemError;
      }
    }

    const { error: cautelaError } = await supabase
      .from("cautelas")
      .update({
        status: 'Finalizada',
        data_baixa: new Date().toISOString(),
        assinatura_militar,
        assinatura_encarregado
      })
      .eq("id", id);

    if (cautelaError) throw cautelaError;

    for (const item of itens_estados) {
      const status = item.novo_estado === 'Manutenção' ? 'Manutenção' : 'Disponível';
      const { error: matError } = await supabase
        .from("materiais")
        .update({ estado: item.novo_estado, status: status })
        .eq("id", item.material_id);

      if (matError) throw matError;
    }

    res.json({ success: true });
  } catch (e: any) {
    console.error("Erro ao dar baixa:", e);
    res.status(400).json({ error: e.message });
  }
});

app.delete("/api/cautelas/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { data: cautela, error: fetchError } = await supabase
      .from("cautelas")
      .select("status")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;
    if (!cautela) return res.status(404).json({ error: "Cautela não encontrada." });

    if (cautela.status === 'Ativa') {
      return res.status(400).json({ error: "Não é possível excluir uma cautela ativa. Dê baixa primeiro." });
    }

    const { error } = await supabase
      .from("cautelas")
      .delete()
      .eq("id", id);

    if (error) throw error;
    res.json({ success: true });
  } catch (e: any) {
    console.error("Erro ao excluir cautela:", e);
    res.status(400).json({ error: e.message });
  }
});

// Dashboard Stats
app.get("/api/stats", async (req, res) => {
  try {
    const { count: militares } = await supabase.from("militares").select("*", { count: 'exact', head: true });
    const { count: materiais } = await supabase.from("materiais").select("*", { count: 'exact', head: true });
    const { count: cautelasAtivas } = await supabase.from("cautelas").select("*", { count: 'exact', head: true }).eq("status", "Ativa");
    const { count: emManutencao } = await supabase.from("materiais").select("*", { count: 'exact', head: true }).eq("status", "Manutenção");

    // Overdue = deadline strictly before today
    // To handle Vercel timezone (UTC), we must calculate the start of today in Brazil (UTC-3).
    const now = new Date();
    // Shift current UTC time by -3 hours to get Brazil local time
    const brazilTime = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    // Zero out the hours in Brazil time (which is conceptually UTC in this shifted object)
    brazilTime.setUTCHours(0, 0, 0, 0);
    // Now shift it back to True UTC to get the exact start of the day in UTC
    const startOfTodayInUTC = new Date(brazilTime.getTime() + 3 * 60 * 60 * 1000);

    const { count: atrasados } = await supabase
      .from("cautelas")
      .select("*", { count: 'exact', head: true })
      .eq("status", "Ativa")
      .eq("tipo", "Temporária")
      .lt("data_devolucao", startOfTodayInUTC.toISOString());

    res.json({
      militares: militares || 0,
      materiais: materiais || 0,
      cautelasAtivas: cautelasAtivas || 0,
      emManutencao: emManutencao || 0,
      atrasados: atrasados || 0
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Vite middleware for development - only run locally
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

// Only listen if not running in a serverless environment
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
