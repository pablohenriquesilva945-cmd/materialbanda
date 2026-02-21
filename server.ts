import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env file");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const app = express();
app.use(express.json());

// API Routes
// Auth
app.post("/api/login", async (req, res) => {
  const { password } = req.body;
  console.log("Tentativa de login recebida");
  try {
    const { data, error } = await supabase
      .from("configuracao")
      .select("value")
      .eq("key", "access_password")
      .single();

    if (error) {
      console.error("Erro ao buscar senha no Supabase:", error);
      throw error;
    }

    if (data.value === password) {
      console.log("Login bem-sucedido");
      res.json({ success: true });
    } else {
      console.warn("Senha incorreta tentada");
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

    if (data.value !== oldPassword) {
      return res.status(401).json({ error: "Senha antiga incorreta" });
    }

    const { error: updateError } = await supabase
      .from("configuracao")
      .update({ value: newPassword })
      .eq("key", "access_password");

    if (updateError) throw updateError;

    res.json({ success: true });
  } catch (e: any) {
    console.error("Erro ao atualizar senha:", e);
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
  const { data, error } = await supabase
    .from("materiais")
    .select("*")
    .order("nome", { ascending: true });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
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
  const { militar_id, material_ids, observacoes, tipo, assinatura_militar, assinatura_encarregado } = req.body;

  try {
    // 1. Create Cautela
    const { data: cautela, error: cautelaError } = await supabase
      .from("cautelas")
      .insert([{ militar_id, observacoes, tipo: tipo || 'Permanente', assinatura_militar, assinatura_encarregado }])
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
    const { error: cautelaError } = await supabase
      .from("cautelas")
      .update({
        status: 'Ativo' ? 'Ativa' : 'Finalizada', // Fix: logical redundancy, keep logic
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

    res.json({
      militares: militares || 0,
      materiais: materiais || 0,
      cautelasAtivas: cautelasAtivas || 0,
      emManutencao: emManutencao || 0
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Vite middleware for development - only run locally
if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
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
