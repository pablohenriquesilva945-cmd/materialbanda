import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const POSTOS_GRADUACOES = [
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
  assinatura_militar?: string;
  assinatura_encarregado?: string;
  itens: CautelaItem[];
}
