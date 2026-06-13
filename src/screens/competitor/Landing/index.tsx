import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';

export default function CompetitorLanding() {
  return (
    <div className="min-h-screen bg-dust-100 flex flex-col">
      {/* Hero */}
      <div className="bg-saddle-800 text-white py-20 px-6 flex-1 flex items-center justify-center">
        <div className="max-w-2xl text-center">
          <div className="text-7xl mb-6">🐄</div>
          <h1 className="font-serif font-bold text-4xl md:text-5xl mb-4 leading-tight">
            Portal do Competidor
          </h1>
          <p className="text-saddle-200 text-lg mb-10 max-w-xl mx-auto">
            Acesse seu histórico de competições, passadas e resultados de Ranch Sorting — em um só lugar.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/competitor/search">
              <Button variant="secondary" size="lg">
                Buscar meu perfil
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="text-white border-white hover:bg-saddle-700">
                Entrar / Criar conta
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-white py-16 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <span className="text-4xl">📋</span>
            <h3 className="font-serif font-semibold text-rope-800 text-lg">Histórico completo</h3>
            <p className="text-rope-400 text-sm">
              Veja todas as suas passadas em qualificatórias e finais, organizadas por competição.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <span className="text-4xl">🏆</span>
            <h3 className="font-serif font-semibold text-rope-800 text-lg">Resultados</h3>
            <p className="text-rope-400 text-sm">
              Acompanhe seu desempenho e resultados nas competições em que participou.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <span className="text-4xl">🔗</span>
            <h3 className="font-serif font-semibold text-rope-800 text-lg">Sem burocracia</h3>
            <p className="text-rope-400 text-sm">
              Você não precisa de conta para competir. Crie seu acesso depois, a qualquer hora.
            </p>
          </div>
        </div>
      </div>

      <footer className="bg-dust-200 text-center text-rope-400 text-xs py-4">
        Ranch Sorting Pro · Portal do Competidor
      </footer>
    </div>
  );
}
