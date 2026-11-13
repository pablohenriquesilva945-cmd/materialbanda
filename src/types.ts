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
  "Coronel",
  "Ten-Coronel",
];

export const HIERARQUIA_PESOS: Record<string, number> = {
  "Ten-Coronel": 1,
  "ten-cel": 1,
  "Coronel": 2,
  "Cel": 2,
  "Major": 3,
  "Maj": 3,
  "Capitão": 4,
  "Cap": 4,
  "Primeiro-Tenente": 5,
  "1T": 5,
  "Segundo-Tenente": 6,
  "2T": 6,
  "Aspirante-a-Oficial": 7,
  "Asp": 7,
  "Suboficial": 8,
  "SO": 8,
  "Primeiro-Sargento": 9,
  "1S": 9,
  "Segundo-Sargento": 10,
  "2S": 10,
  "Terceiro-Sargento": 11,
  "3S": 11,
  "Cabo": 12,
  "CB": 12,
  "Soldado de 1ª Classe (S1)": 13,
  "S1": 13,
  "Soldado de 2ª Classe (S2)": 14,
  "S2": 14,
  "Aluno (Al)": 15,
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
