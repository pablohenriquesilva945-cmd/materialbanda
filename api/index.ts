import express from "express";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables locally
if (process.env.NODE_ENV !== "production") {
  dotenv.config({ path: path.join(__dirname, "..", ".env") });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("ERRO: Credenciais do Supabase ausentes no ambiente!");
}

const supabase = createClient(supabaseUrl || "", supabaseKey || "");

const app = express();
app.use(express.json());

// Evitar qualquer cache indesejado nas respostas das APIs
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});

// API Routes
app.get("/api/health", async (req, res) => {
  let dbStatus = "Unknown";
  try {
    const { error } = await supabase.from("configuracao").select("key").limit(1);
    dbStatus = error ? `Error: ${error.message}` : "Connected";
  } catch (e: any) {
    dbStatus = `Exception: ${e.message}`;
  }

  res.json({
    status: "ok",
    database: dbStatus,
    supabaseUrl: supabaseUrl ? "Configured" : "Missing",
    supabaseKey: supabaseKey ? "Configured" : "Missing",
    env: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL
  });
});

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
  res.setHeader("Cache-Control", "public, s-maxage=10, stale-while-revalidate=59");
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
  res.setHeader("Cache-Control", "public, s-maxage=10, stale-while-revalidate=59");
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
    const status = estado === 'Manutenção' ? 'Manutenção' : 'Disponível';
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
  res.setHeader("Cache-Control", "public, s-maxage=5, stale-while-revalidate=30");
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
    // 1. Criar a Cautela
    const { data: cautela, error: cautelaError } = await supabase
      .from("cautelas")
      .insert([{ militar_id, observacoes, tipo: tipo || 'Permanente', assinatura_militar, assinatura_encarregado, data_devolucao, conferente }])
      .select()
      .single();

    if (cautelaError) throw cautelaError;
    const cautelaId = cautela.id;

    // 2. Buscar todos os materiais de uma só vez (Batch Fetch)
    const { data: materiaisList, error: matFetchError } = await supabase
      .from("materiais")
      .select("id, estado")
      .in("id", material_ids);

    if (matFetchError) throw matFetchError;

    const materialMap = new Map(materiaisList?.map(m => [m.id, m.estado]));
    const itensToInsert = material_ids.map((matId: number) => ({
      cautela_id: cautelaId,
      material_id: matId,
      estado_na_cautela: materialMap.get(matId) || 'Bom'
    }));

    // 3. Inserir itens em lote e atualizar status em paralelo (Parallel Batch Execution)
    const [insertItensRes, updateMatRes] = await Promise.all([
      supabase.from("cautela_itens").insert(itensToInsert),
      supabase.from("materiais").update({ status: 'Cautelado' }).in("id", material_ids)
    ]);

    if (insertItensRes.error) throw insertItensRes.error;
    if (updateMatRes.error) throw updateMatRes.error;

    // 4. Buscar a cautela recém-criada com os dados completos para retorno imediato ao frontend
    const { data: novaCautela } = await supabase
      .from("cautelas")
      .select(`
        *,
        militar:militares (nome, saram, posto),
        itens:cautela_itens (
          *,
          material:materiais (nome, bmp, marca)
        )
      `)
      .eq("id", cautelaId)
      .maybeSingle();

    let formattedCautela = null;
    if (novaCautela) {
      formattedCautela = {
        ...novaCautela,
        militar_nome: novaCautela.militar?.nome,
        militar_saram: novaCautela.militar?.saram,
        militar_posto: novaCautela.militar?.posto,
        itens: novaCautela.itens?.map((i: any) => ({
          ...i,
          nome: i.material?.nome,
          bmp: i.material?.bmp,
          marca: i.material?.marca
        })) || []
      };
    }

    res.json({ id: cautelaId, cautela: formattedCautela });
  } catch (e: any) {
    console.error("Erro ao cadastrar cautela:", e);
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/cautelas/:id/baixa", async (req, res) => {
  const { id } = req.params;
  const { itens_estados, assinatura_militar, assinatura_encarregado, conferente } = req.body;

  try {
    const { data: cautelaAtual, error: fetchError } = await supabase
      .from("cautelas")
      .select("*, itens:cautela_itens(id, material_id)")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    const returnedItemIds = itens_estados.map((i: any) => i.material_id);
    const keptItems = cautelaAtual.itens.filter((i: any) => !returnedItemIds.includes(i.material_id));

    let devolucaoCautelaId = id;

    if (keptItems.length > 0) {
      // Baixa parcial:
      // 1. Cria uma nova cautela com status 'Finalizada' (Termo de Devolução) para os itens devolvidos
      const { data: novaDevolucao, error: insertDevolucaoError } = await supabase
        .from("cautelas")
        .insert([{
          militar_id: cautelaAtual.militar_id,
          observacoes: cautelaAtual.observacoes,
          tipo: cautelaAtual.tipo,
          data_cautela: cautelaAtual.data_cautela,
          data_baixa: new Date().toISOString(),
          status: 'Finalizada',
          assinatura_militar,
          assinatura_encarregado,
          conferente: conferente || cautelaAtual.conferente
        }])
        .select()
        .single();

      if (insertDevolucaoError) throw insertDevolucaoError;
      devolucaoCautelaId = novaDevolucao.id;

      // 2. Insere os itens devolvidos associados a esta nova cautela finalizada
      const devolucaoItens = itens_estados.map((i: any) => ({
        cautela_id: novaDevolucao.id,
        material_id: i.material_id,
        estado_na_cautela: i.novo_estado || 'Bom'
      }));

      const { error: insertItensError } = await supabase
        .from("cautela_itens")
        .insert(devolucaoItens);

      if (insertItensError) throw insertItensError;

      // 3. Remove os itens devolvidos da cautela original (que permanece ativa com os itens restantes)
      const { error: deleteError } = await supabase
        .from("cautela_itens")
        .delete()
        .eq("cautela_id", id)
        .in("material_id", returnedItemIds);

      if (deleteError) throw deleteError;
    } else {
      // Baixa total: finaliza a cautela original
      const { error: cautelaError } = await supabase
        .from("cautelas")
        .update({
          status: 'Finalizada',
          data_baixa: new Date().toISOString(),
          assinatura_militar,
          assinatura_encarregado,
          conferente: conferente || cautelaAtual.conferente
        })
        .eq("id", id);

      if (cautelaError) throw cautelaError;
    }

    // 4. Atualizar materiais devolvidos agrupando por estado (Batch Update)
    const updatesByState: Record<string, number[]> = {};
    for (const item of itens_estados) {
      const state = item.novo_estado || 'Bom';
      if (!updatesByState[state]) updatesByState[state] = [];
      updatesByState[state].push(item.material_id);
    }

    await Promise.all(
      Object.entries(updatesByState).map(([estado, matIds]) => {
        const status = estado === 'Manutenção' ? 'Manutenção' : 'Disponível';
        return supabase
          .from("materiais")
          .update({ estado, status })
          .in("id", matIds);
      })
    );

    // 5. Buscar a cautela de devolução completa para retornar ao frontend
    const { data: cautelaDevolvida } = await supabase
      .from("cautelas")
      .select(`
        *,
        militar:militares (nome, saram, posto),
        itens:cautela_itens (
          *,
          material:materiais (nome, bmp, marca)
        )
      `)
      .eq("id", devolucaoCautelaId)
      .maybeSingle();

    let formattedDevolucao = null;
    if (cautelaDevolvida) {
      formattedDevolucao = {
        ...cautelaDevolvida,
        militar_nome: cautelaDevolvida.militar?.nome,
        militar_saram: cautelaDevolvida.militar?.saram,
        militar_posto: cautelaDevolvida.militar?.posto,
        itens: cautelaDevolvida.itens?.map((i: any) => ({
          ...i,
          nome: i.material?.nome,
          bmp: i.material?.bmp,
          marca: i.material?.marca
        })) || []
      };
    }

    res.json({ success: true, devolucao_id: devolucaoCautelaId, cautela: formattedDevolucao });
  } catch (e: any) {
    console.error("Erro ao dar baixa:", e);
    res.status(400).json({ error: e.message });
  }
});

