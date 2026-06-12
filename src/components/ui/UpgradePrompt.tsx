import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

export function ProTag({ onClick }: { onClick?: () => void }) {
  return (
    <span
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className="inline-flex items-center gap-1 text-xs font-semibold bg-hay-100 text-hay-800 border border-hay-300 rounded-full px-2 py-0.5 cursor-pointer hover:bg-hay-200 transition-colors select-none"
    >
      🔒 Pro
    </span>
  );
}

export function UpgradeModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Recurso exclusivo Pro"
      size="sm"
      footer={<Button onClick={onClose}>Entendido</Button>}
    >
      <div className="flex flex-col gap-4">
        <div className="p-4 bg-hay-50 border border-hay-200 rounded-xl text-center">
          <div className="text-3xl mb-2">🤠</div>
          <p className="font-serif font-semibold text-rope-800 text-base">
            Plano Pro
          </p>
          <p className="text-rope-500 text-sm mt-1">
            Competições e competidores ilimitados + exportação Excel
          </p>
        </div>

        <ul className="flex flex-col gap-2 text-sm text-rope-700">
          <li className="flex items-start gap-2">
            <span className="text-pasture-600 mt-0.5">✓</span>
            Competições <strong>ilimitadas</strong>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-pasture-600 mt-0.5">✓</span>
            Competidores <strong>ilimitados</strong> por competição
          </li>
          <li className="flex items-start gap-2">
            <span className="text-pasture-600 mt-0.5">✓</span>
            Exportação para <strong>Excel</strong> (qualificatória e final)
          </li>
          <li className="flex items-start gap-2">
            <span className="text-pasture-600 mt-0.5">✓</span>
            Histórico completo de competições
          </li>
        </ul>

        <p className="text-xs text-rope-400 text-center">
          Para assinar, entre em contato com o administrador.
        </p>
      </div>
    </Modal>
  );
}

export function UpgradeBadge() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <ProTag onClick={() => setOpen(true)} />
      <UpgradeModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  );
}
