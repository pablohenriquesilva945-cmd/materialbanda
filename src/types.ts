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
  "Major"
];

export const HIERARQUIA_PESOS: Record<string, number> = {
  "Major": 1,
  "Capitão": 2,
  "Cap": 2,
  "Primeiro-Tenente": 3,
  "1T": 3,
  "Segundo-Tenente": 4,
  "2T": 4,
  "Aspirante-a-Oficial": 5,
  "Asp": 5,
  "Suboficial": 6,
  "SO": 6,
  "Primeiro-Sargento": 7,
  "1S": 7,
  "Segundo-Sargento": 8,
  "2S": 8,
  "Terceiro-Sargento": 9,
  "3S": 9,
  "Cabo": 10,
  "CB": 10,
  "Soldado de 1ª Classe (S1)": 11,
  "S1": 11,
  "Soldado de 2ª Classe (S2)": 12,
  "S2": 12,
  "Aluno (Al)": 13,

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
  itens: CautelaItem[];
}
