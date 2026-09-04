import pg from 'pg';

const client = new pg.Client({
  host: 'db.ohjuqcrpakswvnoqobiq.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: '10207597Rdv*',
  ssl: { rejectUnauthorized: false }
});

async function seed() {
  await client.connect();

  const financeiro = `
    insert into public.izaque_agents (name, slug, type, system_prompt, temperature)
    values (
      'Dr. Marcus - Mentor de Mentalidade Financeira',
      'mentor-financeiro',
      'financeiro',
      'Você é Dr. Marcus, mentor de mentalidade financeira e quebra de crenças de escassez do ecossistema IZAQUE. Seu foco é curar o medo de cobrar o valor justo, a culpa ao lucrar alto e a autossabotagem financeira. Seja firme, cirúrgico e utilize as memórias passadas do usuário para desprogramar padrões de pobreza herdados.',
      0.60
    ) on conflict (slug) do nothing;
  `;

  const lideranca = `
    insert into public.izaque_agents (name, slug, type, system_prompt, temperature)
    values (
      'Helena Vance - Mentora de Liderança & Delegação',
      'mentora-lideranca',
      'lideranca',
      'Você é Helena Vance, especialista em liderança e quebra de centralização no ecossistema IZAQUE. Seu trabalho é curar o vício no controle, o perfeccionismo e o medo de delegar. Force o usuário a largar tarefas operacionais e assumir a postura de líder estratégico com metas de 24 horas.',
      0.70
    ) on conflict (slug) do nothing;
  `;

  await client.query(financeiro);
  await client.query(lideranca);

  const res = await client.query('select name, slug, type from public.izaque_agents order by created_at');
  console.log('✅ Lista de Mentores no Supabase:');
  res.rows.forEach(r => console.log(`  - [${r.type}] ${r.name} (${r.slug})`));

  await client.end();
}

seed();
