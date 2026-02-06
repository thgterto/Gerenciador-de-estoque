import { describe, it, expect } from 'vitest';
import { identifyCategory } from '../utils/classificationUtils';

describe('identifyCategory', () => {
  it('should identify REAGENTES', () => {
    expect(identifyCategory('Ácido Sulfúrico')).toBe('REAGENTES');
    expect(identifyCategory('Solução de NaCl')).toBe('REAGENTES');
    expect(identifyCategory('Hidróxido de Sódio')).toBe('REAGENTES');
  });

  it('should identify VIDRARIAS', () => {
    expect(identifyCategory('Becker 500ml')).toBe('VIDRARIAS');
    expect(identifyCategory('Pipeta Graduada')).toBe('VIDRARIAS');
    expect(identifyCategory('Placa de Petri')).toBe('VIDRARIAS');
  });

  it('should identify EQUIPAMENTOS', () => {
    expect(identifyCategory('Balança Analítica')).toBe('EQUIPAMENTOS');
    expect(identifyCategory('Microscópio Ótico')).toBe('EQUIPAMENTOS');
  });

  it('should identify CONSUMIVEIS', () => {
    expect(identifyCategory('Luva de Látex')).toBe('CONSUMIVEIS');
    expect(identifyCategory('Papel Filtro')).toBe('CONSUMIVEIS');
  });

  it('should identify MEIOS DE CULTURA', () => {
    expect(identifyCategory('Agar Nutriente')).toBe('MEIOS DE CULTURA');
    expect(identifyCategory('Caldo de Cultura')).toBe('MEIOS DE CULTURA');
  });

  it('should identify PEÇAS DE REPOSIÇÃO', () => {
    expect(identifyCategory('Rolamento Esférico')).toBe('PEÇAS DE REPOSIÇÃO');
    expect(identifyCategory('Cabo de Força')).toBe('PEÇAS DE REPOSIÇÃO');
  });

  it('should identify MATERIAL DE LIMPEZA', () => {
    expect(identifyCategory('Detergente Neutro')).toBe('MATERIAL DE LIMPEZA');
    expect(identifyCategory('Saco de Lixo')).toBe('MATERIAL DE LIMPEZA');
  });

  it('should return OUTROS for unknown items', () => {
    expect(identifyCategory('Computador')).toBe('OUTROS');
    expect(identifyCategory('Cadeira de Escritório')).toBe('OUTROS');
    expect(identifyCategory('')).toBe('OUTROS');
  });

  it('should handle case insensitivity and accents', () => {
    expect(identifyCategory('acido sulfurico')).toBe('REAGENTES');
    expect(identifyCategory('BECKER')).toBe('VIDRARIAS');
  });
});
