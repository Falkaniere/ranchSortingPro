import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signUp, UserType } from '../../services/firebase/auth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toast';

const PERSONAS: { value: UserType; label: string; hint: string; icon: string }[] = [
  { value: 'competitor', label: 'Competidor', hint: 'Quero me inscrever em provas', icon: '🐴' },
  { value: 'organizer', label: 'Gerente de provas', hint: 'Quero organizar e gerenciar provas', icon: '🏟️' },
];

export default function RegisterScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [userType, setUserType] = useState<UserType>('competitor');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Informe seu nome';
    if (!email) e.email = 'Informe o e-mail';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'E-mail inválido';
    if (!password) e.password = 'Informe a senha';
    else if (password.length < 6) e.password = 'Mínimo 6 caracteres';
    if (password !== confirm) e.confirm = 'Senhas não coincidem';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(evt: React.FormEvent) {
    evt.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await signUp(name.trim(), email, password, userType);
      toast('Conta criada com sucesso!', 'success');
      navigate(userType === 'competitor' ? '/competitor/provas' : '/');
    } catch (err: any) {
      const msg =
        err.code === 'auth/email-already-in-use'
          ? 'Este e-mail já está cadastrado'
          : 'Erro ao criar conta. Tente novamente.';
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-dust-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <span className="text-5xl">🤠</span>
          <h1 className="font-serif font-bold text-rope-800 text-2xl mt-2">Ranch Sorting Pro</h1>
        </div>

        <div className="bg-white rounded-2xl border border-dust-300 shadow-sm p-8">
          <h2 className="font-serif font-semibold text-rope-800 text-xl mb-1">Criar conta</h2>
          <p className="text-rope-400 text-sm mb-6">Cadastre-se para competir ou gerenciar provas</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-medium text-rope-700 mb-2">Como você vai usar?</p>
              <div className="grid grid-cols-2 gap-2">
                {PERSONAS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setUserType(p.value)}
                    title={p.hint}
                    className={[
                      'flex flex-col items-center gap-1 px-3 py-3 rounded-lg border text-center transition-all',
                      userType === p.value
                        ? 'bg-saddle-600 text-white border-saddle-700 shadow-sm'
                        : 'bg-white text-rope-600 border-dust-300 hover:border-saddle-400',
                    ].join(' ')}
                  >
                    <span className="text-xl">{p.icon}</span>
                    <span className="text-sm font-medium leading-tight">{p.label}</span>
                    <span className={[
                      'text-[11px] leading-tight',
                      userType === p.value ? 'text-saddle-100' : 'text-rope-400',
                    ].join(' ')}>{p.hint}</span>
                  </button>
                ))}
              </div>
            </div>
            <Input
              label="Nome completo"
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              autoComplete="name"
            />
            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              autoComplete="email"
            />
            <Input
              label="Senha"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              autoComplete="new-password"
            />
            <Input
              label="Confirmar senha"
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              error={errors.confirm}
              autoComplete="new-password"
            />

            <Button type="submit" fullWidth loading={loading} size="lg" className="mt-2">
              Criar conta
            </Button>
          </form>

          <p className="text-center text-sm text-rope-400 mt-6">
            Já tem conta?{' '}
            <Link to="/login" className="text-saddle-600 hover:text-saddle-800 font-medium">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
