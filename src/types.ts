import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const POSTOS_GRADUACOES = [
  "Aluno (Al)",
  "Soldado de 2ª Classe (S2)",
  "Soldado de 1ª Classe (S1)",
  "Cabo",
  "Terceiro-Sargento",
  "Segundo-Sargento",
  "Primeiro-Sargento",
  "Suboficial",
  "Aspirante-a-Oficial",
  "Segundo-Tenente",
  "Primeiro-Tenente",
  "Capitão",
  "Major",
  "Coronel"
];

export const HIERARQUIA_PESOS: Record<string, number> = {
  "Coronel": 1,
  "Cel": 1,
  "Major": 2,
  "Maj": 2,
  "Capitão": 3,
  "Cap": 3,
  "Primeiro-Tenente": 4,
  "1T": 4,
  "Segundo-Tenente": 5,
  "2T": 5,
  "Aspirante-a-Oficial": 6,
  "Asp": 6,
  "Suboficial": 7,
  "SO": 7,
  "Primeiro-Sargento": 8,
  "1S": 8,
  "Segundo-Sargento": 9,
  "2S": 9,
  "Terceiro-Sargento": 10,
  "3S": 10,
  "Cabo": 11,
  "CB": 11,
  "Soldado de 1ª Classe (S1)": 12,
  "S1": 12,
  "Soldado de 2ª Classe (S2)": 13,
  "S2": 13,
  "Aluno (Al)": 14,
};

export type EstadoMaterial = 'Bom' | 'Manutenção' | 'Descarte';
export type TipoMaterial = 'Instrumento' | 'Acessório' | 'Outros';
export type StatusMaterial = 'Disponível' | 'Cautelado' | 'Manutenção';

export interface Militar {
  id: number;
  nome: string;
  saram: string;
  posto: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  created_at: string;
}

export interface Material {
  id: number;
  nome: string;
  bmp: string;
  marca?: string;
  estado: EstadoMaterial;
  tipo: TipoMaterial;
  subtipo?: string;
  lugar?: string;
  status: StatusMaterial;
  cautelado_por?: string;
  created_at: string;
}

export interface CautelaItem extends Material {
  cautela_id: number;
  material_id: number;
  estado_na_cautela: EstadoMaterial;
}

export interface Cautela {
  id: number;
  militar_id: number;
  militar_nome: string;
  militar_saram: string;
  militar_posto: string;
  data_cautela: string;
  data_baixa?: string;
  observacoes?: string;
  status: 'Ativa' | 'Finalizada';
  tipo: 'Permanente' | 'Temporária';
  data_devolucao?: string;
  assinatura_militar?: string;
  assinatura_encarregado?: string;
  conferente?: string;
  itens: CautelaItem[];
}
