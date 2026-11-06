/**
 * build.js — Gera a versão publicável do Tutor.IA offline.
 *
 * Por que existe
 * --------------
 * O arquivo-fonte (tutoria_offline_online.html) guarda a configuração da equipe em
 * texto, para funcionar aberto do disco, sem internet e sem build. Para
 * publicar, este script reescreve APENAS o bloco de configuração a partir das
 * variáveis de ambiente e grava o resultado em dist/index.html. Assim as
 * chaves não precisam ficar versionadas no repositório.
 *
 * Variáveis de ambiente
 * ---------------------
 *   SUPABASE_URL        obrigatório para gravar no banco
 *   SUPABASE_KEY        chave publicável (sb_publishable_...) ou anon legada
 *   SUPABASE_TABELA     opcional (padrão: avaliacoes_flim)
 *   PAINEL_HABILITADO   'true' para incluir o painel da equipe. PADRÃO: false
 *   SENHA_PAINEL        só usada quando PAINEL_HABILITADO=true
 *
 * Uso no Render (Static Site) ou na Vercel:
 *   Build command:      node build.js
 *   Publish directory:  dist
 *
 * Sobre segredo: a chave e a senha chegam ao navegador para a página
 * funcionar, então qualquer pessoa consegue lê-las no código entregue.
 * Variável de ambiente evita commitar, NÃO torna o valor secreto. Por isso o
 * padrão aqui é publicar SEM painel: o que não existe na página pública não
 * tem senha para ser descoberta.
 */
const fs = require('fs');
const path = require('path');

const ORIGEM = process.env.ARQUIVO_FONTE || 'tutoria_offline_online.html';
const SAIDA_DIR = 'dist';
const INI = '/* ==== INICIO CONFIG ==== */';
const FIM = '/* ==== FIM CONFIG ==== */';

const painel = String(process.env.PAINEL_HABILITADO || 'false').toLowerCase() === 'true';
const cfg = {
  painelHabilitado: painel,
  senhaPainel: process.env.SENHA_PAINEL || '',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseKey: process.env.SUPABASE_KEY || '',
  tabela: process.env.SUPABASE_TABELA || 'avaliacoes_flim'
};

const html = fs.readFileSync(ORIGEM, 'utf8');
const i = html.indexOf(INI);
const f = html.indexOf(FIM);
if (i === -1 || f === -1) {
  console.error(`Marcadores de configuração não encontrados em ${ORIGEM}.`);
  process.exit(1);
}

const bloco = `${INI}
/* Bloco gerado por build.js em ${new Date().toISOString()} — não editar aqui. */
const CONFIG = ${JSON.stringify(cfg, null, 2)};
${FIM}`;

fs.mkdirSync(SAIDA_DIR, { recursive: true });
fs.writeFileSync(path.join(SAIDA_DIR, 'index.html'), html.slice(0, i) + bloco + html.slice(f + FIM.length));

const aviso = [];
if (!cfg.supabaseUrl || !cfg.supabaseKey)
  aviso.push('SEM Supabase: as respostas ficarão só no navegador de quem responder.');
if (cfg.painelHabilitado && !cfg.senhaPainel)
  aviso.push('PAINEL HABILITADO SEM SENHA: qualquer visitante abre o painel.');

console.log(`dist/index.html gerado a partir de ${ORIGEM}`);
console.log(`  painel da equipe: ${cfg.painelHabilitado ? 'INCLUÍDO' : 'removido'}`);
console.log(`  Supabase: ${cfg.supabaseUrl ? cfg.supabaseUrl : '(não configurado)'}`);
console.log(`  tabela: ${cfg.tabela}`);
aviso.forEach(a => console.warn('  AVISO: ' + a));
