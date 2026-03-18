-- Adicionar estatísticas ao perfil
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stat_points INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS stat_foco INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS stat_resiliencia INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS stat_networking INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS stat_malandragem INT DEFAULT 0;

-- Distribuir pontos iniciais para quem já passou do nível 1
UPDATE profiles 
SET stat_points = (level - 1) * 3 
WHERE level > 1;

-- Criar tabela de Roadmap
CREATE TABLE IF NOT EXISTS roadmap (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'done'
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  votes INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS se necessário, por ora pode ficar desligado ou público já que o App que usa.
ALTER TABLE roadmap DISABLE ROW LEVEL SECURITY;