app.post("/api/cautelas/:id/adicionar-item", async (req, res) => {
  const { id } = req.params;
  const { material_id, material_ids, assinatura_militar, assinatura_encarregado, conferente } = req.body;

  try {
    const idsToAdd: number[] = Array.isArray(material_ids) && material_ids.length > 0
      ? material_ids
      : (material_id ? [material_id] : []);

    if (idsToAdd.length === 0) {
      return res.status(400).json({ error: "Nenhum material selecionado." });
    }

    // 1. Buscar os materiais
    const { data: materiais, error: matFetchError } = await supabase
      .from("materiais")
      .select("id, estado, status")
      .in("id", idsToAdd);

    if (matFetchError) throw matFetchError;
    if (!materiais || materiais.length === 0) {
      return res.status(404).json({ error: "Materiais não encontrados." });
    }

    const jaCautelados = materiais.filter(m => m.status === 'Cautelado');
    if (jaCautelados.length > 0) {
      return res.status(400).json({ error: "Um ou mais materiais selecionados já estão cautelados." });
    }

    // 2. Inserir itens e atualizar materiais/cautela
    const cautelaItensInserts = materiais.map(m => ({
      cautela_id: id,
      material_id: m.id,
      estado_na_cautela: m.estado
    }));

    const [itemRes, matUpdateRes, cautelaUpdateRes] = await Promise.all([
      supabase.from("cautela_itens").insert(cautelaItensInserts),
      supabase.from("materiais").update({ status: 'Cautelado' }).in("id", idsToAdd),
      supabase.from("cautelas").update({
        assinatura_militar,
        assinatura_encarregado,
        conferente,
        data_cautela: new Date().toISOString()
      }).eq("id", id)
    ]);

    if (itemRes.error) throw itemRes.error;
    if (matUpdateRes.error) throw matUpdateRes.error;
    if (cautelaUpdateRes.error) throw cautelaUpdateRes.error;

    res.json({ success: true });
  } catch (e: any) {
    console.error("Erro ao adicionar item à cautela:", e);
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

// Dashboard Stats (Executado 100% em paralelo)
app.get("/api/stats", async (req, res) => {
  res.setHeader("Cache-Control", "public, s-maxage=5, stale-while-revalidate=30");
  try {
    const now = new Date();
    const brazilTime = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    brazilTime.setUTCHours(0, 0, 0, 0);
    const startOfTodayInUTC = new Date(brazilTime.getTime() + 3 * 60 * 60 * 1000);

    const [militaresRes, materiaisRes, cautelasAtivasRes, emManutencaoRes, atrasadosRes] = await Promise.all([
      supabase.from("militares").select("*", { count: 'exact', head: true }),
      supabase.from("materiais").select("*", { count: 'exact', head: true }),
      supabase.from("cautelas").select("*", { count: 'exact', head: true }).eq("status", "Ativa"),
      supabase.from("materiais").select("*", { count: 'exact', head: true }).eq("status", "Manutenção"),
      supabase.from("cautelas")
        .select("*", { count: 'exact', head: true })
        .eq("status", "Ativa")
        .eq("tipo", "Temporária")
        .lt("data_devolucao", startOfTodayInUTC.toISOString())
    ]);

    res.json({
      militares: militaresRes.count || 0,
      materiais: materiaisRes.count || 0,
      cautelasAtivas: cautelasAtivasRes.count || 0,
      emManutencao: emManutencaoRes.count || 0,
      atrasados: atrasadosRes.count || 0
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default app;
