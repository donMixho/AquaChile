-- Datos sintéticos de demostración: 24 candidatos y 10 solicitudes.
-- Ejecutar en Supabase > SQL Editor (corre como administrador, por lo que no le afecta el RLS).
-- Es idempotente: no duplica registros si se ejecuta más de una vez.
-- Requiere haber ejecutado antes: migracion_solicitudes.sql, migracion_estado_candidatos.sql
-- (y migracion_drive_folder_url.sql). Todos los RUT son válidos por Módulo 11 y ficticios;
-- los correos usan @ejemplo.cl para poder identificarlos y borrarlos (ver el final del archivo).

-- Candidatos: (nombre, rut, cargo, familia_cargo, email, telefono, estado, días de antigüedad)
INSERT INTO public.candidatos (nombre_completo, rut, cargo, familia_cargo, email, telefono, estado, created_at)
SELECT v.nombre_completo, v.rut, v.cargo, v.familia_cargo, v.email, v.telefono, v.estado,
       now() - (v.dias || ' days')::interval
FROM (VALUES
  ('Camila Andrea Rojas Soto', '7.936.332-4', 'Operario de Procesos', 'Operaciones', 'camila.rojas@ejemplo.cl', '9 9166 2013', 'Pendiente', 37),
  ('Matías Ignacio Fuentes Vera', '19.323.754-1', 'Operario de Envasado', 'Operaciones', 'matias.fuentes@ejemplo.cl', '9 7249 1812', 'Apto', 15),
  ('Valentina Paz Muñoz Araya', '10.281.527-0', 'Técnico en Mantención', 'Mantenimiento', 'valentina.munoz@ejemplo.cl', '9 8560 3181', 'No apto', 19),
  ('Sebastián Eduardo Contreras Pino', '16.531.986-9', 'Electromecánico', 'Mantenimiento', 'sebastian.contreras@ejemplo.cl', '9 5181 9858', 'Apto', 8),
  ('Francisca Belén Tapia Lagos', '19.078.342-1', 'Analista de Calidad', 'Calidad y Procesos', 'francisca.tapia@ejemplo.cl', '9 6527 3961', 'En proceso', 7),
  ('Diego Alonso Herrera Núñez', '19.257.631-8', 'Supervisor de Calidad', 'Calidad y Procesos', 'diego.herrera@ejemplo.cl', '9 8679 4078', 'Apto', 24),
  ('Javiera Constanza Silva Rivas', '7.408.653-5', 'Ingeniero de Procesos', 'Ingeniería', 'javiera.silva@ejemplo.cl', '9 8487 2028', 'No apto', 37),
  ('Nicolás Tomás Vargas Mora', '10.499.941-7', 'Ingeniero de Piscicultura', 'Ingeniería', 'nicolas.vargas@ejemplo.cl', '9 9070 4374', 'No apto', 32),
  ('Constanza Ignacia Reyes Bravo', '20.915.217-7', 'Asistente Administrativo', 'Administración y Soporte', 'constanza.reyes@ejemplo.cl', '9 8355 8005', 'En proceso', 21),
  ('Felipe Andrés Sandoval Ortiz', '17.311.503-2', 'Analista de Recursos Humanos', 'Administración y Soporte', 'felipe.sandoval@ejemplo.cl', '9 8796 8424', 'Apto', 24),
  ('Antonia Sofía Carrasco León', '14.529.255-7', 'Jefe de Turno', 'Jefatura', 'antonia.carrasco@ejemplo.cl', '9 6035 3945', 'Apto', 45),
  ('Cristóbal Javier Paredes Gil', '22.583.370-2', 'Jefe de Planta', 'Jefatura', 'cristobal.paredes@ejemplo.cl', '9 5999 2341', 'Apto', 37),
  ('Daniela Fernanda Cortés Maldonado', '8.259.336-5', 'Operario de Procesos', 'Operaciones', 'daniela.cortes@ejemplo.cl', '9 8302 9111', 'En proceso', 22),
  ('Rodrigo Esteban Navarro Peña', '21.738.061-8', 'Operario de Envasado', 'Operaciones', 'rodrigo.navarro@ejemplo.cl', '9 7676 5717', 'Pendiente', 39),
  ('Fernanda Alejandra Lara Campos', '10.728.106-1', 'Técnico en Mantención', 'Mantenimiento', 'fernanda.lara@ejemplo.cl', '9 4967 9387', 'En proceso', 27),
  ('Ignacio Benjamín Espinoza Toro', '12.267.604-8', 'Electromecánico', 'Mantenimiento', 'ignacio.espinoza@ejemplo.cl', '9 6802 3490', 'En proceso', 32),
  ('Catalina Isidora Figueroa Ríos', '16.574.924-3', 'Analista de Calidad', 'Calidad y Procesos', 'catalina.figueroa@ejemplo.cl', '9 4321 2271', 'Pendiente', 36),
  ('Joaquín Maximiliano Bustos Salas', '19.113.779-5', 'Supervisor de Calidad', 'Calidad y Procesos', 'joaquin.bustos@ejemplo.cl', '9 6570 6572', 'Apto', 45),
  ('Macarena Victoria Godoy Duarte', '8.468.754-5', 'Ingeniero de Procesos', 'Ingeniería', 'macarena.godoy@ejemplo.cl', '9 8869 9137', 'Pendiente', 38),
  ('Vicente Agustín Molina Cárdenas', '22.869.628-5', 'Ingeniero de Piscicultura', 'Ingeniería', 'vicente.molina@ejemplo.cl', '9 7737 2126', 'Pendiente', 6),
  ('Paula Carolina Ibáñez Zúñiga', '14.028.829-2', 'Asistente Administrativo', 'Administración y Soporte', 'paula.ibanez@ejemplo.cl', '9 7883 2064', 'No apto', 4),
  ('Gonzalo Patricio Medina Arce', '21.766.818-2', 'Analista de Recursos Humanos', 'Administración y Soporte', 'gonzalo.medina@ejemplo.cl', '9 9746 6072', 'En proceso', 42),
  ('Natalia Marcela Pizarro Vidal', '19.196.328-8', 'Jefe de Turno', 'Jefatura', 'natalia.pizarro@ejemplo.cl', '9 9580 8301', 'Pendiente', 19),
  ('Tomás Cristian Escobar Leiva', '21.523.019-8', 'Jefe de Planta', 'Jefatura', 'tomas.escobar@ejemplo.cl', '9 7160 6685', 'En proceso', 2)
) AS v(nombre_completo, rut, cargo, familia_cargo, email, telefono, estado, dias)
WHERE NOT EXISTS (SELECT 1 FROM public.candidatos c WHERE c.rut = v.rut);

