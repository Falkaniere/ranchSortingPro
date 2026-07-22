import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Página inicial pública (marketing) do Ranch Sorting Pro.
 * É o que o visitante não autenticado vê ao acessar a raiz "/".
 */
export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-dust-100 font-sans text-rope-700">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-saddle-800 text-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl leading-none">🤠</span>
            <span className="font-serif font-bold text-lg tracking-tight">
              Ranch Sorting Pro
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-sm text-saddle-200">
            <a href="#recursos" className="hover:text-white transition-colors">Recursos</a>
            <a href="#como-funciona" className="hover:text-white transition-colors">Como funciona</a>
            <a href="#planos" className="hover:text-white transition-colors">Planos</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="h-9 px-3 sm:px-4 rounded-lg flex items-center font-semibold text-sm text-white hover:bg-saddle-700 transition-colors"
            >
              Entrar
            </Link>
            <Link
              to="/register"
              className="h-9 px-4 sm:px-5 rounded-lg flex items-center font-semibold text-sm bg-saddle-600 hover:bg-saddle-500 border border-saddle-700 transition-colors"
            >
              Criar conta
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-5 sm:px-8 py-20 sm:py-28 bg-gradient-to-b from-dust-50 to-dust-100">
        <div className="max-w-3xl mx-auto flex flex-col items-center text-center gap-6">
          <span className="inline-flex items-center font-mono font-bold text-[11px] tracking-wide uppercase text-hay-700 bg-hay-200 border border-hay-300 px-3 py-1.5 rounded-full">
            Feito para cronometristas e organizadores
          </span>
          <h1 className="font-serif font-extrabold text-4xl sm:text-5xl leading-tight text-rope-700">
            Gerencie suas provas de ranch sorting sem perder tempo no cronômetro
          </h1>
          <p className="text-base sm:text-lg leading-relaxed text-rope-400 max-w-xl">
            Registro de passadas em um único comando, duplas organizadas e resultados
            em tempo real — tudo num painel só, pensado para o dia da prova.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-2 w-full sm:w-auto">
            <Link
              to="/register"
              className="h-12 px-7 rounded-lg flex items-center justify-center font-bold text-[15px] text-white bg-saddle-600 hover:bg-saddle-700 border border-saddle-700 shadow-sm transition-colors"
            >
              Criar minha primeira competição
            </Link>
            <a
              href="#como-funciona"
              className="h-12 px-7 rounded-lg flex items-center justify-center font-semibold text-[15px] text-saddle-800 border border-dust-400 bg-white hover:bg-dust-50 transition-colors"
            >
              Ver como funciona
            </a>
          </div>
        </div>
      </section>

      {/* Recursos */}
      <section id="recursos" className="px-5 sm:px-8 py-16 sm:py-20 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif font-extrabold text-2xl sm:text-3xl text-rope-700 text-center mb-3">
            Feito para o ritmo da arena
          </h2>
          <p className="text-sm sm:text-base text-rope-400 text-center mb-12 max-w-xl mx-auto">
            As três dores mais comuns de quem cronometra e organiza provas, resolvidas.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="border border-dust-300 rounded-2xl p-7 hover:shadow-md hover:border-saddle-200 transition-all"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-serif font-bold text-lg text-rope-700 mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-rope-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="px-5 sm:px-8 py-16 sm:py-20 bg-dust-100">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif font-extrabold text-2xl sm:text-3xl text-rope-700 text-center mb-3">
            Da inscrição ao resultado, em três passos
          </h2>
          <p className="text-sm sm:text-base text-rope-400 text-center mb-12 max-w-xl mx-auto">
            Um fluxo direto para você montar e conduzir a prova sem travas.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <div key={s.title} className="flex flex-col gap-3">
                <div className="w-10 h-10 rounded-full bg-saddle-600 text-white font-serif font-bold flex items-center justify-center shadow-sm">
                  {i + 1}
                </div>
                <h3 className="font-serif font-bold text-lg text-rope-700">{s.title}</h3>
                <p className="text-sm text-rope-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="px-5 sm:px-8 py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif font-extrabold text-2xl sm:text-3xl text-rope-700 text-center mb-3">
            Comece de graça
          </h2>
          <p className="text-sm sm:text-base text-rope-400 text-center mb-12 max-w-xl mx-auto">
            Monte sua primeira competição sem custo e evolua quando precisar de mais.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Free */}
            <div className="border border-dust-300 rounded-2xl p-8 flex flex-col">
              <h3 className="font-serif font-bold text-xl text-rope-700">Gratuito</h3>
              <p className="text-sm text-rope-400 mt-1 mb-5">Para começar e organizar suas primeiras provas.</p>
              <div className="font-serif font-extrabold text-3xl text-rope-700 mb-6">
                R$ 0<span className="text-base font-sans font-medium text-rope-400">/mês</span>
              </div>
              <ul className="flex flex-col gap-2.5 text-sm text-rope-500 mb-8">
                {['Registro de duplas e passadas', 'Classificação em tempo real', 'Exportação de resultados'].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-pasture-500 mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className="mt-auto h-11 rounded-lg flex items-center justify-center font-semibold text-sm text-saddle-800 border border-dust-400 bg-white hover:bg-dust-50 transition-colors"
              >
                Criar conta gratuita
              </Link>
            </div>

            {/* Pro */}
            <div className="border-2 border-saddle-600 rounded-2xl p-8 flex flex-col relative shadow-sm">
              <span className="absolute -top-3 left-8 bg-hay-300 text-hay-800 text-[11px] font-bold uppercase tracking-wide px-3 py-1 rounded-full border border-hay-400">
                Recomendado
              </span>
              <h3 className="font-serif font-bold text-xl text-rope-700">Pro</h3>
              <p className="text-sm text-rope-400 mt-1 mb-5">Para quem organiza provas com frequência.</p>
              <div className="font-serif font-extrabold text-3xl text-rope-700 mb-6">
                Sob consulta
              </div>
              <ul className="flex flex-col gap-2.5 text-sm text-rope-500 mb-8">
                {['Tudo do plano gratuito', 'Finais e rodadas ilimitadas', 'Portal do competidor', 'Suporte prioritário'].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-pasture-500 mt-0.5">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/register"
                className="mt-auto h-11 rounded-lg flex items-center justify-center font-bold text-sm text-white bg-saddle-600 hover:bg-saddle-700 border border-saddle-700 shadow-sm transition-colors"
              >
                Começar agora
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="px-5 sm:px-8 py-16 sm:py-20 text-center bg-saddle-800 text-white">
        <h2 className="font-serif font-extrabold text-2xl sm:text-3xl mb-3">
          Pronto para agilizar sua próxima prova?
        </h2>
        <p className="text-sm sm:text-base text-saddle-200 mb-8 max-w-md mx-auto">
          Crie sua conta e monte a primeira competição em minutos.
        </p>
        <Link
          to="/register"
          className="inline-flex h-12 px-8 rounded-lg items-center justify-center font-bold text-[15px] text-white bg-saddle-600 hover:bg-saddle-500 border border-saddle-700 transition-colors"
        >
          Criar conta gratuita
        </Link>
      </section>

      {/* Footer */}
      <footer className="px-5 sm:px-8 py-8 bg-dust-100 border-t border-dust-300">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-rope-400">
          <span>© {new Date().getFullYear()} Ranch Sorting Pro</span>
          <div className="flex items-center gap-5">
            <Link to="/competitor" className="hover:text-saddle-700 transition-colors">
              Portal do competidor
            </Link>
            <Link to="/login" className="hover:text-saddle-700 transition-colors">
              Entrar
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

const FEATURES = [
  {
    icon: '⏱️',
    title: 'Registro em um comando',
    desc: 'Digite dupla e tempo numa única linha — sem trocar de campo, sem perder o cronômetro de vista.',
  },
  {
    icon: '🤝',
    title: 'Duplas sempre à mão',
    desc: 'Troque duplas e confira inscrições sem sair do fluxo de registro da prova.',
  },
  {
    icon: '🏆',
    title: 'Resultado em tempo real',
    desc: 'Classificação atualizada a cada passada, pronta para compartilhar com os competidores.',
  },
];

const STEPS = [
  {
    title: 'Crie a competição',
    desc: 'Cadastre a prova, defina as rodadas e abra as inscrições em poucos cliques.',
  },
  {
    title: 'Registre as passadas',
    desc: 'Durante a prova, lance boi cantado, quantidade e tempo direto do painel.',
  },
  {
    title: 'Compartilhe o resultado',
    desc: 'A classificação atualiza sozinha e fica pronta para exportar e divulgar.',
  },
];
