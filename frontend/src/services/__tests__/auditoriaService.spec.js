import { supabase } from '../supabaseClient';
import { camposModificados, obtenerRegistrosAuditoria } from '../auditoriaService';

describe('auditoriaService', () => {
  it('lee los últimos registros, del más nuevo al más antiguo.', async () => {
    const limit = jasmine.createSpy('limit').and.resolveTo({ data: [{ id: 1 }], error: null });
    const order = jasmine.createSpy('order').and.returnValue({ limit });
    const from = spyOn(supabase, 'from').and.returnValue({ select: () => ({ order }) });

    expect(await obtenerRegistrosAuditoria({ limite: 50 })).toEqual([{ id: 1 }]);
    expect(from).toHaveBeenCalledWith('log_auditoria');
    expect(order).toHaveBeenCalledWith('creado_en', { ascending: false });
    expect(limit).toHaveBeenCalledWith(50);
  });

  it('indica qué migración falta si la tabla no existe.', async () => {
    spyOn(supabase, 'from').and.returnValue({
      select: () => ({ order: () => ({ limit: () => Promise.resolve({ data: null, error: { code: 'PGRST205', message: 'x' } }) }) })
    });

    await expectAsync(obtenerRegistrosAuditoria()).toBeRejectedWithError(/migracion_auditoria\.sql/);
  });

  it('lista solo los campos que cambiaron en una actualización.', () => {
    const registro = {
      accion: 'ACTUALIZAR',
      datos_antes: { id: 1, estado: 'Nuevo', nombre: 'Ana' },
      datos_despues: { id: 1, estado: 'Apto', nombre: 'Ana' }
    };

    expect(camposModificados(registro)).toEqual(['estado']);
    expect(camposModificados({ accion: 'CREAR', datos_despues: { id: 1 } })).toEqual([]);
  });
});