-- Solicitudes de cargo
INSERT INTO public.solicitudes (titulo, cargo, familia_cargo, vacantes, estado, descripcion)
SELECT v.titulo, v.cargo, v.familia_cargo, v.vacantes, v.estado, v.descripcion
FROM (VALUES
  ('Reposición turno noche planta', 'Operario de Procesos', 'Operaciones', 3, 'Abierta', 'Tres operarios para el turno de noche de la planta de proceso.'),
  ('Refuerzo mantención mecánica', 'Técnico en Mantención', 'Mantenimiento', 1, 'En proceso', 'Técnico mecánico para el equipo de mantención preventiva.'),
  ('Control de calidad línea de filete', 'Analista de Calidad', 'Calidad y Procesos', 2, 'Abierta', 'Analistas para inspección y trazabilidad en la línea de filete.'),
  ('Ingeniero de procesos para planta', 'Ingeniero de Procesos', 'Ingeniería', 1, 'En proceso', 'Optimización de rendimiento y mejora continua de la planta.'),
  ('Apoyo administrativo en recursos humanos', 'Asistente Administrativo', 'Administración y Soporte', 2, 'Abierta', 'Gestión documental y apoyo al área de personas.'),
  ('Jefatura de turno temporada alta', 'Jefe de Turno', 'Jefatura', 2, 'Abierta', 'Jefes de turno para la temporada de mayor producción.'),
  ('Operarios de envasado', 'Operario de Envasado', 'Operaciones', 5, 'Cerrada', 'Proceso finalizado: dotación completa.'),
  ('Electromecánico para centro de cultivo', 'Electromecánico', 'Mantenimiento', 1, 'Cerrada', 'Proceso finalizado: vacante cubierta.'),
  ('Supervisor de calidad turno día', 'Supervisor de Calidad', 'Calidad y Procesos', 1, 'En proceso', 'Supervisión de controles de calidad en turno diurno.'),
  ('Ingeniero de piscicultura', 'Ingeniero de Piscicultura', 'Ingeniería', 1, 'Abierta', 'Apoyo técnico al cultivo y bienestar de los peces.')
) AS v(titulo, cargo, familia_cargo, vacantes, estado, descripcion)
WHERE NOT EXISTS (SELECT 1 FROM public.solicitudes s WHERE s.titulo = v.titulo);

-- Verificación:
-- SELECT estado, count(*) FROM public.candidatos GROUP BY estado ORDER BY estado;
-- SELECT estado, count(*) FROM public.solicitudes GROUP BY estado ORDER BY estado;

-- Para borrar SOLO los datos sintéticos (no toca candidatos reales):
-- DELETE FROM public.candidatos WHERE email LIKE '%@ejemplo.cl';
-- DELETE FROM public.solicitudes WHERE titulo IN (
--   'Reposición turno noche planta', 'Refuerzo mantención mecánica', 'Control de calidad línea de filete', 'Ingeniero de procesos para planta', 'Apoyo administrativo en recursos humanos', 'Jefatura de turno temporada alta', 'Operarios de envasado', 'Electromecánico para centro de cultivo', 'Supervisor de calidad turno día', 'Ingeniero de piscicultura');
